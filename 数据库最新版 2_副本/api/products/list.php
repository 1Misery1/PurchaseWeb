<?php
/**
 * Summit Gear & Adventures - Products API
 * 
 * Get products list using v_customer_products view
 * Supports filtering by category, brand, search term
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

// Get query parameters
$category = sanitize($_GET['category'] ?? '');
$brand = sanitize($_GET['brand'] ?? '');
$search = sanitize($_GET['search'] ?? '');
$minPrice = floatval($_GET['min_price'] ?? 0);
$maxPrice = floatval($_GET['max_price'] ?? 999999);
$inStockOnly = isset($_GET['in_stock']) && $_GET['in_stock'] === 'true';
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
$offset = ($page - 1) * $limit;

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Build query using the view
    $sql = "SELECT * FROM v_customer_products WHERE 1=1";
    $countSql = "SELECT COUNT(*) as total FROM v_customer_products WHERE 1=1";
    $params = [];
    
    // Apply filters
    if (!empty($category)) {
        $sql .= " AND category = :category";
        $countSql .= " AND category = :category";
        $params[':category'] = $category;
    }
    
    if (!empty($brand)) {
        $sql .= " AND brand = :brand";
        $countSql .= " AND brand = :brand";
        $params[':brand'] = $brand;
    }
    
    if (!empty($search)) {
        $sql .= " AND (product_name LIKE :search OR brand LIKE :search2 OR sku LIKE :search3)";
        $countSql .= " AND (product_name LIKE :search OR brand LIKE :search2 OR sku LIKE :search3)";
        $searchTerm = "%$search%";
        $params[':search'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
    }
    
    if ($minPrice > 0) {
        $sql .= " AND retail_price >= :min_price";
        $countSql .= " AND retail_price >= :min_price";
        $params[':min_price'] = $minPrice;
    }
    
    if ($maxPrice < 999999) {
        $sql .= " AND retail_price <= :max_price";
        $countSql .= " AND retail_price <= :max_price";
        $params[':max_price'] = $maxPrice;
    }
    
    if ($inStockOnly) {
        $sql .= " AND available_qty > 0";
        $countSql .= " AND available_qty > 0";
    }
    
    // Get total count
    $countStmt = $conn->prepare($countSql);
    foreach ($params as $key => $value) {
        $countStmt->bindValue($key, $value);
    }
    $countStmt->execute();
    $totalCount = $countStmt->fetch()['total'];
    
    // Add pagination and ordering
    $sql .= " ORDER BY product_name ASC LIMIT :limit OFFSET :offset";
    
    $stmt = $conn->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $products = $stmt->fetchAll();
    
    // Get available categories and brands for filters
    $categoriesSql = "SELECT DISTINCT category FROM Product WHERE status = 'Active' ORDER BY category";
    $categoriesStmt = $conn->prepare($categoriesSql);
    $categoriesStmt->execute();
    $categories = $categoriesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $brandsSql = "SELECT DISTINCT brand FROM Product WHERE status = 'Active' ORDER BY brand";
    $brandsStmt = $conn->prepare($brandsSql);
    $brandsStmt->execute();
    $brands = $brandsStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $response = [
        'products' => $products,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $totalCount,
            'total_pages' => ceil($totalCount / $limit)
        ],
        'filters' => [
            'categories' => $categories,
            'brands' => $brands
        ]
    ];
    
    sendResponse(true, $response, "Products retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Products List Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve products", 500);
}
?>

