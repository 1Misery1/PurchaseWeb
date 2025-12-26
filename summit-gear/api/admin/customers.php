<?php
/**
 * Summit Gear & Adventures - Customers API
 * 
 * CRUD operations for customers (Admin)
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
            // List customers using view
            $membershipType = sanitize($_GET['membership'] ?? '');
            $search = sanitize($_GET['search'] ?? '');
            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(50, max(1, intval($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            $sql = "SELECT * FROM v_customer_membership WHERE 1=1";
            $countSql = "SELECT COUNT(*) as total FROM v_customer_membership WHERE 1=1";
            $params = [];
            
            if (!empty($membershipType)) {
                $sql .= " AND membership_type = :membership";
                $countSql .= " AND membership_type = :membership";
                $params[':membership'] = $membershipType;
            }
            
            if (!empty($search)) {
                $sql .= " AND (name LIKE :search OR email LIKE :search2)";
                $countSql .= " AND (name LIKE :search OR email LIKE :search2)";
                $searchTerm = "%$search%";
                $params[':search'] = $searchTerm;
                $params[':search2'] = $searchTerm;
            }
            
            // Get total count
            $countStmt = $conn->prepare($countSql);
            foreach ($params as $key => $value) {
                $countStmt->bindValue($key, $value);
            }
            $countStmt->execute();
            $totalCount = $countStmt->fetch()['total'];
            
            $sql .= " ORDER BY total_spent DESC LIMIT :limit OFFSET :offset";
            
            $stmt = $conn->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
            $stmt->execute();
            
            $customers = $stmt->fetchAll();
            
            // Get top customers using advanced query
            $topCustomersSql = "SELECT customer_name, email, customer_tier, total_spent, total_orders
                                FROM v_advanced_top_customers 
                                ORDER BY total_spent DESC LIMIT 10";
            $topCustomersStmt = $conn->prepare($topCustomersSql);
            $topCustomersStmt->execute();
            $topCustomers = $topCustomersStmt->fetchAll();
            
            sendResponse(true, [
                'customers' => $customers,
                'top_customers' => $topCustomers,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $totalCount,
                    'total_pages' => ceil($totalCount / $limit)
                ]
            ], "Customers retrieved successfully");
            break;
            
        case 'PUT':
            // Update customer
            $input = getJsonInput();
            $customerId = intval($input['customer_id'] ?? 0);
            
            if ($customerId <= 0) {
                sendResponse(false, null, "Customer ID is required", 400);
            }
            
            $updates = [];
            $params = [':id' => $customerId];
            
            if (isset($input['name'])) {
                $updates[] = "name = :name";
                $params[':name'] = sanitize($input['name']);
            }
            if (isset($input['phone'])) {
                $updates[] = "phone = :phone";
                $params[':phone'] = sanitize($input['phone']);
            }
            if (isset($input['address'])) {
                $updates[] = "address = :address";
                $params[':address'] = sanitize($input['address']);
            }
            if (isset($input['city'])) {
                $updates[] = "city = :city";
                $params[':city'] = sanitize($input['city']);
            }
            if (isset($input['postcode'])) {
                $updates[] = "postcode = :postcode";
                $params[':postcode'] = sanitize($input['postcode']);
            }
            if (isset($input['membership_id'])) {
                $updates[] = "membership_id = :membership_id";
                $params[':membership_id'] = intval($input['membership_id']);
            }
            if (isset($input['is_active'])) {
                $updates[] = "is_active = :is_active";
                $params[':is_active'] = $input['is_active'] ? 1 : 0;
            }
            
            if (empty($updates)) {
                sendResponse(false, null, "No fields to update", 400);
            }
            
            $updateSql = "UPDATE Customer SET " . implode(', ', $updates) . " WHERE customer_id = :id";
            $updateStmt = $conn->prepare($updateSql);
            foreach ($params as $key => $value) {
                $updateStmt->bindValue($key, $value);
            }
            $updateStmt->execute();
            
            sendResponse(true, null, "Customer updated successfully");
            break;
            
        default:
            sendResponse(false, null, "Method not allowed", 405);
    }
    
} catch (PDOException $e) {
    error_log("Customers API Error: " . $e->getMessage());
    sendResponse(false, null, "Operation failed: " . $e->getMessage(), 500);
}
?>

