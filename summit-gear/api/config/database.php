<?php
/**
 * Summit Gear & Adventures - Database Configuration
 * 
 * This file contains the database connection settings.
 * Update these values when deploying to AWS.
 */

class Database {
    // Database credentials - XAMPP default settings
    private $host = "localhost";
    private $db_name = "summit_gear_db";
    private $username = "root";            // XAMPP default username
    private $password = "";                // XAMPP default: no password
    private $port = "3306";
    
    public $conn;
    
    /**
     * Get database connection
     * @return PDO|null Database connection object
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch(PDOException $e) {
            error_log("Database Connection Error: " . $e->getMessage());
            return null;
        }
        
        return $this->conn;
    }
    
    /**
     * Close database connection
     */
    public function closeConnection() {
        $this->conn = null;
    }
}

/**
 * Helper function to send JSON response
 */
function sendResponse($success, $data = null, $message = "", $httpCode = 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data,
        'timestamp' => date('Y-m-d H:i:s')
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Get JSON input from request body
 */
function getJsonInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true) ?? [];
}

/**
 * Sanitize input
 */
function sanitize($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}
?>

