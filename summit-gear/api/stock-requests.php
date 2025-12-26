<?php
/**
 * Stock Requests API
 * Inventory Admin creates requests, Suppliers see and respond
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getStockRequests($pdo);
        break;
    case 'POST':
        createStockRequest($pdo);
        break;
    case 'PUT':
        updateStockRequest($pdo);
        break;
    case 'DELETE':
        deleteStockRequest($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getStockRequests($pdo) {
    try {
        $supplierId = $_GET['supplier_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $branchId = $_GET['branch_id'] ?? null;
        
        $sql = "SELECT sr.*, 
                       p.name as product_name, p.sku, p.category, p.cost_price,
                       (p.cost_price * sr.requested_quantity) as total_amount,
                       s.name as supplier_name,
                       b.branch_name,
                       e.name as requested_by_name
                FROM Stock_Request sr
                JOIN Product p ON sr.product_id = p.product_id
                JOIN Supplier s ON sr.supplier_id = s.supplier_id
                JOIN Branch b ON sr.branch_id = b.branch_id
                LEFT JOIN Employee e ON sr.requested_by = e.employee_id
                WHERE 1=1";
        
        $params = [];
        
        if ($supplierId) {
            $sql .= " AND sr.supplier_id = ?";
            $params[] = $supplierId;
        }
        
        if ($status) {
            $sql .= " AND sr.status = ?";
            $params[] = $status;
        }
        
        if ($branchId) {
            $sql .= " AND sr.branch_id = ?";
            $params[] = $branchId;
        }
        
        $sql .= " ORDER BY 
                  CASE sr.urgency 
                      WHEN 'Critical' THEN 1 
                      WHEN 'High' THEN 2 
                      WHEN 'Medium' THEN 3 
                      ELSE 4 
                  END,
                  sr.requested_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $requests, 'count' => count($requests)]);
    } catch (PDOException $e) {
        sendError('Failed to fetch stock requests: ' . $e->getMessage(), 500);
    }
}

function createStockRequest($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Get current stock for reference
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END), 0) as current_stock
            FROM StockItem WHERE product_id = ? AND branch_id = ?
        ");
        $stmt->execute([$data['product_id'], $data['branch_id']]);
        $currentStock = $stmt->fetch()['current_stock'];
        
        // Get supplier_id from product
        $stmt = $pdo->prepare("SELECT supplier_id FROM Product WHERE product_id = ?");
        $stmt->execute([$data['product_id']]);
        $product = $stmt->fetch();
        
        if (!$product || !$product['supplier_id']) {
            sendError('Product not found or no supplier assigned', 400);
            return;
        }
        
        $stmt = $pdo->prepare("
            INSERT INTO Stock_Request (product_id, supplier_id, branch_id, requested_quantity, current_stock, urgency, notes, requested_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['product_id'],
            $product['supplier_id'],
            $data['branch_id'],
            $data['requested_quantity'],
            $currentStock,
            $data['urgency'] ?? 'Medium',
            $data['notes'] ?? null,
            $data['requested_by'] ?? null
        ]);
        
        sendResponse(['success' => true, 'message' => 'Stock request created', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        sendError('Failed to create stock request: ' . $e->getMessage(), 500);
    }
}

function updateStockRequest($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['request_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            sendError('Request ID required', 400);
            return;
        }
        
        $now = date('Y-m-d H:i:s');
        
        // Handle payment_status update separately
        if (isset($data['payment_status']) && !isset($data['status'])) {
            $stmt = $pdo->prepare("UPDATE Stock_Request SET payment_status = ? WHERE request_id = ?");
            $stmt->execute([$data['payment_status'], $id]);
            sendResponse(['success' => true, 'message' => 'Payment status updated']);
            return;
        }
        
        $status = $data['status'] ?? null;
        if (!$status) {
            sendError('Status required', 400);
            return;
        }
        
        $sql = "UPDATE Stock_Request SET status = ?";
        $params = [$status];
        
        if ($status === 'In Transit') {
            $sql .= ", acknowledged_at = ?";
            $params[] = $now;
        } elseif ($status === 'Completed') {
            $sql .= ", completed_at = ?";
            $params[] = $now;
        }
        
        if (isset($data['notes'])) {
            $sql .= ", notes = ?";
            $params[] = $data['notes'];
        }
        
        $sql .= " WHERE request_id = ?";
        $params[] = $id;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // If completing with stock update, add inventory
        if ($status === 'Completed' && isset($data['update_stock']) && $data['update_stock']) {
            $productId = $data['product_id'];
            $branchId = $data['branch_id'];
            $quantity = intval($data['quantity']);
            
            // Check if stock item exists for this product/branch
            $checkStmt = $pdo->prepare("SELECT stock_id, quantity FROM StockItem WHERE product_id = ? AND branch_id = ? AND status = 'In Stock' LIMIT 1");
            $checkStmt->execute([$productId, $branchId]);
            $existingStock = $checkStmt->fetch();
            
            if ($existingStock) {
                // Update existing stock
                $updateStmt = $pdo->prepare("UPDATE StockItem SET quantity = quantity + ? WHERE stock_id = ?");
                $updateStmt->execute([$quantity, $existingStock['stock_id']]);
            } else {
                // Create new stock item with required fields
                $batchNo = 'SR-' . date('Ymd') . '-' . $id;  // Generate batch number from request ID
                $today = date('Y-m-d');
                
                // Get product cost price
                $costStmt = $pdo->prepare("SELECT cost_price FROM Product WHERE product_id = ?");
                $costStmt->execute([$productId]);
                $product = $costStmt->fetch();
                $unitCost = $product ? $product['cost_price'] : 0;
                
                $insertStmt = $pdo->prepare("
                    INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, received_date, unit_cost, status) 
                    VALUES (?, ?, ?, ?, ?, ?, 'In Stock')
                ");
                $insertStmt->execute([$batchNo, $productId, $branchId, $quantity, $today, $unitCost]);
            }
            
            sendResponse(['success' => true, 'message' => "Stock request completed. Added $quantity units to inventory."]);
            return;
        }
        
        sendResponse(['success' => true, 'message' => 'Stock request updated']);
    } catch (PDOException $e) {
        sendError('Failed to update stock request: ' . $e->getMessage(), 500);
    }
}

function deleteStockRequest($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) { sendError('Request ID required', 400); return; }
        
        $stmt = $pdo->prepare("DELETE FROM Stock_Request WHERE request_id = ?");
        $stmt->execute([$id]);
        
        sendResponse(['success' => true, 'message' => 'Stock request deleted']);
    } catch (PDOException $e) {
        sendError('Failed to delete stock request: ' . $e->getMessage(), 500);
    }
}
?>

