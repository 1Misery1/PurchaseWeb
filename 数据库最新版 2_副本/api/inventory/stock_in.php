<?php
/**
 * Summit Gear & Adventures - Stock In API
 * 
 * Add new stock items (receiving goods)
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
$productId = intval($input['product_id'] ?? 0);
$branchId = intval($input['branch_id'] ?? 1);
$quantity = intval($input['quantity'] ?? 0);
$purchaseOrderId = intval($input['purchase_order_id'] ?? 0) ?: null;
$location = sanitize($input['location'] ?? '');
$unitCost = floatval($input['unit_cost'] ?? 0);
$batchNo = sanitize($input['batch_no'] ?? '');
$notes = sanitize($input['notes'] ?? '');

if ($productId <= 0 || $quantity <= 0) {
    sendResponse(false, null, "Product ID and quantity are required", 400);
}

// Generate batch number if not provided
if (empty($batchNo)) {
    $batchNo = 'BSG_' . date('Ymd') . '_' . str_pad(mt_rand(1, 999), 3, '0', STR_PAD_LEFT);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    $conn->beginTransaction();
    
    // Verify product exists
    $productSql = "SELECT product_id, name, cost_price FROM Product WHERE product_id = :id AND status = 'Active'";
    $productStmt = $conn->prepare($productSql);
    $productStmt->bindParam(':id', $productId);
    $productStmt->execute();
    $product = $productStmt->fetch();
    
    if (!$product) {
        sendResponse(false, null, "Product not found", 404);
    }
    
    // Use product cost price if unit cost not provided
    if ($unitCost <= 0) {
        $unitCost = floatval($product['cost_price']);
    }
    
    // If purchase order provided, verify and update
    if ($purchaseOrderId) {
        $poSql = "SELECT po_id, status FROM Purchase_Order WHERE po_id = :id";
        $poStmt = $conn->prepare($poSql);
        $poStmt->bindParam(':id', $purchaseOrderId);
        $poStmt->execute();
        $po = $poStmt->fetch();
        
        if (!$po) {
            sendResponse(false, null, "Purchase order not found", 404);
        }
        
        // Update PO item received quantity
        $updatePoItemSql = "UPDATE Purchase_Order_Item 
                            SET received_qty = received_qty + :qty
                            WHERE po_id = :po_id AND product_id = :product_id";
        $updatePoItemStmt = $conn->prepare($updatePoItemSql);
        $updatePoItemStmt->bindParam(':qty', $quantity);
        $updatePoItemStmt->bindParam(':po_id', $purchaseOrderId);
        $updatePoItemStmt->bindParam(':product_id', $productId);
        $updatePoItemStmt->execute();
        
        // Check if all items received, update PO status
        $checkPoSql = "SELECT COUNT(*) as pending 
                       FROM Purchase_Order_Item 
                       WHERE po_id = :po_id AND received_qty < quantity";
        $checkPoStmt = $conn->prepare($checkPoSql);
        $checkPoStmt->bindParam(':po_id', $purchaseOrderId);
        $checkPoStmt->execute();
        $pending = $checkPoStmt->fetch()['pending'];
        
        if ($pending == 0) {
            $updatePoSql = "UPDATE Purchase_Order SET status = 'Received', received_date = CURDATE() WHERE po_id = :po_id";
            $updatePoStmt = $conn->prepare($updatePoSql);
            $updatePoStmt->bindParam(':po_id', $purchaseOrderId);
            $updatePoStmt->execute();
        }
    }
    
    // Insert stock item
    $insertSql = "INSERT INTO StockItem 
                  (batch_no, product_id, branch_id, quantity, purchase_order_id, 
                   received_date, location, unit_cost, status, notes)
                  VALUES 
                  (:batch_no, :product_id, :branch_id, :quantity, :po_id,
                   CURDATE(), :location, :unit_cost, 'In Stock', :notes)";
    
    $insertStmt = $conn->prepare($insertSql);
    $insertStmt->bindParam(':batch_no', $batchNo);
    $insertStmt->bindParam(':product_id', $productId);
    $insertStmt->bindParam(':branch_id', $branchId);
    $insertStmt->bindParam(':quantity', $quantity);
    $insertStmt->bindParam(':po_id', $purchaseOrderId);
    $insertStmt->bindParam(':location', $location);
    $insertStmt->bindParam(':unit_cost', $unitCost);
    $insertStmt->bindParam(':notes', $notes);
    $insertStmt->execute();
    
    $stockId = $conn->lastInsertId();
    
    $conn->commit();
    
    $response = [
        'stock_id' => $stockId,
        'batch_no' => $batchNo,
        'product_name' => $product['name'],
        'quantity' => $quantity,
        'unit_cost' => $unitCost,
        'total_value' => $quantity * $unitCost
    ];
    
    sendResponse(true, $response, "Stock added successfully");
    
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Stock In Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to add stock: " . $e->getMessage(), 500);
}
?>

