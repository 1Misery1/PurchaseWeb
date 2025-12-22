<?php
/**
 * Summit Gear & Adventures - Product Detail API
 * 
 * Get single product details with stock info by branch
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse(false, null, "Method not allowed", 405);
}

$productId = intval($_GET['id'] ?? 0);

if ($productId <= 0) {
    sendResponse(false, null, "Product ID is required", 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Get product details
    $sql = "SELECT p.*, s.name as supplier_name 
            FROM Product p
            JOIN Supplier s ON p.supplier_id = s.supplier_id
            WHERE p.product_id = :id AND p.status = 'Active'";
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':id', $productId);
    $stmt->execute();
    
    $product = $stmt->fetch();
    
    if (!$product) {
        sendResponse(false, null, "Product not found", 404);
    }
    
    // Get stock by branch using view
    $stockSql = "SELECT branch_id, branch_name, total_qty, stock_value
                 FROM v_branch_stock 
                 WHERE product_id = :id AND total_qty > 0";
    
    $stockStmt = $conn->prepare($stockSql);
    $stockStmt->bindParam(':id', $productId);
    $stockStmt->execute();
    
    $product['stock_by_branch'] = $stockStmt->fetchAll();
    
    // Calculate total available
    $product['total_available'] = array_sum(array_column($product['stock_by_branch'], 'total_qty'));
    
    // Get related products (same category)
    $relatedSql = "SELECT product_id, sku, name, brand, retail_price, available_qty
                   FROM v_customer_products 
                   WHERE category = :category AND product_id != :id
                   LIMIT 4";
    
    $relatedStmt = $conn->prepare($relatedSql);
    $relatedStmt->bindParam(':category', $product['category']);
    $relatedStmt->bindParam(':id', $productId);
    $relatedStmt->execute();
    
    $product['related_products'] = $relatedStmt->fetchAll();
    
    sendResponse(true, $product, "Product details retrieved successfully");
    
} catch (PDOException $e) {
    error_log("Product Detail Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to retrieve product details", 500);
}
?>

