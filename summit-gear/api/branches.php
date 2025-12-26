<?php
/**
 * Summit Gear & Adventures - Branch/Store API
 * 
 * Endpoints:
 * GET /api/branches.php - Get all branches
 * GET /api/branches.php?id=X - Get specific branch
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$branchId = $_GET['id'] ?? null;

if ($method === 'GET') {
    if ($branchId) {
        getBranchById($pdo, $branchId);
    } else {
        getAllBranches($pdo);
    }
} else {
    sendError('Method not allowed', 405);
}

function getAllBranches($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                b.branch_id,
                b.branch_name,
                b.address,
                b.city,
                b.phone,
                b.manager_name,
                b.opening_date,
                (SELECT COUNT(*) FROM Employee e WHERE e.branch_id = b.branch_id AND e.is_active = TRUE) as staff_count
            FROM Branch b
            ORDER BY b.branch_name
        ");
        $branches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Generate email based on city
        foreach ($branches as &$branch) {
            $cityLower = strtolower(str_replace(' ', '', $branch['city']));
            $branch['email'] = $cityLower . '@summitgear.co.uk';
            
            // Set default manager name if not set
            if (empty($branch['manager_name'])) {
                $branch['manager_name'] = 'Not Assigned';
            }
        }
        
        sendResponse($branches);
    } catch (Exception $e) {
        sendError('Failed to fetch branches: ' . $e->getMessage(), 500);
    }
}

function getBranchById($pdo, $id) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                b.*,
                (SELECT COUNT(*) FROM Employee e WHERE e.branch_id = b.branch_id AND e.is_active = TRUE) as staff_count
            FROM Branch b
            WHERE b.branch_id = ?
        ");
        $stmt->execute([$id]);
        $branch = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($branch) {
            $cityLower = strtolower(str_replace(' ', '', $branch['city']));
            $branch['email'] = $cityLower . '@summitgear.co.uk';
            sendResponse($branch);
        } else {
            sendError('Branch not found', 404);
        }
    } catch (Exception $e) {
        sendError('Failed to fetch branch: ' . $e->getMessage(), 500);
    }
}
