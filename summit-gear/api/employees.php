<?php
/**
 * Staff/Employee API Endpoint
 * Handles employee authentication and data
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
        if ($action === 'login') {
            // Employee login
            $employee_id = isset($_GET['employee_id']) ? intval($_GET['employee_id']) : 0;
            $branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 0;
            
            if ($employee_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Employee ID is required']);
                exit();
            }
            
            $stmt = $conn->prepare("
                SELECT e.employee_id, e.name, e.position, e.email, e.hire_date,
                       e.branch_id, b.branch_name, b.city as branch_city
                FROM Employee e
                JOIN Branch b ON e.branch_id = b.branch_id
                WHERE e.employee_id = ? AND e.is_active = TRUE
            ");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                // Check if branch matches (if provided)
                if ($branch_id > 0 && $row['branch_id'] != $branch_id) {
                    echo json_encode([
                        'success' => false, 
                        'error' => $row['name'] . ' is not assigned to this branch'
                    ]);
                } else {
                    echo json_encode([
                        'success' => true,
                        'data' => [
                            'employee_id' => $row['employee_id'],
                            'name' => $row['name'],
                            'role' => $row['position'],
                            'email' => $row['email'],
                            'hire_date' => $row['hire_date'],
                            'branch_id' => $row['branch_id'],
                            'branch_name' => $row['branch_name'],
                            'branch_city' => $row['branch_city']
                        ]
                    ]);
                }
            } else {
                echo json_encode(['success' => false, 'error' => 'Employee not found or inactive']);
            }
            $stmt->close();
            
        } elseif ($action === 'list') {
            // List all employees (for admin)
            $branch_id = isset($_GET['branch_id']) ? intval($_GET['branch_id']) : 0;
            
            $sql = "
                SELECT e.employee_id, e.name, e.position, e.email, e.hire_date,
                       e.branch_id, b.branch_name
                FROM Employee e
                JOIN Branch b ON e.branch_id = b.branch_id
                WHERE e.is_active = TRUE
            ";
            
            if ($branch_id > 0) {
                $sql .= " AND e.branch_id = ?";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param("i", $branch_id);
            } else {
                $stmt = $conn->prepare($sql);
            }
            
            $stmt->execute();
            $result = $stmt->get_result();
            
            $employees = [];
            while ($row = $result->fetch_assoc()) {
                $employees[] = [
                    'employee_id' => $row['employee_id'],
                    'name' => $row['name'],
                    'role' => $row['position'],
                    'email' => $row['email'],
                    'hire_date' => $row['hire_date'],
                    'branch_id' => $row['branch_id'],
                    'branch_name' => $row['branch_name']
                ];
            }
            
            echo json_encode(['success' => true, 'data' => $employees]);
            $stmt->close();
            
        } elseif ($action === 'stats') {
            // Get employee sales statistics
            $employee_id = isset($_GET['employee_id']) ? intval($_GET['employee_id']) : 0;
            
            if ($employee_id === 0) {
                echo json_encode(['success' => false, 'error' => 'Employee ID is required']);
                exit();
            }
            
            $stats = [];
            
            // Today's sales (exclude Returned and Cancelled orders)
            $stmt = $conn->prepare("
                SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as total_sales
                FROM Sales_Order
                WHERE employee_id = ? AND DATE(order_date) = CURDATE()
                AND status NOT IN ('Returned', 'Cancelled')
            ");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $today = $result->fetch_assoc();
            $stats['today'] = [
                'orders' => intval($today['order_count']),
                'sales' => floatval($today['total_sales'])
            ];
            $stmt->close();
            
            // This week's sales (exclude Returned and Cancelled orders)
            $stmt = $conn->prepare("
                SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as total_sales
                FROM Sales_Order
                WHERE employee_id = ? AND YEARWEEK(order_date, 1) = YEARWEEK(CURDATE(), 1)
                AND status NOT IN ('Returned', 'Cancelled')
            ");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $week = $result->fetch_assoc();
            $stats['this_week'] = [
                'orders' => intval($week['order_count']),
                'sales' => floatval($week['total_sales'])
            ];
            $stmt->close();
            
            // This month's sales (exclude Returned and Cancelled orders)
            $stmt = $conn->prepare("
                SELECT COUNT(*) as order_count, COALESCE(SUM(final_amount), 0) as total_sales
                FROM Sales_Order
                WHERE employee_id = ? AND YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())
                AND status NOT IN ('Returned', 'Cancelled')
            ");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $month = $result->fetch_assoc();
            $stats['this_month'] = [
                'orders' => intval($month['order_count']),
                'sales' => floatval($month['total_sales'])
            ];
            $stmt->close();
            
            // Recent transactions
            $stmt = $conn->prepare("
                SELECT so.order_id, so.order_date, so.final_amount, so.status,
                       c.name as customer_name,
                       (SELECT COUNT(*) FROM Sales_Order_Item WHERE order_id = so.order_id) as item_count
                FROM Sales_Order so
                LEFT JOIN Customer c ON so.customer_id = c.customer_id
                WHERE so.employee_id = ?
                ORDER BY so.order_date DESC
                LIMIT 10
            ");
            $stmt->bind_param("i", $employee_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $transactions = [];
            while ($row = $result->fetch_assoc()) {
                $transactions[] = [
                    'order_id' => $row['order_id'],
                    'order_date' => $row['order_date'],
                    'customer_name' => $row['customer_name'] ?: 'Walk-in',
                    'item_count' => intval($row['item_count']),
                    'total_amount' => floatval($row['final_amount']),
                    'status' => $row['status']
                ];
            }
            $stats['recent_transactions'] = $transactions;
            $stmt->close();
            
            echo json_encode(['success' => true, 'data' => $stats]);
        } elseif ($action === 'verify_admin') {
            // Verify admin login by email and password
            $email = isset($_GET['email']) ? trim($_GET['email']) : '';
            $password = isset($_GET['password']) ? trim($_GET['password']) : '';
            
            if (empty($email)) {
                echo json_encode(['success' => false, 'error' => 'Email is required']);
                exit();
            }
            
            $stmt = $conn->prepare("
                SELECT e.employee_id, e.name, e.email, e.position, e.phone, e.password_hash,
                       e.branch_id, b.branch_name, b.city as branch_city
                FROM Employee e
                JOIN Branch b ON e.branch_id = b.branch_id
                WHERE e.email = ? AND e.is_active = TRUE
            ");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                // Check if this is an admin position (not Staff)
                if ($row['position'] === 'Staff') {
                    echo json_encode(['success' => false, 'error' => 'Staff accounts cannot access Admin Portal. Use Staff Portal instead.']);
                    $stmt->close();
                    exit();
                }
                
                // Check password - admin accounts use admin_hash (password: admin123)
                if ($row['password_hash'] !== 'admin_hash' && $password !== 'admin123') {
                    echo json_encode(['success' => false, 'error' => 'Invalid password']);
                    $stmt->close();
                    exit();
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'employee_id' => $row['employee_id'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'position' => $row['position'],
                        'phone' => $row['phone'],
                        'branch_id' => $row['branch_id'],
                        'branch_name' => $row['branch_name'],
                        'branch_city' => $row['branch_city']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Employee not found']);
            }
            $stmt->close();
            
        } elseif ($action === 'verify_staff') {
            // Verify staff login by email and password
            $email = isset($_GET['email']) ? trim($_GET['email']) : '';
            $password = isset($_GET['password']) ? trim($_GET['password']) : '';
            
            if (empty($email)) {
                echo json_encode(['success' => false, 'error' => 'Email is required']);
                exit();
            }
            
            $stmt = $conn->prepare("
                SELECT e.employee_id, e.name, e.email, e.position, e.phone, e.password_hash,
                       e.branch_id, b.branch_name, b.city as branch_city
                FROM Employee e
                JOIN Branch b ON e.branch_id = b.branch_id
                WHERE e.email = ? AND e.is_active = TRUE
            ");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                // Staff accounts use staff_hash (password: staff123)
                if ($row['password_hash'] !== 'staff_hash' && $password !== 'staff123') {
                    echo json_encode(['success' => false, 'error' => 'Invalid password']);
                    $stmt->close();
                    exit();
                }
                
                echo json_encode([
                    'success' => true,
                    'data' => [
                        'employee_id' => $row['employee_id'],
                        'name' => $row['name'],
                        'email' => $row['email'],
                        'position' => $row['position'],
                        'phone' => $row['phone'],
                        'branch_id' => $row['branch_id'],
                        'branch_name' => $row['branch_name'],
                        'branch_city' => $row['branch_city']
                    ]
                ]);
            } else {
                echo json_encode(['success' => false, 'error' => 'Employee not found']);
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
