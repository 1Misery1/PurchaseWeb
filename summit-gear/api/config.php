<?php
/**
 * Summit Gear & Adventures - Database Configuration
 * 
 * This file contains database connection settings
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'summit_gear_db');
define('DB_USER', 'root');
define('DB_PASS', '');  // Default XAMPP has no password
define('DB_CHARSET', 'utf8mb4');

// Create mysqli connection
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

// Check connection
if ($conn->connect_error) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database connection failed: ' . $conn->connect_error]);
    exit();
}

// Set charset
$conn->set_charset(DB_CHARSET);

/**
 * Get database connection (PDO version for compatibility)
 * @return PDO|null
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
        
    } catch (PDOException $e) {
        error_log("Database connection failed: " . $e->getMessage());
        return null;
    }
}

/**
 * Send JSON response
 * @param mixed $data
 * @param int $statusCode
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Send error response
 * @param string $message
 * @param int $statusCode
 */
function sendError($message, $statusCode = 400) {
    sendResponse(['error' => true, 'message' => $message], $statusCode);
}

/**
 * Get request body as array
 * @return array
 */
function getRequestBody() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

/**
 * Validate required fields
 * @param array $data
 * @param array $required
 * @return bool
 */
function validateRequired($data, $required) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            return false;
        }
    }
    return true;
}
?>
