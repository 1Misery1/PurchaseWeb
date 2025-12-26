<?php
/**
 * Summit Gear & Adventures - Update Purchase Order Status API
 * 
 * Allows supplier to update order status (Confirm, Ship)
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    sendResponse(true);
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT' && $_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(false, null, "Method not allowed", 405);
}

$input = getJsonInput();

$poId = intval($input['po_id'] ?? 0);
$supplierId = intval($input['supplier_id'] ?? 0);
$newStatus = sanitize($input['status'] ?? '');
$expectedDate = sanitize($input['expected_date'] ?? '');

if ($poId <= 0 || $supplierId <= 0) {
    sendResponse(false, null, "PO ID and Supplier ID are required", 400);
}

$validStatuses = ['Confirmed', 'Shipped', 'Cancelled'];
if (!in_array($newStatus, $validStatuses)) {
    sendResponse(false, null, "Invalid status. Must be: " . implode(', ', $validStatuses), 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    // Verify PO belongs to supplier
    $verifySql = "SELECT po_id, status FROM Purchase_Order WHERE po_id = :po_id AND supplier_id = :supplier_id";
    $verifyStmt = $conn->prepare($verifySql);
    $verifyStmt->bindParam(':po_id', $poId);
    $verifyStmt->bindParam(':supplier_id', $supplierId);
    $verifyStmt->execute();
    $po = $verifyStmt->fetch();
    
    if (!$po) {
        sendResponse(false, null, "Purchase order not found or access denied", 404);
    }
    
    // Validate status transition
    $currentStatus = $po['status'];
    $validTransitions = [
        'Pending' => ['Confirmed', 'Cancelled'],
        'Confirmed' => ['Shipped', 'Cancelled'],
        'Shipped' => [],
        'Received' => [],
        'Cancelled' => []
    ];
    
    if (!in_array($newStatus, $validTransitions[$currentStatus] ?? [])) {
        sendResponse(false, null, "Cannot change status from '$currentStatus' to '$newStatus'", 400);
    }
    
    // Update status
    $updateSql = "UPDATE Purchase_Order SET status = :status";
    $params = [':status' => $newStatus, ':po_id' => $poId];
    
    if (!empty($expectedDate) && $newStatus === 'Confirmed') {
        $updateSql .= ", expected_date = :expected_date";
        $params[':expected_date'] = $expectedDate;
    }
    
    $updateSql .= " WHERE po_id = :po_id";
    
    $updateStmt = $conn->prepare($updateSql);
    foreach ($params as $key => $value) {
        $updateStmt->bindValue($key, $value);
    }
    $updateStmt->execute();
    
    sendResponse(true, [
        'po_id' => $poId,
        'old_status' => $currentStatus,
        'new_status' => $newStatus
    ], "Order status updated successfully");
    
} catch (PDOException $e) {
    error_log("Update Order Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to update order: " . $e->getMessage(), 500);
}
?>

