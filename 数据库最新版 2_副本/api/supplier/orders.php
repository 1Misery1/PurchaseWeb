<?php
/**
 * Summit Gear & Adventures - Supplier Orders API
 * 
 * Get purchase orders for a supplier using v_supplier_orders view
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

$supplierId = intval($_GET['supplier_id'] ?? 0);
$status = sanitize($_GET['status'] ?? '');

if ($supplierId <= 0) {
    sendResponse(false, null, "Supplier ID is required", 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Get orders using view
    $sql = "SELECT * FROM v_supplier_orders WHERE supplier_id = :supplier_id";
    $params = [':supplier_id' => $supplierId];
    
    if (!empty($status)) {
        $sql .= " AND status = :status";
        $params[':status'] = $status;
    }
    
    $sql .= " ORDER BY order_date DESC";
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $orders = $stmt->fetchAll();
    
    // Get order items for each order
    foreach ($orders as &$order) {
        $itemsSql = "SELECT * FROM v_supplier_order_items WHERE po_id = :po_id";
        $itemsStmt = $conn->prepare($itemsSql);
        $itemsStmt->bindParam(':po_id', $order['po_id']);
        $itemsStmt->execute();
        $order['items'] = $itemsStmt->fetchAll();
    }
    
    // Get summary stats
    $statsSql = "SELECT 
                    COUNT(*) as total_orders,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
                    SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
                    SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
                    SUM(total_amount) as total_value
                 FROM v_supplier_orders 
                 WHERE supplier_id = :supplier_id";
    
    $statsStmt = $conn->prepare($statsSql);
    $statsStmt->bindParam(':supplier_id', $supplierId);
    $statsStmt->execute();
    $stats = $statsStmt->fetch();
    
    $response = [
        'orders' => $orders,
        'stats' => $stats
    ];
    
    sendResponse(true, $response, "Orders retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Supplier Orders Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve orders", 500);
}
?>

