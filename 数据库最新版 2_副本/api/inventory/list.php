<?php
/**
 * Summit Gear & Adventures - Inventory List API
 * 
 * Get inventory for a branch using v_staff_inventory view
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

$branchId = intval($_GET['branch_id'] ?? 1);
$category = sanitize($_GET['category'] ?? '');
$status = sanitize($_GET['status'] ?? '');
$search = sanitize($_GET['search'] ?? '');

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Get inventory using view
    $sql = "SELECT * FROM v_staff_inventory WHERE branch_id = :branch_id";
    $params = [':branch_id' => $branchId];
    
    if (!empty($category)) {
        $sql .= " AND category = :category";
        $params[':category'] = $category;
    }
    
    if (!empty($status)) {
        $sql .= " AND status = :status";
        $params[':status'] = $status;
    }
    
    if (!empty($search)) {
        $sql .= " AND (product_name LIKE :search OR sku LIKE :search2 OR batch_no LIKE :search3)";
        $searchTerm = "%$search%";
        $params[':search'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
    }
    
    $sql .= " ORDER BY product_name ASC";
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    
    $inventory = $stmt->fetchAll();
    
    // Get summary stats
    $statsSql = "SELECT 
                    COUNT(DISTINCT product_name) as total_products,
                    SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END) as total_units,
                    SUM(stock_value) as total_value,
                    SUM(CASE WHEN quantity < 10 AND status = 'In Stock' THEN 1 ELSE 0 END) as low_stock_count
                 FROM v_staff_inventory 
                 WHERE branch_id = :branch_id";
    
    $statsStmt = $conn->prepare($statsSql);
    $statsStmt->bindParam(':branch_id', $branchId);
    $statsStmt->execute();
    $stats = $statsStmt->fetch();
    
    // Get low stock alerts
    $alertsSql = "SELECT * FROM v_low_stock_alert WHERE branch_id = :branch_id ORDER BY current_stock ASC LIMIT 10";
    $alertsStmt = $conn->prepare($alertsSql);
    $alertsStmt->bindParam(':branch_id', $branchId);
    $alertsStmt->execute();
    $alerts = $alertsStmt->fetchAll();
    
    $response = [
        'inventory' => $inventory,
        'stats' => $stats,
        'low_stock_alerts' => $alerts
    ];
    
    sendResponse(true, $response, "Inventory retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Inventory List Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve inventory", 500);
}
?>

