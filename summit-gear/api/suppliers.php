<?php
/**
 * Summit Gear & Adventures - Suppliers API
 * 
 * Endpoints:
 * GET /api/suppliers.php - Get all suppliers
 * GET /api/suppliers.php?id=1 - Get single supplier
 * POST /api/suppliers.php?action=login - Supplier login
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        getSuppliers($pdo);
        break;
    case 'POST':
        if ($action === 'login') {
            loginSupplier($pdo);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getSuppliers($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        
        $sql = "
            SELECT 
                s.supplier_id,
                s.name,
                s.contact_person,
                s.email,
                s.phone,
                s.address,
                s.city,
                s.country,
                s.is_active,
                (SELECT COUNT(*) FROM Product p WHERE p.supplier_id = s.supplier_id AND p.status = 'Active') AS product_count,
                (SELECT COUNT(*) FROM Purchase_Order po WHERE po.supplier_id = s.supplier_id AND po.status IN ('Pending', 'Confirmed', 'Shipped')) AS active_orders
            FROM Supplier s
            WHERE s.is_active = TRUE
        ";
        
        $params = [];
        
        if ($id) {
            $sql .= " AND s.supplier_id = ?";
            $params[] = $id;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $suppliers = $stmt->fetchAll();
        
        if ($id && count($suppliers) === 1) {
            // Get supplier's products
            $productsSql = "
                SELECT product_id, sku, name, brand, category, cost_price, retail_price, status
                FROM Product WHERE supplier_id = ?
            ";
            $productsStmt = $pdo->prepare($productsSql);
            $productsStmt->execute([$id]);
            $suppliers[0]['products'] = $productsStmt->fetchAll();
            
            sendResponse(['success' => true, 'data' => $suppliers[0]]);
        } else {
            sendResponse(['success' => true, 'data' => $suppliers, 'count' => count($suppliers)]);
        }
        
    } catch (PDOException $e) {
        error_log("Suppliers API error: " . $e->getMessage());
        sendError('Failed to fetch suppliers', 500);
    }
}

function loginSupplier($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['email', 'password'])) {
            sendError('Email and password are required');
        }
        
        $sql = "
            SELECT 
                s.supplier_id,
                s.name,
                s.contact_person,
                s.email,
                s.password_hash,
                s.phone,
                s.address,
                s.city,
                s.country,
                (SELECT COUNT(*) FROM Product p WHERE p.supplier_id = s.supplier_id AND p.status = 'Active') AS product_count,
                (SELECT COUNT(*) FROM Purchase_Order po WHERE po.supplier_id = s.supplier_id AND po.status IN ('Pending', 'Confirmed', 'Shipped')) AS active_orders,
                (SELECT SUM(po.total_amount) FROM Purchase_Order po WHERE po.supplier_id = s.supplier_id AND po.payment_status = 'Unpaid') AS pending_payment
            FROM Supplier s
            WHERE s.email = ? AND s.is_active = TRUE
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$data['email']]);
        $supplier = $stmt->fetch();
        
        if (!$supplier) {
            sendError('Invalid email or password', 401);
        }
        
        // For demo, accept default passwords or actual password verification
        $isDefaultPassword = in_array($supplier['password_hash'], ['hash123', 'default_hash']);
        $isMatchingPassword = ($supplier['password_hash'] === $data['password']);
        $isVerifiedPassword = password_verify($data['password'], $supplier['password_hash']);
        
        // Allow login if: using default password with 'hash123' input, or password matches, or password_verify passes
        if (!($isDefaultPassword && $data['password'] === 'hash123') && 
            !$isMatchingPassword && 
            !$isVerifiedPassword) {
            sendError('Invalid email or password', 401);
        }
        
        unset($supplier['password_hash']);
        
        sendResponse([
            'success' => true,
            'message' => 'Login successful',
            'data' => $supplier
        ]);
        
    } catch (PDOException $e) {
        error_log("Supplier login error: " . $e->getMessage());
        sendError('Login failed', 500);
    }
}
?>

