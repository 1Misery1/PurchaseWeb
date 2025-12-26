<?php
/**
 * Stock/Inventory API Endpoint
 * Handles inventory queries for staff portal
 * Updated to match actual database schema
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

include 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($method) {
    case 'GET':
        if ($action === 'list') {
            // Get stock items for a branch
            $branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 1;
            $category = isset($_GET['category']) ? $_GET['category'] : '';
            $status = isset($_GET['status']) ? $_GET['status'] : '';
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            $sql = "
                SELECT 
                    p.product_id,
                    p.name as product_name,
                    p.category,
                    p.retail_price as unit_price,
                    p.description,
                    COALESCE(SUM(si.quantity), 0) as current_stock,
                    10 as reorder_level,
                    CASE 
                        WHEN COALESCE(SUM(si.quantity), 0) = 0 THEN 'out'
                        WHEN COALESCE(SUM(si.quantity), 0) <= 10 THEN 'low'
                        ELSE 'good'
                    END as stock_status
                FROM Product p
                LEFT JOIN StockItem si ON p.product_id = si.product_id AND si.branch_id = ?
                WHERE p.status = 'Active'
            ";
            
            $params = [$branch_id];
            $types = "i";
            
            if (!empty($category)) {
                $sql .= " AND p.category = ?";
                $params[] = $category;
                $types .= "s";
            }
            
            if (!empty($search)) {
                $sql .= " AND (p.name LIKE ? OR p.product_id LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "ss";
            }
            
            $sql .= " GROUP BY p.product_id";
            
            if ($status === 'good') {
                $sql .= " HAVING current_stock > 10";
            } elseif ($status === 'low') {
                $sql .= " HAVING current_stock > 0 AND current_stock <= 10";
            } elseif ($status === 'out') {
                $sql .= " HAVING current_stock = 0";
            }
            
            $sql .= " ORDER BY p.category, p.name";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $items = [];
            while ($row = $result->fetch_assoc()) {
                $items[] = [
                    'product_id' => $row['product_id'],
                    'product_name' => $row['product_name'],
                    'category' => $row['category'],
                    'unit_price' => floatval($row['unit_price']),
                    'current_stock' => intval($row['current_stock']),
                    'reorder_level' => intval($row['reorder_level']),
                    'stock_status' => $row['stock_status']
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $items]);
            $stmt->close();
            
        } elseif ($action === 'stats') {
            // Get inventory statistics for a branch
            $branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 1;
            
            // Count products by stock status
            $stmt = $conn->prepare("
                SELECT 
                    SUM(CASE WHEN COALESCE(stock_qty, 0) > 10 THEN 1 ELSE 0 END) as good_stock,
                    SUM(CASE WHEN COALESCE(stock_qty, 0) > 0 AND COALESCE(stock_qty, 0) <= 10 THEN 1 ELSE 0 END) as low_stock,
                    SUM(CASE WHEN COALESCE(stock_qty, 0) = 0 THEN 1 ELSE 0 END) as out_of_stock,
                    SUM(COALESCE(stock_qty, 0) * p.retail_price) as total_value
                FROM Product p
                LEFT JOIN (
                    SELECT product_id, SUM(quantity) as stock_qty
                    FROM StockItem
                    WHERE branch_id = ?
                    GROUP BY product_id
                ) si ON p.product_id = si.product_id
                WHERE p.status = 'Active'
            ");
            $stmt->bind_param("i", $branch_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $row = $result->fetch_assoc();
            
            $stats = [
                'good_stock' => intval($row['good_stock']),
                'low_stock' => intval($row['low_stock']),
                'out_of_stock' => intval($row['out_of_stock']),
                'total_value' => floatval($row['total_value'] ?: 0)
            ];
            
            echo json_encode(['success' => true, 'data' => $stats]);
            $stmt->close();
            
        } elseif ($action === 'other_branches') {
            // Get stock at other branches for a product
            $product_id = isset($_GET['product_id']) ? intval($_GET['product_id']) : 0;
            $current_branch = isset($_GET['current_branch']) ? intval($_GET['current_branch']) : 0;
            
            if ($product_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Product ID is required']);
                exit();
            }
            
            $stmt = $conn->prepare("
                SELECT b.branch_id, b.branch_name, b.city, 
                       COALESCE(SUM(si.quantity), 0) as stock
                FROM Branch b
                LEFT JOIN StockItem si ON b.branch_id = si.branch_id AND si.product_id = ?
                WHERE b.branch_id != ?
                GROUP BY b.branch_id
                ORDER BY b.branch_name
            ");
            $stmt->bind_param("ii", $product_id, $current_branch);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $branches = [];
            while ($row = $result->fetch_assoc()) {
                $branches[] = [
                    'branch_id' => $row['branch_id'],
                    'branch_name' => $row['branch_name'],
                    'city' => $row['city'],
                    'stock' => intval($row['stock'])
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $branches]);
            $stmt->close();
            
        } elseif ($action === 'pos_products') {
            // Get products for POS system with stock info
            $branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 1;
            $category = isset($_GET['category']) ? $_GET['category'] : '';
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            $sql = "
                SELECT 
                    p.product_id,
                    p.name as product_name,
                    p.category,
                    p.retail_price as price,
                    COALESCE(SUM(si.quantity), 0) as stock
                FROM Product p
                LEFT JOIN StockItem si ON p.product_id = si.product_id AND si.branch_id = ?
                WHERE p.status = 'Active'
            ";
            
            $params = [$branch_id];
            $types = "i";
            
            if (!empty($category) && $category !== 'All Categories') {
                $sql .= " AND p.category = ?";
                $params[] = $category;
                $types .= "s";
            }
            
            if (!empty($search)) {
                $sql .= " AND (p.name LIKE ? OR p.product_id LIKE ? OR p.sku LIKE ?)";
                $searchTerm = "%$search%";
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= "sss";
            }
            
            $sql .= " GROUP BY p.product_id ORDER BY p.category, p.name";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $products = [];
            while ($row = $result->fetch_assoc()) {
                $products[] = [
                    'product_id' => $row['product_id'],
                    'name' => $row['product_name'],
                    'category' => $row['category'],
                    'price' => floatval($row['price']),
                    'stock' => intval($row['stock'])
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $products]);
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = isset($data['action']) ? $data['action'] : '';
        
        if ($action === 'adjust') {
            // Adjust stock quantity
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            $branch_id = isset($data['branch_id']) ? intval($data['branch_id']) : 0;
            $adjustment = isset($data['adjustment']) ? intval($data['adjustment']) : 0;
            $reason = isset($data['reason']) ? $data['reason'] : '';
            
            if ($product_id === 0 || $branch_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Product ID and Branch ID are required']);
                exit();
            }
            
            // Check if stock item exists
            $stmt = $conn->prepare("SELECT stock_id, quantity FROM StockItem WHERE product_id = ? AND branch_id = ? LIMIT 1");
            $stmt->bind_param("ii", $product_id, $branch_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                $new_qty = $row['quantity'] + $adjustment;
                if ($new_qty < 0) {
                    echo json_encode(['success' => false, 'error' => 'Cannot reduce stock below 0']);
                    exit();
                }
                
                $stmt = $conn->prepare("UPDATE StockItem SET quantity = ? WHERE stock_id = ?");
                $stmt->bind_param("ii", $new_qty, $row['stock_id']);
                $stmt->execute();
            } else {
                // Insert new stock item
                if ($adjustment < 0) {
                    echo json_encode(['success' => false, 'error' => 'Cannot reduce stock below 0']);
                    exit();
                }
                
                $batch_no = 'ADJ_' . date('Ymd') . '_' . $product_id;
                $stmt = $conn->prepare("INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, received_date, location, unit_cost, status) VALUES (?, ?, ?, ?, CURDATE(), 'Adjusted', 0, 'In Stock')");
                $stmt->bind_param("siii", $batch_no, $product_id, $branch_id, $adjustment);
                $stmt->execute();
            }
            
            echo json_encode(['success' => true, 'message' => 'Stock adjusted successfully']);
            $stmt->close();
            
        } elseif ($action === 'stock_in') {
            // Stock In (receive goods)
            $product_id = isset($data['product_id']) ? intval($data['product_id']) : 0;
            $branch_id = isset($data['branch_id']) ? intval($data['branch_id']) : 0;
            $quantity = isset($data['quantity']) ? intval($data['quantity']) : 0;
            $batch_no = isset($data['batch_no']) ? $data['batch_no'] : 'BSG_' . date('YmdHis');
            
            if ($product_id === 0 || $branch_id === 0 || $quantity <= 0) {
                echo json_encode(['success' => false, 'error' => 'Invalid input data']);
                exit();
            }
            
            // Get product cost price
            $stmt = $conn->prepare("SELECT cost_price FROM Product WHERE product_id = ?");
            $stmt->bind_param("i", $product_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $product = $result->fetch_assoc();
            $unit_cost = $product ? $product['cost_price'] : 0;
            $stmt->close();
            
            // Insert new stock item
            $stmt = $conn->prepare("INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, received_date, location, unit_cost, status) VALUES (?, ?, ?, ?, CURDATE(), 'New Stock', ?, 'In Stock')");
            $stmt->bind_param("siiid", $batch_no, $product_id, $branch_id, $quantity, $unit_cost);
            
            if ($stmt->execute()) {
                echo json_encode(['success' => true, 'message' => "Stock in successful: $quantity units added"]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to add stock']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'error' => 'Method not allowed']);
}

$conn->close();
?>
