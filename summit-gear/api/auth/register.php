<?php
/**
 * Summit Gear & Adventures - Customer Registration API
 * 
 * Handles new customer registration with welcome bonus points
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, "Method not allowed", 405);
}

$input = getJsonInput();

// Validate required fields
$required = ['name', 'email', 'password', 'phone'];
foreach ($required as $field) {
    if (empty($input[$field])) {
        sendResponse(false, null, "Field '$field' is required", 400);
    }
}

$name = sanitize($input['name']);
$email = sanitize($input['email']);
$password = $input['password'];
$phone = sanitize($input['phone']);
$address = sanitize($input['address'] ?? '');
$city = sanitize($input['city'] ?? '');
$postcode = sanitize($input['postcode'] ?? '');

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    sendResponse(false, null, "Invalid email format", 400);
}

// Validate password length
if (strlen($password) < 8) {
    sendResponse(false, null, "Password must be at least 8 characters", 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Start transaction
    $conn->beginTransaction();
    
    // Check if email already exists
    $checkSql = "SELECT customer_id FROM Customer WHERE email = :email";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':email', $email);
    $checkStmt->execute();
    
    if ($checkStmt->rowCount() > 0) {
        sendResponse(false, null, "Email already registered", 409);
    }
    
    // Check if phone already exists
    $checkPhoneSql = "SELECT customer_id FROM Customer WHERE phone = :phone";
    $checkPhoneStmt = $conn->prepare($checkPhoneSql);
    $checkPhoneStmt->bindParam(':phone', $phone);
    $checkPhoneStmt->execute();
    
    if ($checkPhoneStmt->rowCount() > 0) {
        sendResponse(false, null, "Phone number already registered", 409);
    }
    
    // Get Bronze membership ID
    $membershipSql = "SELECT membership_id FROM Membership WHERE membership_type = 'Bronze' LIMIT 1";
    $membershipStmt = $conn->prepare($membershipSql);
    $membershipStmt->execute();
    $membership = $membershipStmt->fetch();
    $membershipId = $membership ? $membership['membership_id'] : null;
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert customer
    $insertSql = "INSERT INTO Customer 
                  (name, email, password_hash, phone, address, city, postcode, 
                   membership_id, total_points, registration_date) 
                  VALUES 
                  (:name, :email, :password_hash, :phone, :address, :city, :postcode,
                   :membership_id, 100, CURDATE())";
    
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bindParam(':name', $name);
    $insertStmt->bindParam(':email', $email);
    $insertStmt->bindParam(':password_hash', $passwordHash);
    $insertStmt->bindParam(':phone', $phone);
    $insertStmt->bindParam(':address', $address);
    $insertStmt->bindParam(':city', $city);
    $insertStmt->bindParam(':postcode', $postcode);
    $insertStmt->bindParam(':membership_id', $membershipId);
    $insertStmt->execute();
    
    $customerId = $conn->lastInsertId();
    
    // Add welcome bonus points transaction
    $pointsSql = "INSERT INTO Points_Transaction 
                  (customer_id, point_change, trans_type, balance_after, description)
                  VALUES 
                  (:customer_id, 100, 'Bonus', 100, 'Welcome bonus for new registration')";
    
    $pointsStmt = $conn->prepare($pointsSql);
    $pointsStmt->bindParam(':customer_id', $customerId);
    $pointsStmt->execute();
    
    // Commit transaction
    $conn->commit();
    
    // Return new customer data
    $customerData = [
        'id' => $customerId,
        'name' => $name,
        'email' => $email,
        'phone' => $phone,
        'membership_type' => 'Bronze',
        'points' => 100,
        'total_spent' => 0
    ];
    
    sendResponse(true, $customerData, "Registration successful! Welcome bonus: 100 points");
    
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Registration Error: " . $e->getMessage());
    sendResponse(false, null, "Registration failed: " . $e->getMessage(), 500);
}
?>

