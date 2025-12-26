<?php
/**
 * Summit Gear & Adventures - Reviews API
 * 
 * Endpoints:
 * GET /api/reviews.php?product_id=1 - Get all reviews for a product
 * GET /api/reviews.php?customer_id=1 - Get all reviews by a customer
 * POST /api/reviews.php - Create a new review
 * PUT /api/reviews.php?id=1 - Update a review
 * DELETE /api/reviews.php?id=1 - Delete a review
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        getReviews($pdo);
        break;
    case 'POST':
        createReview($pdo);
        break;
    case 'PUT':
        updateReview($pdo);
        break;
    case 'DELETE':
        deleteReview($pdo);
        break;
    default:
        sendError('Method not allowed', 405);
}

function getReviews($pdo) {
    try {
        $productId = $_GET['product_id'] ?? null;
        $customerId = $_GET['customer_id'] ?? null;
        $reviewId = $_GET['id'] ?? null;
        
        $sql = "
            SELECT 
                r.review_id,
                r.product_id,
                r.customer_id,
                r.order_id,
                r.rating,
                r.title,
                r.content,
                r.is_verified_purchase,
                r.helpful_count,
                r.created_at,
                r.updated_at,
                c.name AS customer_name,
                p.name AS product_name
            FROM Product_Review r
            JOIN Customer c ON r.customer_id = c.customer_id
            JOIN Product p ON r.product_id = p.product_id
            WHERE r.is_approved = TRUE
        ";
        
        $params = [];
        
        if ($reviewId) {
            $sql .= " AND r.review_id = ?";
            $params[] = $reviewId;
        }
        
        if ($productId) {
            $sql .= " AND r.product_id = ?";
            $params[] = $productId;
        }
        
        if ($customerId) {
            $sql .= " AND r.customer_id = ?";
            $params[] = $customerId;
        }
        
        $sql .= " ORDER BY r.created_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reviews = $stmt->fetchAll();
        
        // Calculate average rating if product_id is specified
        $avgRating = null;
        $totalReviews = count($reviews);
        
        if ($productId && $totalReviews > 0) {
            $totalRating = array_sum(array_column($reviews, 'rating'));
            $avgRating = round($totalRating / $totalReviews, 1);
        }
        
        sendResponse([
            'success' => true, 
            'data' => $reviews, 
            'count' => $totalReviews,
            'average_rating' => $avgRating
        ]);
        
    } catch (PDOException $e) {
        error_log("Reviews API error: " . $e->getMessage());
        sendError('Failed to fetch reviews', 500);
    }
}

function createReview($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Validate required fields
        $required = ['product_id', 'customer_id', 'rating', 'title', 'content'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                sendError("Missing required field: $field", 400);
            }
        }
        
        // Validate rating range
        $rating = intval($data['rating']);
        if ($rating < 1 || $rating > 5) {
            sendError('Rating must be between 1 and 5', 400);
        }
        
        // Check if customer exists
        $stmt = $pdo->prepare("SELECT customer_id, name FROM Customer WHERE customer_id = ? AND is_active = TRUE");
        $stmt->execute([$data['customer_id']]);
        $customer = $stmt->fetch();
        
        if (!$customer) {
            sendError('Customer not found', 404);
        }
        
        // Check if product exists
        $stmt = $pdo->prepare("SELECT product_id FROM Product WHERE product_id = ? AND status = 'Active'");
        $stmt->execute([$data['product_id']]);
        if (!$stmt->fetch()) {
            sendError('Product not found', 404);
        }
        
        // Check if customer already reviewed this product
        $stmt = $pdo->prepare("SELECT review_id FROM Product_Review WHERE customer_id = ? AND product_id = ?");
        $stmt->execute([$data['customer_id'], $data['product_id']]);
        if ($stmt->fetch()) {
            sendError('You have already reviewed this product', 400);
        }
        
        // Check if this is a verified purchase (customer has ordered this product)
        $isVerified = false;
        $orderId = null;
        
        $stmt = $pdo->prepare("
            SELECT so.order_id 
            FROM Sales_Order so
            JOIN Sales_Order_Item soi ON so.order_id = soi.order_id
            WHERE so.customer_id = ? 
            AND soi.product_id = ? 
            AND so.status IN ('Completed', 'Pending')
            ORDER BY so.order_date DESC
            LIMIT 1
        ");
        $stmt->execute([$data['customer_id'], $data['product_id']]);
        $order = $stmt->fetch();
        
        if ($order) {
            $isVerified = true;
            $orderId = $order['order_id'];
        }
        
        // Insert review
        $stmt = $pdo->prepare("
            INSERT INTO Product_Review (
                product_id, customer_id, order_id, rating, title, content, is_verified_purchase
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['product_id'],
            $data['customer_id'],
            $orderId,
            $rating,
            trim($data['title']),
            trim($data['content']),
            $isVerified ? 1 : 0
        ]);
        
        $reviewId = $pdo->lastInsertId();
        
        // Fetch the created review
        $stmt = $pdo->prepare("
            SELECT 
                r.review_id,
                r.product_id,
                r.customer_id,
                r.order_id,
                r.rating,
                r.title,
                r.content,
                r.is_verified_purchase,
                r.helpful_count,
                r.created_at,
                c.name AS customer_name
            FROM Product_Review r
            JOIN Customer c ON r.customer_id = c.customer_id
            WHERE r.review_id = ?
        ");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch();
        
        sendResponse([
            'success' => true,
            'message' => 'Review submitted successfully',
            'data' => $review
        ]);
        
    } catch (PDOException $e) {
        error_log("Reviews API error: " . $e->getMessage());
        if ($e->getCode() == 23000) {
            sendError('You have already reviewed this product', 400);
        }
        sendError('Failed to create review', 500);
    }
}

function updateReview($pdo) {
    try {
        $reviewId = $_GET['id'] ?? null;
        if (!$reviewId) {
            sendError('Review ID is required', 400);
        }
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        // Check if review exists and get owner
        $stmt = $pdo->prepare("SELECT review_id, customer_id FROM Product_Review WHERE review_id = ?");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch();
        
        if (!$review) {
            sendError('Review not found', 404);
        }
        
        // Verify ownership if customer_id is provided
        if (isset($data['customer_id']) && $review['customer_id'] != $data['customer_id']) {
            sendError('You can only edit your own reviews', 403);
        }
        
        // Build update query
        $updates = [];
        $params = [];
        
        if (isset($data['rating'])) {
            $rating = intval($data['rating']);
            if ($rating < 1 || $rating > 5) {
                sendError('Rating must be between 1 and 5', 400);
            }
            $updates[] = "rating = ?";
            $params[] = $rating;
        }
        
        if (isset($data['title'])) {
            $updates[] = "title = ?";
            $params[] = trim($data['title']);
        }
        
        if (isset($data['content'])) {
            $updates[] = "content = ?";
            $params[] = trim($data['content']);
        }
        
        if (empty($updates)) {
            sendError('No fields to update', 400);
        }
        
        $params[] = $reviewId;
        $sql = "UPDATE Product_Review SET " . implode(", ", $updates) . " WHERE review_id = ?";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        sendResponse([
            'success' => true,
            'message' => 'Review updated successfully'
        ]);
        
    } catch (PDOException $e) {
        error_log("Reviews API error: " . $e->getMessage());
        sendError('Failed to update review', 500);
    }
}

function deleteReview($pdo) {
    try {
        $reviewId = $_GET['id'] ?? null;
        $customerId = $_GET['customer_id'] ?? null;
        
        if (!$reviewId) {
            sendError('Review ID is required', 400);
        }
        
        // Check if review exists
        $stmt = $pdo->prepare("SELECT review_id, customer_id FROM Product_Review WHERE review_id = ?");
        $stmt->execute([$reviewId]);
        $review = $stmt->fetch();
        
        if (!$review) {
            sendError('Review not found', 404);
        }
        
        // Verify ownership if customer_id is provided
        if ($customerId && $review['customer_id'] != $customerId) {
            sendError('You can only delete your own reviews', 403);
        }
        
        // Delete review
        $stmt = $pdo->prepare("DELETE FROM Product_Review WHERE review_id = ?");
        $stmt->execute([$reviewId]);
        
        sendResponse([
            'success' => true,
            'message' => 'Review deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        error_log("Reviews API error: " . $e->getMessage());
        sendError('Failed to delete review', 500);
    }
}
?>

