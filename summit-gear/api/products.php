<?php
/**
 * Summit Gear & Adventures - Products API
 * 
 * Endpoints:
 * GET /api/products.php - Get all products
 * GET /api/products.php?id=1 - Get single product
 * GET /api/products.php?category=Camping - Filter by category
 * GET /api/products.php?supplier_id=1 - Filter by supplier
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getProducts($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getProducts($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        $category = $_GET['category'] ?? null;
        $brand = $_GET['brand'] ?? null;
        $supplierId = $_GET['supplier_id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        // Build query using the customer products view
        $sql = "
            SELECT 
                p.product_id,
                p.sku,
                p.name,
                p.brand,
                p.category,
                p.description,
                p.cost_price,
                p.retail_price,
                p.weight_kg,
                p.dimensions,
                p.color,
                p.size,
                p.supplier_id,
                p.status,
                s.name AS supplier_name,
                COALESCE(stock.total_qty, 0) AS stock_quantity,
                CASE 
                    WHEN COALESCE(stock.total_qty, 0) > 10 THEN 'In Stock'
                    WHEN COALESCE(stock.total_qty, 0) > 0 THEN 'Low Stock'
                    ELSE 'Out of Stock'
                END AS stock_status
            FROM Product p
            LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
            LEFT JOIN (
                SELECT product_id, SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END) AS total_qty
                FROM StockItem
                GROUP BY product_id
            ) stock ON p.product_id = stock.product_id
            WHERE p.status = 'Active'
        ";
        
        $params = [];
        
        if ($id) {
            $sql .= " AND p.product_id = ?";
            $params[] = $id;
        }
        
        if ($category) {
            $sql .= " AND p.category = ?";
            $params[] = $category;
        }
        
        if ($brand) {
            $sql .= " AND p.brand = ?";
            $params[] = $brand;
        }
        
        if ($supplierId) {
            $sql .= " AND p.supplier_id = ?";
            $params[] = $supplierId;
        }
        
        if ($search) {
            $sql .= " AND (p.name LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $sql .= " ORDER BY p.product_id ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        if ($id && count($products) === 1) {
            // Return single product
            sendResponse(['success' => true, 'data' => $products[0]]);
        } else {
            sendResponse(['success' => true, 'data' => $products, 'count' => count($products)]);
        }
        
    } catch (PDOException $e) {
        error_log("Products API error: " . $e->getMessage());
        sendError('Failed to fetch products', 500);
    }
}
?>

