<?php
/**
 * Sales API Endpoint
 * Handles POS sales transactions
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
        if ($action === 'branches') {
            // Get all branches
            $stmt = $conn->prepare("SELECT branch_id, branch_name as name, city, address, phone FROM Branch ORDER BY branch_name");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $branches = [];
            while ($row = $result->fetch_assoc()) {
                $branches[] = $row;
            }
            
            echo json_encode(['success' => true, 'data' => $branches]);
            $stmt->close();
            
        } elseif ($action === 'categories') {
            // Get all product categories
            $stmt = $conn->prepare("SELECT DISTINCT category FROM Product ORDER BY category");
            $stmt->execute();
            $result = $stmt->get_result();
            
            $categories = [];
            while ($row = $result->fetch_assoc()) {
                $categories[] = $row['category'];
            }
            
            echo json_encode(['success' => true, 'data' => $categories]);
            $stmt->close();
            
        } elseif ($action === 'customers') {
            // Get customers for POS selection
            $search = isset($_GET['search']) ? $_GET['search'] : '';
            
            $sql = "
                SELECT c.customer_id, c.name, c.email, c.phone, c.total_points,
                       COALESCE(m.membership_type, 'Bronze') as membership_type, 
                       COALESCE(m.discount_rate, 0) as discount_rate
                FROM Customer c
                LEFT JOIN Membership m ON c.membership_id = m.membership_id
                WHERE c.is_active = TRUE
            ";
            
            if (!empty($search)) {
                $sql .= " AND (c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ?)";
                $searchTerm = "%$search%";
                $stmt = $conn->prepare($sql . " ORDER BY c.name LIMIT 20");
                $stmt->bind_param("sss", $searchTerm, $searchTerm, $searchTerm);
            } else {
                $stmt = $conn->prepare($sql . " ORDER BY c.name LIMIT 20");
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $customers = [];
            while ($row = $result->fetch_assoc()) {
                $customers[] = [
                    'customer_id' => $row['customer_id'],
                    'name' => $row['name'],
                    'email' => $row['email'],
                    'phone' => $row['phone'],
                    'points' => intval($row['total_points']),
                    'membership_type' => $row['membership_type'],
                    'discount_rate' => floatval($row['discount_rate'])
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $customers]);
            $stmt->close();
            
        } elseif ($action === 'customer_details') {
            // Get detailed customer info
            $customer_id = isset($_GET['customer_id']) ? intval($_GET['customer_id']) : 0;
            
            if ($customer_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Customer ID is required']);
                exit();
            }
            
            $stmt = $conn->prepare("
                SELECT c.*, 
                       COALESCE(m.membership_type, 'Bronze') as membership_type, 
                       COALESCE(m.discount_rate, 0) as discount_rate,
                       (SELECT COUNT(*) FROM Sales_Order WHERE customer_id = c.customer_id) as total_orders
                FROM Customer c
                LEFT JOIN Membership m ON c.membership_id = m.membership_id
                WHERE c.customer_id = ?
            ");
            $stmt->bind_param("i", $customer_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'customer_id' => $row['customer_id'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'phone' => $row['phone'],
                        'points' => intval($row['total_points']),
                        'membership_type' => $row['membership_type'],
                        'discount_rate' => floatval($row['discount_rate']),
                        'total_orders' => intval($row['total_orders']),
                        'total_spent' => floatval($row['total_spent']),
                        'registered_date' => $row['registration_date']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Customer not found']);
            }
            $stmt->close();
        } else {
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
        }
        break;
        
    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        $action = isset($data['action']) ? $data['action'] : '';
        
        if ($action === 'create_sale') {
            // Create a new sales order
            $customer_id = isset($data['customer_id']) ? intval($data['customer_id']) : null;
            $employee_id = isset($data['employee_id']) ? intval($data['employee_id']) : 0;
            $branch_id = isset($data['branch_id']) ? intval($data['branch_id']) : 0;
            $items = isset($data['items']) ? $data['items'] : [];
            $payment_method = isset($data['payment_method']) ? $data['payment_method'] : 'Cash';
            $discount_percent = isset($data['discount_percent']) ? floatval($data['discount_percent']) : 0;
            
            if (empty($items) || $employee_id === 0 || $branch_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Invalid order data']);
                exit();
            }
            
            // Start transaction
            $conn->begin_transaction();
            
            try {
                // Calculate totals
                $total_amount = 0;
                foreach ($items as $item) {
                    $total_amount += $item['price'] * $item['quantity'];
                }
                
                $discount_amount = $total_amount * ($discount_percent / 100);
                $final_amount = $total_amount - $discount_amount;
                $points_earned = floor($final_amount);
                
                // Generate order number
                $order_number = 'SO-' . date('Ymd') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
                
                // Create order - always include customer_id (can be NULL for walk-in)
                    $stmt = $conn->prepare("
                        INSERT INTO Sales_Order (order_number, customer_id, employee_id, branch_id, order_date, 
                                               total_amount, discount_amount, final_amount, payment_method, status, points_earned, payment_status)
                        VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, ?, 'Completed', ?, 'Paid')
                    ");
                
                // Types: s=string, i=integer, d=double
                // order_number(s), customer_id(i), employee_id(i), branch_id(i), 
                // total_amount(d), discount_amount(d), final_amount(d), payment_method(s), points_earned(i)
                if ($customer_id && $customer_id > 0) {
                    $stmt->bind_param("siiidddsi", $order_number, $customer_id, $employee_id, $branch_id, 
                                     $total_amount, $discount_amount, $final_amount, $payment_method, $points_earned);
                } else {
                    // Bind NULL for customer_id (walk-in customers)
                    $null_customer = null;
                    $stmt->bind_param("siiidddsi", $order_number, $null_customer, $employee_id, $branch_id, 
                                     $total_amount, $discount_amount, $final_amount, $payment_method, $points_earned);
                }
                $stmt->execute();
                $order_id = $conn->insert_id;
                $stmt->close();
                
                // Add order items
                foreach ($items as $item) {
                    $item_total = $item['price'] * $item['quantity'];
                    
                    // Get a stock_id for this product at this branch
                    $stockStmt = $conn->prepare("SELECT stock_id FROM StockItem WHERE product_id = ? AND branch_id = ? AND quantity > 0 LIMIT 1");
                    $stockStmt->bind_param("ii", $item['product_id'], $branch_id);
                    $stockStmt->execute();
                    $stockResult = $stockStmt->get_result();
                    $stockRow = $stockResult->fetch_assoc();
                    $stock_id = $stockRow ? $stockRow['stock_id'] : null;
                    $stockStmt->close();
                    
                    if ($stock_id) {
                        $stmt = $conn->prepare("
                            INSERT INTO Sales_Order_Item (order_id, product_id, stock_id, quantity, unit_price, discount, total_price)
                            VALUES (?, ?, ?, ?, ?, 0, ?)
                        ");
                        $stmt->bind_param("iiiidd", $order_id, $item['product_id'], $stock_id, $item['quantity'], $item['price'], $item_total);
                        $stmt->execute();
                        $stmt->close();
                        
                        // Update stock quantity
                        $updateStock = $conn->prepare("
                            UPDATE StockItem 
                            SET quantity = quantity - ? 
                            WHERE stock_id = ?
                        ");
                        $updateStock->bind_param("ii", $item['quantity'], $stock_id);
                        $updateStock->execute();
                        $updateStock->close();
                    }
                }
                
                // Update customer points if logged in customer
                if ($customer_id && $customer_id > 0) {
                    $stmt = $conn->prepare("UPDATE Customer SET total_points = total_points + ?, total_spent = total_spent + ? WHERE customer_id = ?");
                    $stmt->bind_param("idi", $points_earned, $final_amount, $customer_id);
                    $stmt->execute();
                    $stmt->close();
                    
                    // Get new points balance
                    $balanceStmt = $conn->prepare("SELECT total_points FROM Customer WHERE customer_id = ?");
                    $balanceStmt->bind_param("i", $customer_id);
                    $balanceStmt->execute();
                    $balanceResult = $balanceStmt->get_result();
                    $balanceRow = $balanceResult->fetch_assoc();
                    $new_balance = $balanceRow ? $balanceRow['total_points'] : $points_earned;
                    $balanceStmt->close();
                    
                    // Record points transaction
                    $stmt = $conn->prepare("
                        INSERT INTO Points_Transaction (customer_id, order_id, point_change, trans_type, balance_after, description)
                        VALUES (?, ?, ?, 'Earn', ?, 'Points earned from purchase')
                    ");
                    $stmt->bind_param("iiii", $customer_id, $order_id, $points_earned, $new_balance);
                    $stmt->execute();
                    $stmt->close();
                }
                
                $conn->commit();
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'order_id' => $order_id,
                        'order_number' => $order_number,
                        'total_amount' => $final_amount,
                        'points_earned' => $points_earned
                    ]
                ]);
                
            } catch (Exception $e) {
                $conn->rollback();
                echo json_encode(['success' => false, 'error' => 'Failed to create order: ' . $e->getMessage()]);
            }
            
        } elseif ($action === 'register_customer') {
            // Register new customer
            $first_name = isset($data['first_name']) ? $data['first_name'] : '';
            $last_name = isset($data['last_name']) ? $data['last_name'] : '';
            $email = isset($data['email']) ? $data['email'] : '';
            $phone = isset($data['phone']) ? $data['phone'] : '';
            
            $name = trim($first_name . ' ' . $last_name);
            
            if (empty($name)) {
                echo json_encode(['success' => false, 'error' => 'Name is required']);
                exit();
            }
            
            // Generate unique email/phone if not provided
            if (empty($email)) {
                $email = 'customer_' . time() . '@summitgear.temp';
            }
            if (empty($phone)) {
                $phone = '0000-' . time();
            }
            
            // Get Bronze membership ID
            $stmt = $conn->prepare("SELECT membership_id FROM Membership WHERE membership_type = 'Bronze' LIMIT 1");
            $stmt->execute();
            $result = $stmt->get_result();
            $membership = $result->fetch_assoc();
            $membership_id = $membership ? $membership['membership_id'] : 1;
            $stmt->close();
            
            // Insert customer
            $stmt = $conn->prepare("
                INSERT INTO Customer (name, email, phone, membership_id, total_points, registration_date)
                VALUES (?, ?, ?, ?, 100, CURDATE())
            ");
            $stmt->bind_param("sssi", $name, $email, $phone, $membership_id);
            
            if ($stmt->execute()) {
                $customer_id = $conn->insert_id;
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'customer_id' => $customer_id,
                        'name' => $name,
                        'membership_type' => 'Bronze',
                        'discount_rate' => 0,
                        'points' => 100
                    ],
                    'message' => 'Customer registered with 100 welcome points!'
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Failed to register customer: ' . $conn->error]);
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
