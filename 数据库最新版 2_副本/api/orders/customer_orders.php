<?php
/**
 * Summit Gear & Adventures - Customer Orders API
 * 
 * Get customer order history using v_customer_orders view
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

$customerId = intval($_GET['customer_id'] ?? 0);

if ($customerId <= 0) {
    sendResponse(false, null, "Customer ID is required", 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Get orders using view
    $sql = "SELECT * FROM v_customer_orders 
            WHERE customer_id = :customer_id 
            ORDER BY order_date DESC";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':customer_id', $customerId);
    $stmt->execute();
    
    $orders = $stmt->fetchAll();
    
    // Get order items for each order
    foreach ($orders as &$order) {
        $itemsSql = "SELECT soi.*, p.name as product_name, p.sku, p.brand
                     FROM Sales_Order_Item soi
                     JOIN Product p ON soi.product_id = p.product_id
                     WHERE soi.order_id = :order_id";
        
        $itemsStmt = $conn->prepare($itemsSql);
        $itemsStmt->bindParam(':order_id', $order['order_id']);
        $itemsStmt->execute();
        
        $order['items'] = $itemsStmt->fetchAll();
    }
    
    // Get summary stats
    $statsSql = "SELECT 
                    COUNT(*) as total_orders,
                    SUM(final_amount) as total_spent,
                    AVG(final_amount) as avg_order_value,
                    SUM(points_earned) as total_points_earned
                 FROM v_customer_orders 
                 WHERE customer_id = :customer_id AND status = 'Completed'";
    
    $statsStmt = $conn->prepare($statsSql);
    $statsStmt->bindParam(':customer_id', $customerId);
    $statsStmt->execute();
    
    $stats = $statsStmt->fetch();
    
    $response = [
        'orders' => $orders,
        'stats' => $stats
    ];
    
    sendResponse(true, $response, "Orders retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Customer Orders Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve orders", 500);
}
?>

