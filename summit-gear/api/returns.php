<?php
/**
 * Returns API - Handle customer return requests
 * Staff processes returns with full data consistency:
 * - Stock restoration
 * - Points refund
 * - Sales adjustment
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getReturns($pdo);
        break;
    case 'POST':
        createReturn($pdo);
        break;
    case 'PUT':
        processReturn($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

// Get return requests
function getReturns($pdo) {
    try {
        $customerId = $_GET['customer_id'] ?? null;
        $branchId = $_GET['branch_id'] ?? null;
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT r.*, 
                       c.name as customer_name, c.email as customer_email,
                       so.order_number, so.final_amount as order_amount, so.order_date,
                       so.branch_id, b.branch_name,
                       e.name as processed_by_name
                FROM Return_Request r
                JOIN Customer c ON r.customer_id = c.customer_id
                JOIN Sales_Order so ON r.order_id = so.order_id
                JOIN Branch b ON so.branch_id = b.branch_id
                LEFT JOIN Employee e ON r.processed_by = e.employee_id";
        
        $conditions = [];
        $params = [];
        
        // Filter by customer (for customer portal)
        if ($customerId) {
            $conditions[] = "r.customer_id = ?";
            $params[] = $customerId;
        }
        
        // Filter by branch (for staff portal - only see returns from their branch)
        if ($branchId) {
            $conditions[] = "so.branch_id = ?";
            $params[] = $branchId;
        }
        
        // Filter by status
        if ($status) {
            $conditions[] = "r.status = ?";
            $params[] = $status;
        }
        
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $sql .= " ORDER BY r.requested_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $returns = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $returns, 'count' => count($returns)]);
    } catch (PDOException $e) {
        sendError('Failed to fetch returns: ' . $e->getMessage(), 500);
    }
}

// Create new return request (from customer)
function createReturn($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $orderId = $data['order_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $reason = $data['reason'] ?? null;
        $description = $data['description'] ?? '';
        
        if (!$orderId || !$customerId || !$reason) {
            sendError('Missing required fields', 400);
            return;
        }
        
        // Check if order exists and belongs to customer
        $orderCheck = $pdo->prepare("SELECT order_id, status FROM Sales_Order WHERE order_id = ? AND customer_id = ?");
        $orderCheck->execute([$orderId, $customerId]);
        $order = $orderCheck->fetch();
        
        if (!$order) {
            sendError('Order not found or does not belong to you', 404);
            return;
        }
        
        if ($order['status'] !== 'Completed') {
            sendError('Only completed orders can be returned', 400);
            return;
        }
        
        // Check if return already exists for this order
        $existingCheck = $pdo->prepare("SELECT return_id FROM Return_Request WHERE order_id = ?");
        $existingCheck->execute([$orderId]);
        if ($existingCheck->fetch()) {
            sendError('A return request already exists for this order', 400);
            return;
        }
        
        // Create return request
        $stmt = $pdo->prepare("
            INSERT INTO Return_Request (order_id, customer_id, reason, description, status)
            VALUES (?, ?, ?, ?, 'Pending')
        ");
        $stmt->execute([$orderId, $customerId, $reason, $description]);
        
        $returnId = $pdo->lastInsertId();
        
        sendResponse([
            'success' => true, 
            'message' => 'Return request submitted successfully',
            'return_id' => $returnId
        ]);
    } catch (PDOException $e) {
        sendError('Failed to create return request: ' . $e->getMessage(), 500);
    }
}

// Process return request (staff approves/rejects)
function processReturn($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $returnId = $data['return_id'] ?? null;
        $status = $data['status'] ?? null; // 'Approved', 'Rejected'
        $processedBy = $data['processed_by'] ?? null;
        $refundAmount = $data['refund_amount'] ?? null;
        
        if (!$returnId || !$status) {
            sendError('Return ID and status are required', 400);
            return;
        }
        
        if (!in_array($status, ['Approved', 'Rejected'])) {
            sendError('Invalid status. Must be Approved or Rejected', 400);
            return;
        }
        
        // Get return request details
        $returnQuery = $pdo->prepare("
            SELECT r.*, so.order_id, so.customer_id, so.final_amount, so.points_earned, so.branch_id
            FROM Return_Request r
            JOIN Sales_Order so ON r.order_id = so.order_id
            WHERE r.return_id = ?
        ");
        $returnQuery->execute([$returnId]);
        $returnRequest = $returnQuery->fetch();
        
        if (!$returnRequest) {
            sendError('Return request not found', 404);
            return;
        }
        
        if ($returnRequest['status'] !== 'Pending') {
            sendError('Return request has already been processed', 400);
            return;
        }
        
        $pdo->beginTransaction();
        
        if ($status === 'Approved') {
            $orderId = $returnRequest['order_id'];
            $customerId = $returnRequest['customer_id'];
            $refund = $refundAmount ?? $returnRequest['final_amount'];
            $pointsToRefund = $returnRequest['points_earned'];
            $branchId = $returnRequest['branch_id'];
            
            // 1. Update return request status
            $updateReturn = $pdo->prepare("
                UPDATE Return_Request 
                SET status = 'Approved', refund_amount = ?, processed_by = ?, processed_at = NOW()
                WHERE return_id = ?
            ");
            $updateReturn->execute([$refund, $processedBy, $returnId]);
            
            // 2. Update order status to 'Returned'
            $updateOrder = $pdo->prepare("UPDATE Sales_Order SET status = 'Returned' WHERE order_id = ?");
            $updateOrder->execute([$orderId]);
            
            // 3. Refund customer points (subtract points_earned from total_points)
            if ($pointsToRefund > 0) {
                $updateCustomer = $pdo->prepare("
                    UPDATE Customer 
                    SET total_points = total_points - ?, 
                        total_spent = total_spent - ?
                    WHERE customer_id = ?
                ");
                $updateCustomer->execute([$pointsToRefund, $refund, $customerId]);
            }
            
            // 4. Restore stock - get order items and add back to inventory
            $orderItems = $pdo->prepare("
                SELECT soi.product_id, soi.quantity, soi.unit_price
                FROM Sales_Order_Item soi
                WHERE soi.order_id = ?
            ");
            $orderItems->execute([$orderId]);
            $items = $orderItems->fetchAll();
            
            foreach ($items as $item) {
                // Create new stock item with 'Returned' status
                $batchNo = 'RTN-' . date('Ymd') . '-' . $returnId;
                $insertStock = $pdo->prepare("
                    INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, received_date, unit_cost, status)
                    VALUES (?, ?, ?, ?, CURDATE(), ?, 'Returned')
                ");
                $insertStock->execute([
                    $batchNo,
                    $item['product_id'],
                    $branchId,
                    $item['quantity'],
                    $item['unit_price'] * 0.7  // Assume returned items are worth 70% of retail
                ]);
            }
            
            // 5. Record the points transaction (refund)
            if ($pointsToRefund > 0) {
                // Get current customer balance after deduction
                $balanceQuery = $pdo->prepare("SELECT total_points FROM Customer WHERE customer_id = ?");
                $balanceQuery->execute([$customerId]);
                $balanceAfter = $balanceQuery->fetchColumn();
                
                $pointsTrans = $pdo->prepare("
                    INSERT INTO Points_Transaction (customer_id, point_change, trans_type, balance_after, description, order_id)
                    VALUES (?, ?, 'Adjust', ?, ?, ?)
                ");
                $pointsTrans->execute([
                    $customerId,
                    -$pointsToRefund,
                    $balanceAfter,
                    'Return refund for order #' . $orderId,
                    $orderId
                ]);
            }
            
        } else {
            // Rejected
            $updateReturn = $pdo->prepare("
                UPDATE Return_Request 
                SET status = 'Rejected', processed_by = ?, processed_at = NOW()
                WHERE return_id = ?
            ");
            $updateReturn->execute([$processedBy, $returnId]);
        }
        
        $pdo->commit();
        
        sendResponse([
            'success' => true,
            'message' => "Return request {$status} successfully"
        ]);
        
    } catch (PDOException $e) {
        $pdo->rollBack();
        sendError('Failed to process return: ' . $e->getMessage(), 500);
    }
}
?>

