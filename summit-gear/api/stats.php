<?php
/**
 * Summit Gear & Adventures - Statistics API
 * 
 * Get sales statistics for suppliers
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

$supplierId = $_GET['supplier_id'] ?? null;

try {
    $response = [
        'success' => true,
        'data' => []
    ];
    
    // Get supplier's products
    $productsSql = "SELECT product_id FROM Product WHERE supplier_id = ?";
    $productsStmt = $pdo->prepare($productsSql);
    $productsStmt->execute([$supplierId]);
    $productIds = $productsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    if (empty($productIds)) {
        // No products for this supplier
        $response['data'] = [
            'this_month_revenue' => 0,
            'last_month_revenue' => 0,
            'growth_percent' => 0,
            'top_products' => [],
            'total_orders' => 0,
            'pending_orders' => 0
        ];
        sendResponse($response);
    }
    
    $placeholders = implode(',', array_fill(0, count($productIds), '?'));
    
    // This month's revenue from sales containing supplier's products
    $thisMonthSql = "
        SELECT COALESCE(SUM(soi.total_price), 0) as revenue
        FROM Sales_Order_Item soi
        JOIN Sales_Order so ON soi.order_id = so.order_id
        WHERE soi.product_id IN ({$placeholders})
        AND so.status = 'Completed'
        AND MONTH(so.order_date) = MONTH(CURRENT_DATE())
        AND YEAR(so.order_date) = YEAR(CURRENT_DATE())
    ";
    $thisMonthStmt = $pdo->prepare($thisMonthSql);
    $thisMonthStmt->execute($productIds);
    $thisMonthRevenue = $thisMonthStmt->fetch()['revenue'];
    
    // Last month's revenue
    $lastMonthSql = "
        SELECT COALESCE(SUM(soi.total_price), 0) as revenue
        FROM Sales_Order_Item soi
        JOIN Sales_Order so ON soi.order_id = so.order_id
        WHERE soi.product_id IN ({$placeholders})
        AND so.status = 'Completed'
        AND MONTH(so.order_date) = MONTH(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
        AND YEAR(so.order_date) = YEAR(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH))
    ";
    $lastMonthStmt = $pdo->prepare($lastMonthSql);
    $lastMonthStmt->execute($productIds);
    $lastMonthRevenue = $lastMonthStmt->fetch()['revenue'];
    
    // Calculate growth
    $growth = 0;
    if ($lastMonthRevenue > 0) {
        $growth = (($thisMonthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100;
    }
    
    // Top selling products
    $topProductsSql = "
        SELECT 
            p.product_id,
            p.name,
            p.sku,
            COALESCE(SUM(soi.quantity), 0) as units_sold,
            COALESCE(SUM(soi.total_price), 0) as revenue
        FROM Product p
        LEFT JOIN Sales_Order_Item soi ON p.product_id = soi.product_id
        LEFT JOIN Sales_Order so ON soi.order_id = so.order_id AND so.status = 'Completed'
        WHERE p.supplier_id = ?
        GROUP BY p.product_id, p.name, p.sku
        ORDER BY units_sold DESC
        LIMIT 5
    ";
    $topProductsStmt = $pdo->prepare($topProductsSql);
    $topProductsStmt->execute([$supplierId]);
    $topProducts = $topProductsStmt->fetchAll();
    
    // Purchase order stats
    $poStatsSql = "
        SELECT 
            COUNT(*) as total_orders,
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_orders,
            SUM(CASE WHEN status = 'Confirmed' THEN 1 ELSE 0 END) as confirmed_orders,
            SUM(CASE WHEN status = 'Shipped' THEN 1 ELSE 0 END) as shipped_orders,
            COALESCE(SUM(CASE WHEN payment_status = 'Unpaid' THEN total_amount ELSE 0 END), 0) as pending_payment
        FROM Purchase_Order
        WHERE supplier_id = ?
    ";
    $poStatsStmt = $pdo->prepare($poStatsSql);
    $poStatsStmt->execute([$supplierId]);
    $poStats = $poStatsStmt->fetch();
    
    $response['data'] = [
        'this_month_revenue' => floatval($thisMonthRevenue),
        'last_month_revenue' => floatval($lastMonthRevenue),
        'growth_percent' => round($growth, 1),
        'top_products' => $topProducts,
        'total_orders' => intval($poStats['total_orders']),
        'pending_orders' => intval($poStats['pending_orders']),
        'confirmed_orders' => intval($poStats['confirmed_orders']),
        'shipped_orders' => intval($poStats['shipped_orders']),
        'pending_payment' => floatval($poStats['pending_payment'])
    ];
    
    sendResponse($response);
    
} catch (PDOException $e) {
    error_log("Stats API error: " . $e->getMessage());
    sendError('Failed to fetch statistics: ' . $e->getMessage(), 500);
}
?>

