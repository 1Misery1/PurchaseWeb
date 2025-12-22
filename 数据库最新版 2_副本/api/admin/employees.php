<?php
/**
 * Summit Gear & Adventures - Employees API
 * 
 * CRUD operations for employees (HR Admin)
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            // List employees using view
            $branchId = intval($_GET['branch_id'] ?? 0);
            $position = sanitize($_GET['position'] ?? '');
            
            $sql = "SELECT * FROM v_hr_employees WHERE 1=1";
            $params = [];
            
            if ($branchId > 0) {
                $sql .= " AND branch_id = :branch_id";
                $params[':branch_id'] = $branchId;
            }
            
            if (!empty($position)) {
                $sql .= " AND position = :position";
                $params[':position'] = $position;
            }
            
            $sql .= " ORDER BY name ASC";
            
            $stmt = $conn->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
            
            $employees = $stmt->fetchAll();
            
            // Get positions for filter
            $positionsSql = "SELECT DISTINCT position FROM Employee ORDER BY position";
            $positionsStmt = $conn->prepare($positionsSql);
            $positionsStmt->execute();
            $positions = $positionsStmt->fetchAll(PDO::FETCH_COLUMN);
            
            sendResponse(true, [
                'employees' => $employees,
                'positions' => $positions
            ], "Employees retrieved successfully");
            break;
            
        case 'POST':
            // Create new employee
            $input = getJsonInput();
            
            $name = sanitize($input['name'] ?? '');
            $email = sanitize($input['email'] ?? '');
            $password = $input['password'] ?? 'default123';
            $phone = sanitize($input['phone'] ?? '');
            $position = sanitize($input['position'] ?? 'Sales Staff');
            $salary = floatval($input['salary'] ?? 0);
            $branchId = intval($input['branch_id'] ?? 1);
            
            if (empty($name) || empty($email) || empty($phone)) {
                sendResponse(false, null, "Name, email, and phone are required", 400);
            }
            
            // Check if email exists
            $checkSql = "SELECT employee_id FROM Employee WHERE email = :email";
            $checkStmt = $conn->prepare($checkSql);
            $checkStmt->bindParam(':email', $email);
            $checkStmt->execute();
            
            if ($checkStmt->rowCount() > 0) {
                sendResponse(false, null, "Email already exists", 409);
            }
            
            $passwordHash = password_hash($password, PASSWORD_DEFAULT);
            
            $insertSql = "INSERT INTO Employee 
                          (name, email, password_hash, phone, position, salary, hire_date, branch_id)
                          VALUES 
                          (:name, :email, :password_hash, :phone, :position, :salary, CURDATE(), :branch_id)";
            
            $insertStmt = $conn->prepare($insertSql);
            $insertStmt->bindParam(':name', $name);
            $insertStmt->bindParam(':email', $email);
            $insertStmt->bindParam(':password_hash', $passwordHash);
            $insertStmt->bindParam(':phone', $phone);
            $insertStmt->bindParam(':position', $position);
            $insertStmt->bindParam(':salary', $salary);
            $insertStmt->bindParam(':branch_id', $branchId);
            $insertStmt->execute();
            
            sendResponse(true, ['employee_id' => $conn->lastInsertId()], "Employee created successfully");
            break;
            
        case 'PUT':
            // Update employee
            $input = getJsonInput();
            $employeeId = intval($input['employee_id'] ?? 0);
            
            if ($employeeId <= 0) {
                sendResponse(false, null, "Employee ID is required", 400);
            }
            
            $updates = [];
            $params = [':id' => $employeeId];
            
            if (isset($input['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = sanitize($input['name']);
            }
            if (isset($input['phone'])) {
                $updates[] = "phone = :phone";
                $params[':phone'] = sanitize($input['phone']);
            }
            if (isset($input['position'])) {
                $updates[] = "position = :position";
                $params[':position'] = sanitize($input['position']);
            }
            if (isset($input['salary'])) {
                $updates[] = "salary = :salary";
                $params[':salary'] = floatval($input['salary']);
            }
            if (isset($input['branch_id'])) {
                $updates[] = "branch_id = :branch_id";
                $params[':branch_id'] = intval($input['branch_id']);
            }
            if (isset($input['is_active'])) {
                $updates[] = "is_active = :is_active";
                $params[':is_active'] = $input['is_active'] ? 1 : 0;
            }
            
            if (empty($updates)) {
                sendResponse(false, null, "No fields to update", 400);
            }
            
            $updateSql = "UPDATE Employee SET " . implode(', ', $updates) . " WHERE employee_id = :id";
            $updateStmt = $conn->prepare($updateSql);
            foreach ($params as $key => $value) {
                $updateStmt->bindValue($key, $value);
            }
            $updateStmt->execute();
            
            sendResponse(true, null, "Employee updated successfully");
            break;
            
        case 'DELETE':
            // Deactivate employee (soft delete)
            $employeeId = intval($_GET['id'] ?? 0);
            
            if ($employeeId <= 0) {
                sendResponse(false, null, "Employee ID is required", 400);
            }
            
            $deleteSql = "UPDATE Employee SET is_active = FALSE WHERE employee_id = :id";
            $deleteStmt = $conn->prepare($deleteSql);
            $deleteStmt->bindParam(':id', $employeeId);
            $deleteStmt->execute();
            
            sendResponse(true, null, "Employee deactivated successfully");
            break;
            
        default:
            sendResponse(false, null, "Method not allowed", 405);
    }
    
} catch (PDOException $e) {
    error_log("Employees API Error: " . $e->getMessage());
    sendResponse(false, null, "Operation failed: " . $e->getMessage(), 500);
}
?>

