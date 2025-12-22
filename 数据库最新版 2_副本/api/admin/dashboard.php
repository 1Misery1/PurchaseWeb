<?php
/**
 * Summit Gear & Adventures - Admin Dashboard API
 * 
 * Get dashboard statistics using various views
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

$branchId = intval($_GET['branch_id'] ?? 0);
$dateRange = sanitize($_GET['range'] ?? 'today');

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Determine date filter
    switch ($dateRange) {
        case 'week':
            $dateFilter = "DATE(order_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
            break;
        case 'month':
            $dateFilter = "DATE(order_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
            break;
        case 'today':
        default:
            $dateFilter = "DATE(order_date) = CURDATE()";
    }
    
    // Sales summary
    $salesSql = "SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(final_amount), 0) as total_revenue,
                    COALESCE(AVG(final_amount), 0) as avg_order_value,
                    COUNT(DISTINCT customer_id) as unique_customers
                 FROM Sales_Order 
                 WHERE status = 'Completed' AND $dateFilter";
    
    if ($branchId > 0) {
        $salesSql .= " AND branch_id = :branch_id";
    }
    
    $salesStmt = $conn->prepare($salesSql);
    if ($branchId > 0) {
        $salesStmt->bindParam(':branch_id', $branchId);
    }
    $salesStmt->execute();
    $salesStats = $salesStmt->fetch();
    
    // Inventory summary
    $inventorySql = "SELECT 
                        COUNT(DISTINCT product_id) as total_products,
                        SUM(total_qty) as total_units,
                        COUNT(CASE WHEN total_qty < 10 THEN 1 END) as low_stock_count,
                        COUNT(CASE WHEN total_qty = 0 THEN 1 END) as out_of_stock_count
                     FROM v_branch_stock";
    
    if ($branchId > 0) {
        $inventorySql .= " WHERE branch_id = :branch_id";
    }
    
    $inventoryStmt = $conn->prepare($inventorySql);
    if ($branchId > 0) {
        $inventoryStmt->bindParam(':branch_id', $branchId);
    }
    $inventoryStmt->execute();
    $inventoryStats = $inventoryStmt->fetch();
    
    // Staff summary
    $staffSql = "SELECT 
                    COUNT(*) as total_staff,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_staff
                 FROM Employee";
    
    if ($branchId > 0) {
        $staffSql .= " WHERE branch_id = :branch_id";
    }
    
    $staffStmt = $conn->prepare($staffSql);
    if ($branchId > 0) {
        $staffStmt->bindParam(':branch_id', $branchId);
    }
    $staffStmt->execute();
    $staffStats = $staffStmt->fetch();
    
    // Customer summary
    $customerSql = "SELECT 
                        COUNT(*) as total_customers,
                        COUNT(CASE WHEN membership_id IS NOT NULL THEN 1 END) as members,
                        SUM(total_points) as total_points_outstanding
                    FROM Customer WHERE is_active = TRUE";
    $customerStmt = $conn->prepare($customerSql);
    $customerStmt->execute();
    $customerStats = $customerStmt->fetch();
    
    // Top products (using advanced query)
    $topProductsSql = "SELECT product_name, category, units_sold, revenue, revenue_rank
                       FROM v_advanced_product_ranking 
                       WHERE revenue_rank <= 5";
    if ($branchId > 0) {
        $topProductsSql .= " AND branch_id = :branch_id";
    }
    $topProductsSql .= " ORDER BY revenue_rank";
    
    $topProductsStmt = $conn->prepare($topProductsSql);
    if ($branchId > 0) {
        $topProductsStmt->bindParam(':branch_id', $branchId);
    }
    $topProductsStmt->execute();
    $topProducts = $topProductsStmt->fetchAll();
    
    // Recent orders
    $recentOrdersSql = "SELECT so.order_id, so.order_number, so.order_date, so.final_amount, 
                               so.status, c.name as customer_name, e.name as staff_name
                        FROM Sales_Order so
                        JOIN Customer c ON so.customer_id = c.customer_id
                        JOIN Employee e ON so.employee_id = e.employee_id
                        WHERE $dateFilter";
    if ($branchId > 0) {
        $recentOrdersSql .= " AND so.branch_id = :branch_id";
    }
    $recentOrdersSql .= " ORDER BY so.order_date DESC LIMIT 10";
    
    $recentOrdersStmt = $conn->prepare($recentOrdersSql);
    if ($branchId > 0) {
        $recentOrdersStmt->bindParam(':branch_id', $branchId);
    }
    $recentOrdersStmt->execute();
    $recentOrders = $recentOrdersStmt->fetchAll();
    
    // Low stock alerts
    $alertsSql = "SELECT * FROM v_low_stock_alert";
    if ($branchId > 0) {
        $alertsSql .= " WHERE branch_id = :branch_id";
    }
    $alertsSql .= " LIMIT 10";
    
    $alertsStmt = $conn->prepare($alertsSql);
    if ($branchId > 0) {
        $alertsStmt->bindParam(':branch_id', $branchId);
    }
    $alertsStmt->execute();
    $lowStockAlerts = $alertsStmt->fetchAll();
    
    $response = [
        'sales' => $salesStats,
        'inventory' => $inventoryStats,
        'staff' => $staffStats,
        'customers' => $customerStats,
        'top_products' => $topProducts,
        'recent_orders' => $recentOrders,
        'low_stock_alerts' => $lowStockAlerts,
        'date_range' => $dateRange
    ];
    
    sendResponse(true, $response, "Dashboard data retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Admin Dashboard Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve dashboard data", 500);
}
?>

