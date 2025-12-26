<?php
/**
 * Employee Management API for HR Admin
 */

require_once '../config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
        case 'GET':
        getEmployees($pdo);
        break;
    case 'POST':
        createEmployee($pdo);
        break;
    case 'PUT':
        updateEmployee($pdo);
        break;
    case 'DELETE':
        deleteEmployee($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getEmployees($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        
        if ($id) {
            $stmt = $pdo->prepare("
                SELECT e.*, b.branch_name 
                FROM Employee e 
                JOIN Branch b ON e.branch_id = b.branch_id 
                WHERE e.employee_id = ?
            ");
            $stmt->execute([$id]);
            $employee = $stmt->fetch();
            sendResponse(['success' => true, 'data' => $employee]);
        } else {
            $stmt = $pdo->query("
                SELECT e.*, b.branch_name 
                FROM Employee e 
                JOIN Branch b ON e.branch_id = b.branch_id 
                ORDER BY e.name
            ");
            $employees = $stmt->fetchAll();
            sendResponse(['success' => true, 'data' => $employees, 'count' => count($employees)]);
        }
    } catch (PDOException $e) {
        sendError('Failed to fetch employees: ' . $e->getMessage(), 500);
            }
}

function createEmployee($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            INSERT INTO Employee (name, email, password_hash, phone, position, salary, hire_date, branch_id, is_active)
            VALUES (?, ?, 'default_hash', ?, ?, ?, ?, ?, TRUE)
        ");
            
        $stmt->execute([
            $data['name'],
            $data['email'],
            $data['phone'],
            $data['position'],
            $data['salary'],
            $data['hire_date'],
            $data['branch_id']
        ]);
            
        sendResponse(['success' => true, 'message' => 'Employee created', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError('Email already exists', 400);
        } else {
            sendError('Failed to create employee: ' . $e->getMessage(), 500);
            }
    }
}

function updateEmployee($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['employee_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            sendError('Employee ID required', 400);
            return;
        }
        
        // Check if only updating status
        if (isset($data['is_active']) && count($data) <= 2) {
            $stmt = $pdo->prepare("UPDATE Employee SET is_active = ? WHERE employee_id = ?");
            $stmt->execute([$data['is_active'] ? 1 : 0, $id]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE Employee 
                SET name = ?, email = ?, phone = ?, position = ?, salary = ?, 
                    hire_date = ?, branch_id = ?, is_active = ?
                WHERE employee_id = ?
            ");
            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['phone'],
                $data['position'],
                $data['salary'],
                $data['hire_date'],
                $data['branch_id'],
                $data['is_active'] ? 1 : 0,
                $id
            ]);
        }
        
        sendResponse(['success' => true, 'message' => 'Employee updated']);
    } catch (PDOException $e) {
        sendError('Failed to update employee: ' . $e->getMessage(), 500);
    }
}

function deleteEmployee($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError('Employee ID required', 400);
            return;
        }
        
        // Soft delete - just deactivate
        $stmt = $pdo->prepare("UPDATE Employee SET is_active = FALSE WHERE employee_id = ?");
        $stmt->execute([$id]);
            
        sendResponse(['success' => true, 'message' => 'Employee deactivated']);
} catch (PDOException $e) {
        sendError('Failed to delete employee: ' . $e->getMessage(), 500);
    }
}
?>
