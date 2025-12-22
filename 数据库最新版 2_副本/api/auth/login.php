<?php
/**
 * Summit Gear & Adventures - User Authentication API
 * 
 * Handles login for all user types: Customer, Staff, Supplier, Admin
 */

require_once '../config/database.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, "Method not allowed", 405);
}

// Get input data
$input = getJsonInput();

$email = sanitize($input['email'] ?? '');
$password = $input['password'] ?? '';
$userType = sanitize($input['user_type'] ?? 'customer');

// Validate input
if (empty($email) || empty($password)) {
    sendResponse(false, null, "Email and password are required", 400);
}

// Connect to database
$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Determine which table to query based on user type
    switch ($userType) {
        case 'customer':
            $sql = "SELECT customer_id as id, name, email, password_hash, phone, 
                           membership_id, total_points, total_spent
                    FROM Customer 
                    WHERE email = :email AND is_active = TRUE";
            break;
            
        case 'staff':
        case 'admin':
            $sql = "SELECT e.employee_id as id, e.name, e.email, e.password_hash, 
                           e.phone, e.position, e.branch_id, b.branch_name
                    FROM Employee e
                    JOIN Branch b ON e.branch_id = b.branch_id
                    WHERE e.email = :email AND e.is_active = TRUE";
            break;
            
        case 'supplier':
            $sql = "SELECT supplier_id as id, name, email, password_hash, 
                           contact_person, phone
                    FROM Supplier 
                    WHERE email = :email AND is_active = TRUE";
            break;
            
        default:
            sendResponse(false, null, "Invalid user type", 400);
    }
    
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    $user = $stmt->fetch();
    
    if (!$user) {
        sendResponse(false, null, "Invalid email or password", 401);
    }
    
    // Verify password (using password_verify for hashed passwords)
    // For demo purposes, also accept plain text comparison
    $passwordValid = false;
    
    if (password_verify($password, $user['password_hash'])) {
        $passwordValid = true;
    } elseif ($user['password_hash'] === $password || $user['password_hash'] === 'hash123') {
        // Demo mode: accept if password matches hash or is default
        $passwordValid = true;
    }
    
    if (!$passwordValid) {
        sendResponse(false, null, "Invalid email or password", 401);
    }
    
    // Remove password from response
    unset($user['password_hash']);
    
    // Add user type to response
    $user['user_type'] = $userType;
    
    // Generate simple session token (in production, use JWT)
    $user['token'] = bin2hex(random_bytes(32));
    
    // Get additional info based on user type
    if ($userType === 'customer' && $user['membership_id']) {
        $membershipSql = "SELECT membership_type, discount_rate, point_rate 
                          FROM Membership WHERE membership_id = :id";
        $membershipStmt = $conn->prepare($membershipSql);
        $membershipStmt->bindParam(':id', $user['membership_id']);
        $membershipStmt->execute();
        $user['membership'] = $membershipStmt->fetch();
    }
    
    sendResponse(true, $user, "Login successful");
    
} catch (PDOException $e) {
    error_log("Login Error: " . $e->getMessage());
    sendResponse(false, null, "Login failed: " . $e->getMessage(), 500);
}
?>

