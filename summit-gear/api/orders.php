<?php
/**
 * Summit Gear & Adventures - Orders API (Sales Orders)
 * 
 * Endpoints:
 * GET /api/orders.php - Get all orders
 * GET /api/orders.php?customer_id=1 - Get customer's orders
 * GET /api/orders.php?id=1 - Get single order with items
 * POST /api/orders.php - Create new order
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getOrders($pdo);
        break;
    case 'POST':
        createOrder($pdo);
        break;
    case 'PUT':
        updateOrderStatus($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getOrders($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        $customerId = $_GET['customer_id'] ?? null;
        $status = $_GET['status'] ?? null;
        $branchId = $_GET['branch_id'] ?? null;  // Filter by branch for staff portal
        
        $sql = "
            SELECT 
                so.order_id,
                so.order_number,
                so.customer_id,
                c.name AS customer_name,
                c.email AS customer_email,
                so.employee_id,
                e.name AS employee_name,
                so.branch_id,
                b.branch_name,
                so.order_date,
                so.total_amount,
                so.discount_amount,
                so.final_amount,
                so.payment_method,
                so.status,
                so.points_earned,
                so.points_used,
                so.payment_status,
                so.notes
            FROM Sales_Order so
            JOIN Customer c ON so.customer_id = c.customer_id
            JOIN Employee e ON so.employee_id = e.employee_id
            JOIN Branch b ON so.branch_id = b.branch_id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($id) {
            $sql .= " AND so.order_id = ?";
            $params[] = $id;
        }
        
        if ($customerId) {
            $sql .= " AND so.customer_id = ?";
            $params[] = $customerId;
        }
        
        if ($status) {
            $sql .= " AND so.status = ?";
            $params[] = $status;
        }
        
        // Filter by branch - staff should only see their own branch's orders
        if ($branchId) {
            $sql .= " AND so.branch_id = ?";
            $params[] = $branchId;
        }
        
        $sql .= " ORDER BY so.order_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll();
        
        // If getting single order, include items
        if ($id && count($orders) === 1) {
            $itemsSql = "
                SELECT 
                    soi.so_item_id,
                    soi.product_id,
                    p.name AS product_name,
                    p.sku,
                    p.brand,
                    soi.quantity,
                    soi.unit_price,
                    soi.discount,
                    soi.total_price
                FROM Sales_Order_Item soi
                JOIN Product p ON soi.product_id = p.product_id
                WHERE soi.order_id = ?
            ";
            $itemsStmt = $pdo->prepare($itemsSql);
            $itemsStmt->execute([$id]);
            $orders[0]['items'] = $itemsStmt->fetchAll();
            
            sendResponse(['success' => true, 'data' => $orders[0]]);
        } else {
            sendResponse(['success' => true, 'data' => $orders, 'count' => count($orders)]);
        }
        
    } catch (PDOException $e) {
        error_log("Orders API error: " . $e->getMessage());
        sendError('Failed to fetch orders', 500);
    }
}

function createOrder($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['customer_id', 'items'])) {
            sendError('Customer ID and items are required');
        }
        
        if (empty($data['items'])) {
            sendError('Order must have at least one item');
        }
        
        $pdo->beginTransaction();
        
        // Get customer info for discount calculation
        $customerSql = "
            SELECT c.customer_id, c.total_points, m.discount_rate, m.point_rate
            FROM Customer c
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            WHERE c.customer_id = ?
        ";
        $customerStmt = $pdo->prepare($customerSql);
        $customerStmt->execute([$data['customer_id']]);
        $customer = $customerStmt->fetch();
        
        if (!$customer) {
            sendError('Customer not found');
        }
        
        $discountRate = $customer['discount_rate'] / 100;
        $pointRate = $customer['point_rate'];
        
        // Note: Points redemption feature has been removed
        // Points are only earned, not used for payment
        $pointsUsed = 0;
        
        // Calculate totals
        $totalAmount = 0;
        $orderItems = [];
        
        // Get branch_id early for stock check
        $branchId = $data['branch_id'] ?? 1;
        
        foreach ($data['items'] as $item) {
            // Get product price and check stock FOR THE SPECIFIC BRANCH
            $productSql = "SELECT p.retail_price, p.name, 
                           COALESCE(SUM(CASE WHEN s.status = 'In Stock' AND s.branch_id = ? THEN s.quantity ELSE 0 END), 0) AS stock_qty
                           FROM Product p 
                           LEFT JOIN StockItem s ON p.product_id = s.product_id
                           WHERE p.product_id = ?
                           GROUP BY p.product_id";
            $productStmt = $pdo->prepare($productSql);
            $productStmt->execute([$branchId, $item['product_id']]);
            $product = $productStmt->fetch();
            
            if (!$product) {
                $pdo->rollBack();
                sendError('Product not found: ' . $item['product_id']);
            }
            
            $quantity = $item['quantity'];
            
            // Check stock availability for the selected branch
            if ($product['stock_qty'] < $quantity) {
                $pdo->rollBack();
                sendError('Insufficient stock at this store for "' . $product['name'] . '". Available: ' . intval($product['stock_qty']) . ' units. Please reduce quantity or select a different store.');
            }
            
            $unitPrice = $product['retail_price'];
            $itemTotal = $unitPrice * $quantity;
            $itemDiscount = $itemTotal * $discountRate;
            $finalItemTotal = $itemTotal - $itemDiscount;
            
            $totalAmount += $itemTotal;
            
            $orderItems[] = [
                'product_id' => $item['product_id'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount' => $itemDiscount,
                'total_price' => $finalItemTotal
            ];
        }
        
        // Member discount
        $memberDiscount = $totalAmount * $discountRate;
        
        // Promotion discount (from frontend calculation)
        $promotionDiscount = isset($data['promotion_discount']) ? floatval($data['promotion_discount']) : 0;
        
        // Total discount = member discount + promotion discount
        $discountAmount = $memberDiscount + $promotionDiscount;
        
        $deliveryFee = isset($data['delivery_fee']) ? floatval($data['delivery_fee']) : 0;
        $finalAmount = $totalAmount - $discountAmount + $deliveryFee;
        if ($finalAmount < 0) $finalAmount = 0;
        
        // Points earned on product total after discounts (not including delivery fee)
        $pointsEarned = floor(($totalAmount - $discountAmount) * $pointRate);
        
        // Generate order number
        $orderNumber = 'SO-' . date('Y') . '-' . str_pad(rand(1, 9999), 4, '0', STR_PAD_LEFT);
        
        // Get default employee (branchId already set above for stock check)
        $employeeId = $data['employee_id'] ?? 2;  // Default to sales staff
        
        // Add delivery fee and promotion info to notes if present
        $notesAdditions = [];
        if ($deliveryFee > 0) {
            $notesAdditions[] = "Delivery Fee: £" . number_format($deliveryFee, 2);
        }
        if ($promotionDiscount > 0 && isset($data['applied_promotions']) && $data['applied_promotions']) {
            $notesAdditions[] = "Promotions: " . $data['applied_promotions'] . " (-£" . number_format($promotionDiscount, 2) . ")";
        }
        if (!empty($notesAdditions)) {
            $data['notes'] = ($data['notes'] ?? '') . " (" . implode(", ", $notesAdditions) . ")";
        }
        
        // Insert order
        $insertOrderSql = "
            INSERT INTO Sales_Order (
                order_number, customer_id, employee_id, branch_id,
                total_amount, discount_amount, final_amount,
                payment_method, status, points_earned, points_used, payment_status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?, ?, 'Unpaid', ?)
        ";
        
        $stmt = $pdo->prepare($insertOrderSql);
        $stmt->execute([
            $orderNumber,
            $data['customer_id'],
            $employeeId,
            $branchId,
            $totalAmount,
            $discountAmount,  // Only member discount, no points redemption
            $finalAmount,
            $data['payment_method'] ?? 'Card',
            $pointsEarned,
            0,  // points_used always 0 (redemption feature removed)
            $data['notes'] ?? null
        ]);
        
        $orderId = $pdo->lastInsertId();
        
        // Insert order items and deduct stock
        $insertItemSql = "
            INSERT INTO Sales_Order_Item (order_id, product_id, quantity, unit_price, discount, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
        ";
        $itemStmt = $pdo->prepare($insertItemSql);
        
        foreach ($orderItems as $item) {
            $itemStmt->execute([
                $orderId,
                $item['product_id'],
                $item['quantity'],
                $item['unit_price'],
                $item['discount'],
                $item['total_price']
            ]);
            
            // Deduct stock from StockItem (FIFO - oldest first)
            $remainingQty = $item['quantity'];
            $stockSql = "SELECT stock_id, quantity FROM StockItem 
                         WHERE product_id = ? AND branch_id = ? AND status = 'In Stock' AND quantity > 0
                         ORDER BY received_date ASC";
            $stockStmt = $pdo->prepare($stockSql);
            $stockStmt->execute([$item['product_id'], $branchId]);
            
            while ($remainingQty > 0 && $stock = $stockStmt->fetch()) {
                $deduct = min($remainingQty, $stock['quantity']);
                $newQty = $stock['quantity'] - $deduct;
                
                if ($newQty <= 0) {
                    // Mark as sold if fully depleted
                    $updateStockSql = "UPDATE StockItem SET quantity = 0, status = 'Sold' WHERE stock_id = ?";
                } else {
                    $updateStockSql = "UPDATE StockItem SET quantity = ? WHERE stock_id = ?";
                }
                $updateStockStmt = $pdo->prepare($updateStockSql);
                
                if ($newQty <= 0) {
                    $updateStockStmt->execute([$stock['stock_id']]);
                } else {
                    $updateStockStmt->execute([$newQty, $stock['stock_id']]);
                }
                
                $remainingQty -= $deduct;
            }
        }
        
        // Note: Points redemption removed - points are only earned, not used for payment
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => 'Order created successfully',
            'data' => [
                'order_id' => $orderId,
                'order_number' => $orderNumber,
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'final_amount' => $finalAmount,
                'points_earned' => $pointsEarned,
                'points_used' => 0
            ]
        ], 201);
        
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Create order error: " . $e->getMessage());
        sendError('Failed to create order: ' . $e->getMessage(), 500);
    }
}

function updateOrderStatus($pdo) {
    try {
        $data = getRequestBody();
        
        if (!validateRequired($data, ['order_id', 'status'])) {
            sendError('Order ID and status are required');
        }
        
        $validStatuses = ['Pending', 'Completed', 'Returned', 'Cancelled'];
        if (!in_array($data['status'], $validStatuses)) {
            sendError('Invalid status');
        }
        
        // First check if order exists
        $checkSql = "SELECT order_id, status, payment_status, employee_id FROM Sales_Order WHERE order_id = ?";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([$data['order_id']]);
        $order = $checkStmt->fetch();
        
        if (!$order) {
            sendError('Order not found', 404);
        }
        
        // Update order status, payment_status, and optionally employee_id
        // Note: Database trigger 'trg_update_customer_spent' automatically handles:
        // - Updating customer's total_spent
        // - Updating customer's total_points
        // - Database trigger 'trg_update_membership' handles membership tier upgrades
        
        // If employee_id is provided, also update who processed the order
        $employeeId = isset($data['employee_id']) ? intval($data['employee_id']) : $order['employee_id'];
        $paymentStatus = ($data['status'] === 'Completed') ? 'Paid' : $order['payment_status'];
        
        $sql = "UPDATE Sales_Order SET status = ?, payment_status = ?, employee_id = ? WHERE order_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$data['status'], $paymentStatus, $employeeId, $data['order_id']]);
        
        sendResponse([
            'success' => true,
            'message' => 'Order status updated to ' . $data['status']
        ]);
        
    } catch (PDOException $e) {
        error_log("Update order error: " . $e->getMessage());
        sendError('Failed to update order: ' . $e->getMessage(), 500);
    }
}
?>

