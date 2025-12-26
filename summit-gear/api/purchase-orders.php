<?php
/**
 * Summit Gear & Adventures - Purchase Orders API (For Suppliers)
 * 
 * Endpoints:
 * GET /api/purchase-orders.php - Get all purchase orders
 * GET /api/purchase-orders.php?supplier_id=1 - Get supplier's orders
 * GET /api/purchase-orders.php?id=1 - Get single PO with items
 * PUT /api/purchase-orders.php - Update PO status (confirm, ship, etc.)
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getPurchaseOrders($pdo);
        break;
    case 'PUT':
        updatePurchaseOrder($pdo);
        break;
    case 'POST':
        $action = $_GET['action'] ?? null;
        if ($action === 'create') {
            createPurchaseOrder($pdo);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getPurchaseOrders($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        $supplierId = $_GET['supplier_id'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $sql = "
            SELECT 
                po.po_id,
                po.po_number,
                po.supplier_id,
                s.name AS supplier_name,
                s.contact_person,
                s.email AS supplier_email,
                po.employee_id,
                e.name AS ordered_by,
                po.branch_id,
                b.branch_name,
                b.address AS branch_address,
                b.city AS branch_city,
                po.order_date,
                po.expected_date,
                po.received_date,
                po.total_amount,
                po.status,
                po.payment_status,
                po.notes
            FROM Purchase_Order po
            JOIN Supplier s ON po.supplier_id = s.supplier_id
            JOIN Employee e ON po.employee_id = e.employee_id
            JOIN Branch b ON po.branch_id = b.branch_id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($id) {
            $sql .= " AND po.po_id = ?";
            $params[] = $id;
        }
        
        if ($supplierId) {
            $sql .= " AND po.supplier_id = ?";
            $params[] = $supplierId;
        }
        
        if ($status) {
            $sql .= " AND po.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY po.order_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        
        // If getting single order, include items
        if ($id && count($orders) === 1) {
            $itemsSql = "
                SELECT 
                    poi.po_item_id,
                    poi.product_id,
                    p.name AS product_name,
                    p.sku,
                    p.brand,
                    poi.quantity,
                    poi.received_qty,
                    poi.unit_price,
                    poi.total_price
                FROM Purchase_Order_Item poi
                JOIN Product p ON poi.product_id = p.product_id
                WHERE poi.po_id = ?
            ";
            $itemsStmt = $pdo->prepare($itemsSql);
            $itemsStmt->execute([$id]);
            $orders[0]['items'] = $itemsStmt->fetchAll();
            
            sendResponse(['success' => true, 'data' => $orders[0]]);
        } else {
            // For list view, include item summaries
            foreach ($orders as &$order) {
                $itemsSql = "
                    SELECT 
                        poi.product_id,
                        p.name AS product_name,
                        p.sku,
                        poi.quantity,
                        poi.received_qty,
                        poi.unit_price,
                        poi.total_price
                    FROM Purchase_Order_Item poi
                    JOIN Product p ON poi.product_id = p.product_id
                    WHERE poi.po_id = ?
                ";
                $itemsStmt = $pdo->prepare($itemsSql);
                $itemsStmt->execute([$order['po_id']]);
                $order['items'] = $itemsStmt->fetchAll();
            }
            
            sendResponse(['success' => true, 'data' => $orders, 'count' => count($orders)]);
        }
        
    } catch (PDOException $e) {
        error_log("Purchase Orders API error: " . $e->getMessage());
        sendError('Failed to fetch purchase orders', 500);
    }
}

function updatePurchaseOrder($pdo) {
    try {
        $data = getRequestBody();
        
        if (!isset($data['po_id'])) {
            sendError('PO ID is required');
        }
        
        $poId = $data['po_id'];
        $updates = [];
        $params = [];
        
        // Status update
        if (isset($data['status'])) {
            $validStatuses = ['Draft', 'Pending', 'Confirmed', 'Shipped', 'Received', 'Cancelled'];
            if (!in_array($data['status'], $validStatuses)) {
                sendError('Invalid status');
            }
            $updates[] = "status = ?";
            $params[] = $data['status'];
            
            // If shipped, record tracking info
            if ($data['status'] === 'Shipped' && isset($data['tracking_number'])) {
                $updates[] = "notes = CONCAT(COALESCE(notes, ''), '\nTracking: " . $data['tracking_number'] . " via " . ($data['carrier'] ?? 'Unknown') . "')";
            }
            
            // If received, set received date
            if ($data['status'] === 'Received') {
                $updates[] = "received_date = CURDATE()";
            }
        }
        
        // Payment status update
        if (isset($data['payment_status'])) {
            $validPaymentStatuses = ['Unpaid', 'Partial', 'Paid'];
            if (!in_array($data['payment_status'], $validPaymentStatuses)) {
                sendError('Invalid payment status');
            }
            $updates[] = "payment_status = ?";
            $params[] = $data['payment_status'];
        }
        
        // Notes update
        if (isset($data['notes'])) {
            $updates[] = "notes = ?";
            $params[] = $data['notes'];
        }
        
        if (empty($updates)) {
            sendError('No valid updates provided');
        }
        
        $params[] = $poId;
        
        $sql = "UPDATE Purchase_Order SET " . implode(', ', $updates) . " WHERE po_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        if ($stmt->rowCount() === 0) {
            sendError('Purchase order not found', 404);
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Purchase order updated successfully'
        ]);
        
    } catch (PDOException $e) {
        error_log("Update PO error: " . $e->getMessage());
        sendError('Failed to update purchase order', 500);
    }
}

function createPurchaseOrder($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['supplier_id', 'branch_id', 'items'])) {
            sendError('Supplier ID, branch ID and items are required');
        }
        
        if (empty($data['items'])) {
            sendError('Order must have at least one item');
        }
        
        $pdo->beginTransaction();
        
        // Generate PO number
        $poNumber = 'PO-' . date('Y') . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
        
        // Calculate total
        $totalAmount = 0;
        foreach ($data['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['unit_price'];
        }
        
        // Insert PO
        $insertSql = "
            INSERT INTO Purchase_Order (
                po_number, supplier_id, employee_id, branch_id,
                order_date, expected_date, total_amount, status, payment_status, notes
            ) VALUES (?, ?, ?, ?, CURDATE(), ?, ?, 'Pending', 'Unpaid', ?)
        ";
        
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $poNumber,
            $data['supplier_id'],
            $data['employee_id'] ?? 3,  // Default to inventory staff
            $data['branch_id'],
            $data['expected_date'] ?? date('Y-m-d', strtotime('+14 days')),
            $totalAmount,
            $data['notes'] ?? null
        ]);
        
        $poId = $pdo->lastInsertId();
        
        // Insert items
        $insertItemSql = "
            INSERT INTO Purchase_Order_Item (po_id, product_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, ?, ?)
        ";
        $itemStmt = $pdo->prepare($insertItemSql);
        
        foreach ($data['items'] as $item) {
            $itemTotal = $item['quantity'] * $item['unit_price'];
            $itemStmt->execute([
                $poId,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'],
                $itemTotal
            ]);
        }
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => 'Purchase order created',
            'data' => [
                'po_id' => $poId,
                'po_number' => $poNumber,
                'total_amount' => $totalAmount
            ]
        ], 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Create PO error: " . $e->getMessage());
        sendError('Failed to create purchase order', 500);
    }
}
?>

