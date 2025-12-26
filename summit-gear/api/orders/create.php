<?php
/**
 * Summit Gear & Adventures - Create Order API
 * 
 * Creates a new sales order with items
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
$customerId = intval($input['customer_id'] ?? 0);
$employeeId = intval($input['employee_id'] ?? 1);
$branchId = intval($input['branch_id'] ?? 1);
$paymentMethod = sanitize($input['payment_method'] ?? 'Card');
$items = $input['items'] ?? [];
$usePoints = intval($input['use_points'] ?? 0);

if ($customerId <= 0) {
    sendResponse(false, null, "Customer ID is required", 400);
}

if (empty($items)) {
    sendResponse(false, null, "Order must contain at least one item", 400);
}

$database = new Database();
$conn = $database->getConnection();

if (!$conn) {
    sendResponse(false, null, "Database connection failed", 500);
}

try {
    $conn->beginTransaction();
    
    // Get customer info and membership discount
    $customerSql = "SELECT c.*, m.discount_rate, m.point_rate
                    FROM Customer c
                    LEFT JOIN Membership m ON c.membership_id = m.membership_id
                    WHERE c.customer_id = :id AND c.is_active = TRUE";
    $customerStmt = $conn->prepare($customerSql);
    $customerStmt->bindParam(':id', $customerId);
    $customerStmt->execute();
    $customer = $customerStmt->fetch();
    
    if (!$customer) {
        sendResponse(false, null, "Customer not found", 404);
    }
    
    $discountRate = floatval($customer['discount_rate'] ?? 0) / 100;
    $pointRate = floatval($customer['point_rate'] ?? 1);
    
    // Validate points usage
    if ($usePoints > $customer['total_points']) {
        sendResponse(false, null, "Insufficient points", 400);
    }
    
    // Calculate order totals
    $totalAmount = 0;
    $orderItems = [];
    
    foreach ($items as $item) {
        $productId = intval($item['product_id']);
        $quantity = intval($item['quantity']);
        
        if ($quantity <= 0) continue;
        
        // Get product price and check stock
        $productSql = "SELECT p.product_id, p.retail_price, p.name,
                              COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) as available
                       FROM Product p
                       LEFT JOIN StockItem s ON p.product_id = s.product_id AND s.branch_id = :branch_id
                       WHERE p.product_id = :product_id AND p.status = 'Active'
                       GROUP BY p.product_id";
        
        $productStmt = $conn->prepare($productSql);
        $productStmt->bindParam(':product_id', $productId);
        $productStmt->bindParam(':branch_id', $branchId);
        $productStmt->execute();
        $product = $productStmt->fetch();
        
        if (!$product) {
            $conn->rollBack();
            sendResponse(false, null, "Product ID $productId not found", 404);
        }
        
        if ($product['available'] < $quantity) {
            $conn->rollBack();
            sendResponse(false, null, "Insufficient stock for {$product['name']}", 400);
        }
        
        $unitPrice = floatval($product['retail_price']);
        $itemDiscount = $unitPrice * $quantity * $discountRate;
        $itemTotal = ($unitPrice * $quantity) - $itemDiscount;
        
        $orderItems[] = [
            'product_id' => $productId,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount' => $itemDiscount,
            'total_price' => $itemTotal
        ];
        
        $totalAmount += $unitPrice * $quantity;
    }
    
    // Calculate discounts and final amount
    $discountAmount = $totalAmount * $discountRate;
    $pointsDiscount = $usePoints / 100; // 100 points = £1
    $finalAmount = $totalAmount - $discountAmount - $pointsDiscount;
    $pointsEarned = floor($finalAmount * $pointRate);
    
    // Generate order number
    $orderNumber = 'SO-' . date('Ymd') . '-' . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
    
    // Insert order
    $orderSql = "INSERT INTO Sales_Order 
                 (order_number, customer_id, employee_id, branch_id, 
                  total_amount, discount_amount, final_amount, payment_method, 
                  status, points_earned, points_used, payment_status)
                 VALUES 
                 (:order_number, :customer_id, :employee_id, :branch_id,
                  :total_amount, :discount_amount, :final_amount, :payment_method,
                  'Completed', :points_earned, :points_used, 'Paid')";
    
    $orderStmt = $conn->prepare($orderSql);
    $orderStmt->bindParam(':order_number', $orderNumber);
    $orderStmt->bindParam(':customer_id', $customerId);
    $orderStmt->bindParam(':employee_id', $employeeId);
    $orderStmt->bindParam(':branch_id', $branchId);
    $orderStmt->bindParam(':total_amount', $totalAmount);
    $orderStmt->bindParam(':discount_amount', $discountAmount);
    $orderStmt->bindParam(':final_amount', $finalAmount);
    $orderStmt->bindParam(':payment_method', $paymentMethod);
    $orderStmt->bindParam(':points_earned', $pointsEarned);
    $orderStmt->bindParam(':points_used', $usePoints);
    $orderStmt->execute();
    
    $orderId = $conn->lastInsertId();
    
    // Insert order items
    $itemSql = "INSERT INTO Sales_Order_Item 
                (order_id, product_id, quantity, unit_price, discount, total_price)
                VALUES (:order_id, :product_id, :quantity, :unit_price, :discount, :total_price)";
    $itemStmt = $conn->prepare($itemSql);
    
    foreach ($orderItems as $item) {
        $itemStmt->bindParam(':order_id', $orderId);
        $itemStmt->bindParam(':product_id', $item['product_id']);
        $itemStmt->bindParam(':quantity', $item['quantity']);
        $itemStmt->bindParam(':unit_price', $item['unit_price']);
        $itemStmt->bindParam(':discount', $item['discount']);
        $itemStmt->bindParam(':total_price', $item['total_price']);
        $itemStmt->execute();
        
        // Deduct stock (FIFO)
        $deductSql = "UPDATE StockItem 
                      SET quantity = quantity - :qty
                      WHERE product_id = :product_id 
                      AND branch_id = :branch_id 
                      AND status = 'In Stock' 
                      AND quantity > 0
                      ORDER BY received_date ASC
                      LIMIT 1";
        $deductStmt = $conn->prepare($deductSql);
        $deductStmt->bindParam(':qty', $item['quantity']);
        $deductStmt->bindParam(':product_id', $item['product_id']);
        $deductStmt->bindParam(':branch_id', $branchId);
        $deductStmt->execute();
    }
    
    // Update customer points
    $newPoints = $customer['total_points'] - $usePoints + $pointsEarned;
    $updateCustomerSql = "UPDATE Customer 
                          SET total_points = :points, 
                              total_spent = total_spent + :spent
                          WHERE customer_id = :id";
    $updateCustomerStmt = $conn->prepare($updateCustomerSql);
    $updateCustomerStmt->bindParam(':points', $newPoints);
    $updateCustomerStmt->bindParam(':spent', $finalAmount);
    $updateCustomerStmt->bindParam(':id', $customerId);
    $updateCustomerStmt->execute();
    
    // Record points transaction (earned)
    if ($pointsEarned > 0) {
        $earnPointsSql = "INSERT INTO Points_Transaction 
                          (customer_id, order_id, point_change, trans_type, balance_after, description)
                          VALUES (:customer_id, :order_id, :points, 'Earn', :balance, :desc)";
        $earnPointsStmt = $conn->prepare($earnPointsSql);
        $earnPointsStmt->bindParam(':customer_id', $customerId);
        $earnPointsStmt->bindParam(':order_id', $orderId);
        $earnPointsStmt->bindParam(':points', $pointsEarned);
        $earnPointsStmt->bindParam(':balance', $newPoints);
        $desc = "Points earned from order $orderNumber";
        $earnPointsStmt->bindParam(':desc', $desc);
        $earnPointsStmt->execute();
    }
    
    // Record points transaction (used)
    if ($usePoints > 0) {
        $usePointsSql = "INSERT INTO Points_Transaction 
                         (customer_id, order_id, point_change, trans_type, balance_after, description)
                         VALUES (:customer_id, :order_id, :points, 'Redeem', :balance, :desc)";
        $usePointsStmt = $conn->prepare($usePointsSql);
        $usePointsStmt->bindParam(':customer_id', $customerId);
        $usePointsStmt->bindParam(':order_id', $orderId);
        $negPoints = -$usePoints;
        $usePointsStmt->bindParam(':points', $negPoints);
        $usePointsStmt->bindParam(':balance', $newPoints);
        $desc = "Points redeemed for order $orderNumber";
        $usePointsStmt->bindParam(':desc', $desc);
        $usePointsStmt->execute();
    }
    
    $conn->commit();
    
    $response = [
        'order_id' => $orderId,
        'order_number' => $orderNumber,
        'total_amount' => $totalAmount,
        'discount_amount' => $discountAmount,
        'points_discount' => $pointsDiscount,
        'final_amount' => $finalAmount,
        'points_earned' => $pointsEarned,
        'points_used' => $usePoints,
        'new_points_balance' => $newPoints
    ];
    
    sendResponse(true, $response, "Order created successfully");
    
} catch (PDOException $e) {
    $conn->rollBack();
    error_log("Create Order Error: " . $e->getMessage());
    sendResponse(false, null, "Failed to create order: " . $e->getMessage(), 500);
}
?>

