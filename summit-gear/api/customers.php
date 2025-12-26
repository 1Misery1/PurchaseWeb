<?php
/**
 * Summit Gear & Adventures - Customers API
 * 
 * Endpoints:
 * GET /api/customers.php - Get all customers
 * GET /api/customers.php?id=1 - Get single customer
 * POST /api/customers.php/login - Login
 * POST /api/customers.php/register - Register
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;

switch ($method) {
    case 'GET':
        getCustomers($pdo);
        break;
    case 'POST':
        if ($action === 'login') {
            loginCustomer($pdo);
        } elseif ($action === 'register') {
            registerCustomer($pdo);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    case 'PUT':
        if ($action === 'update') {
            updateCustomerProfile($pdo);
        } else {
            sendError('Invalid action', 400);
        }
        break;
    default:
        sendError('Method not allowed', 405);
}

function getCustomers($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        $email = $_GET['email'] ?? null;
        
        $sql = "
            SELECT 
                c.customer_id,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.city,
                c.postcode,
                c.total_points,
                c.total_spent,
                c.registration_date,
                c.is_active,
                m.membership_type,
                m.discount_rate,
                m.point_rate
            FROM Customer c
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            WHERE c.is_active = TRUE
        ";
        
        $params = [];
        
        if ($id) {
            $sql .= " AND c.customer_id = ?";
            $params[] = $id;
        }
        
        if ($email) {
            $sql .= " AND c.email = ?";
            $params[] = $email;
        }
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $customers = $stmt->fetchAll();
        
        if (($id || $email) && count($customers) === 1) {
            sendResponse(['success' => true, 'data' => $customers[0]]);
        } else {
            sendResponse(['success' => true, 'data' => $customers, 'count' => count($customers)]);
        }
        
    } catch (PDOException $e) {
        error_log("Customers API error: " . $e->getMessage());
        sendError('Failed to fetch customers', 500);
    }
}

function loginCustomer($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['email', 'password'])) {
            sendError('Email and password are required');
        }
        
        $sql = "
            SELECT 
                c.customer_id,
                c.name,
                c.email,
                c.password_hash,
                c.phone,
                c.address,
                c.city,
                c.postcode,
                c.total_points,
                c.total_spent,
                c.registration_date,
                m.membership_type,
                m.discount_rate,
                m.point_rate
            FROM Customer c
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            WHERE c.email = ? AND c.is_active = TRUE
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$data['email']]);
        $customer = $stmt->fetch();
        
        if (!$customer) {
            sendError('Invalid email or password', 401);
        }
        
        // For demo, accept 'hash123' or the actual password
        // In production, use password_verify()
        if ($customer['password_hash'] !== 'hash123' && 
            $customer['password_hash'] !== $data['password'] &&
            !password_verify($data['password'], $customer['password_hash'])) {
            sendError('Invalid email or password', 401);
        }
        
        // Remove password from response
        unset($customer['password_hash']);
        
        sendResponse([
            'success' => true, 
            'message' => 'Login successful',
            'data' => $customer
        ]);
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        sendError('Login failed', 500);
    }
}

function updateCustomerProfile($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['customer_id'])) {
            sendError('Customer ID is required');
        }
        
        // Check if customer exists
        $checkSql = "SELECT customer_id FROM Customer WHERE customer_id = ? AND is_active = TRUE";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$data['customer_id']]);
        if (!$checkStmt->fetch()) {
            sendError('Customer not found', 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $params = [];
        
        $allowedFields = ['name', 'phone', 'address', 'city', 'postcode'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($updateFields)) {
            sendError('No fields to update');
        }
        
        // Add customer_id to params
        $params[] = $data['customer_id'];
        
        $sql = "UPDATE Customer SET " . implode(', ', $updateFields) . " WHERE customer_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        // Fetch updated customer data
        $fetchSql = "
            SELECT 
                c.customer_id,
                c.name,
                c.email,
                c.phone,
                c.address,
                c.city,
                c.postcode,
                c.total_points,
                c.total_spent,
                c.registration_date,
                m.membership_type,
                m.discount_rate,
                m.point_rate
            FROM Customer c
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            WHERE c.customer_id = ?
        ";
        $fetchStmt = $pdo->prepare($fetchSql);
        $fetchStmt->execute([$data['customer_id']]);
        $customer = $fetchStmt->fetch();
        
        sendResponse([
            'success' => true,
            'message' => 'Profile updated successfully',
            'data' => $customer
        ]);
        
    } catch (PDOException $e) {
        error_log("Update profile error: " . $e->getMessage());
        sendError('Failed to update profile', 500);
    }
}

function registerCustomer($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['name', 'email', 'password', 'phone'])) {
            sendError('Name, email, password and phone are required');
        }
        
        // Check if email already exists
        $checkSql = "SELECT customer_id FROM Customer WHERE email = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$data['email']]);
        if ($checkStmt->fetch()) {
            sendError('Email already registered');
        }
        
        // Check if phone already exists
        $checkSql = "SELECT customer_id FROM Customer WHERE phone = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$data['phone']]);
        if ($checkStmt->fetch()) {
            sendError('Phone number already registered');
        }
        
        // Get Bronze membership ID
        $membershipSql = "SELECT membership_id FROM Membership WHERE membership_type = 'Bronze' LIMIT 1";
        $membershipStmt = $pdo->query($membershipSql);
        $membership = $membershipStmt->fetch();
        $membershipId = $membership ? $membership['membership_id'] : 1;
        
        // Insert customer
        $insertSql = "
            INSERT INTO Customer (name, email, password_hash, phone, address, city, postcode, 
                                  membership_id, total_points, registration_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 100, CURDATE())
        ";
        
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare($insertSql);
        $stmt->execute([
            $data['name'],
            $data['email'],
            $passwordHash,
            $data['phone'],
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['postcode'] ?? null,
            $membershipId
        ]);
        
        $customerId = $pdo->lastInsertId();
        
        // Add welcome bonus points transaction
        $pointsSql = "
            INSERT INTO Points_Transaction (customer_id, point_change, trans_type, balance_after, description)
            VALUES (?, 100, 'Bonus', 100, 'Welcome bonus for new registration')
        ";
        $pointsStmt = $pdo->prepare($pointsSql);
        $pointsStmt->execute([$customerId]);
        
        sendResponse([
            'success' => true,
            'message' => 'Registration successful',
            'data' => ['customer_id' => $customerId]
        ], 201);
        
    } catch (PDOException $e) {
        error_log("Registration error: " . $e->getMessage());
        sendError('Registration failed: ' . $e->getMessage(), 500);
    }
}
?>

