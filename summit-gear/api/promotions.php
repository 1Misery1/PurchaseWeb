<?php
/**
 * Promotions, Coupons, Banners API
 * For Business Admin management
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$method = $_SERVER['REQUEST_METHOD'];
$type = $_GET['type'] ?? 'promotions'; // promotions, coupons, banners

switch ($type) {
    case 'promotions':
        handlePromotions($pdo, $method);
        break;
    case 'coupons':
        handleCoupons($pdo, $method);
        break;
    case 'banners':
        handleBanners($pdo, $method);
        break;
    case 'returns':
        handleReturns($pdo, $method);
        break;
    default:
        sendError('Invalid type', 400);
}

// =====================================================
// PROMOTIONS
// =====================================================
function handlePromotions($pdo, $method) {
    switch ($method) {
        case 'GET':
            getPromotions($pdo);
            break;
        case 'POST':
            createPromotion($pdo);
            break;
        case 'PUT':
            updatePromotion($pdo);
            break;
        case 'DELETE':
            deletePromotion($pdo);
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

function getPromotions($pdo) {
    try {
        $activeOnly = isset($_GET['active']) && $_GET['active'] === 'true';
        $branchId = $_GET['branch_id'] ?? null;
        
        $sql = "SELECT p.*, e.name as created_by_name, e.branch_id, br.branch_name 
                FROM Promotion p 
                LEFT JOIN Employee e ON p.created_by = e.employee_id
                LEFT JOIN Branch br ON e.branch_id = br.branch_id";
        
        $conditions = [];
        $params = [];
        
        if ($activeOnly) {
            $conditions[] = "p.is_active = TRUE AND p.start_date <= CURDATE() AND p.end_date >= CURDATE()";
        }
        
        // Filter by branch_id for admin view
        if ($branchId) {
            $conditions[] = "e.branch_id = ?";
            $params[] = $branchId;
        }
        
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $sql .= " ORDER BY p.start_date DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $promotions = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $promotions, 'count' => count($promotions)]);
    } catch (PDOException $e) {
        sendError('Failed to fetch promotions: ' . $e->getMessage(), 500);
    }
}

function createPromotion($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            INSERT INTO Promotion (title, description, discount_type, discount_value, min_purchase, 
                                   start_date, end_date, applies_to, category, product_id, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['title'],
            $data['description'] ?? null,
            $data['discount_type'],
            $data['discount_value'],
            $data['min_purchase'] ?? 0,
            $data['start_date'],
            $data['end_date'],
            $data['applies_to'] ?? 'All',
            $data['category'] ?? null,
            $data['product_id'] ?? null,
            $data['created_by'] ?? null
        ]);
        
        sendResponse(['success' => true, 'message' => 'Promotion created', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        sendError('Failed to create promotion: ' . $e->getMessage(), 500);
    }
}

function updatePromotion($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['promotion_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) {
            sendError('Promotion ID required', 400);
            return;
        }
        
        // Toggle active status or full update
        if (isset($data['is_active']) && count($data) <= 2) {
            // Convert boolean to integer for MySQL
            $isActive = $data['is_active'] ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE Promotion SET is_active = ? WHERE promotion_id = ?");
            $stmt->execute([$isActive, $id]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE Promotion SET title = ?, description = ?, discount_type = ?, discount_value = ?,
                       min_purchase = ?, start_date = ?, end_date = ?, applies_to = ?, category = ?, is_active = ?
                WHERE promotion_id = ?
            ");
            $stmt->execute([
                $data['title'], $data['description'], $data['discount_type'], $data['discount_value'],
                $data['min_purchase'], $data['start_date'], $data['end_date'], $data['applies_to'],
                $data['category'], $data['is_active'] ?? true, $id
            ]);
        }
        
        sendResponse(['success' => true, 'message' => 'Promotion updated']);
    } catch (PDOException $e) {
        sendError('Failed to update promotion: ' . $e->getMessage(), 500);
    }
}

function deletePromotion($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) { sendError('Promotion ID required', 400); return; }
        
        $stmt = $pdo->prepare("DELETE FROM Promotion WHERE promotion_id = ?");
        $stmt->execute([$id]);
        
        sendResponse(['success' => true, 'message' => 'Promotion deleted']);
    } catch (PDOException $e) {
        sendError('Failed to delete promotion: ' . $e->getMessage(), 500);
    }
}

// =====================================================
// COUPONS
// =====================================================
function handleCoupons($pdo, $method) {
    switch ($method) {
        case 'GET':
            getCoupons($pdo);
            break;
        case 'POST':
            createCoupon($pdo);
            break;
        case 'PUT':
            updateCoupon($pdo);
            break;
        case 'DELETE':
            deleteCoupon($pdo);
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

function getCoupons($pdo) {
    try {
        $code = $_GET['code'] ?? null;
        
        if ($code) {
            // Validate a specific coupon code
            $stmt = $pdo->prepare("
                SELECT * FROM Coupon 
                WHERE code = ? AND is_active = TRUE 
                AND start_date <= CURDATE() AND end_date >= CURDATE()
                AND (max_uses IS NULL OR used_count < max_uses)
            ");
            $stmt->execute([$code]);
            $coupon = $stmt->fetch();
            
            if ($coupon) {
                sendResponse(['success' => true, 'valid' => true, 'data' => $coupon]);
            } else {
                sendResponse(['success' => true, 'valid' => false, 'message' => 'Invalid or expired coupon']);
            }
        } else {
            // Get all coupons for admin
            $stmt = $pdo->query("SELECT c.*, e.name as created_by_name FROM Coupon c LEFT JOIN Employee e ON c.created_by = e.employee_id ORDER BY c.end_date DESC");
            $coupons = $stmt->fetchAll();
            sendResponse(['success' => true, 'data' => $coupons, 'count' => count($coupons)]);
        }
    } catch (PDOException $e) {
        sendError('Failed to fetch coupons: ' . $e->getMessage(), 500);
    }
}

function createCoupon($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            INSERT INTO Coupon (code, description, discount_type, discount_value, min_purchase, max_uses, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            strtoupper($data['code']),
            $data['description'] ?? null,
            $data['discount_type'],
            $data['discount_value'],
            $data['min_purchase'] ?? 0,
            $data['max_uses'] ?? null,
            $data['start_date'],
            $data['end_date'],
            $data['created_by'] ?? null
        ]);
        
        sendResponse(['success' => true, 'message' => 'Coupon created', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError('Coupon code already exists', 400);
        } else {
            sendError('Failed to create coupon: ' . $e->getMessage(), 500);
        }
    }
}

function updateCoupon($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['coupon_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) { sendError('Coupon ID required', 400); return; }
        
        if (isset($data['is_active']) && count($data) <= 2) {
            // Convert boolean to integer for MySQL
            $isActive = $data['is_active'] ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE Coupon SET is_active = ? WHERE coupon_id = ?");
            $stmt->execute([$isActive, $id]);
        } else {
            $stmt = $pdo->prepare("
                UPDATE Coupon SET code = ?, description = ?, discount_type = ?, discount_value = ?,
                       min_purchase = ?, max_uses = ?, start_date = ?, end_date = ?, is_active = ?
                WHERE coupon_id = ?
            ");
            $stmt->execute([
                strtoupper($data['code']), $data['description'], $data['discount_type'], $data['discount_value'],
                $data['min_purchase'], $data['max_uses'], $data['start_date'], $data['end_date'],
                $data['is_active'] ?? true, $id
            ]);
        }
        
        sendResponse(['success' => true, 'message' => 'Coupon updated']);
    } catch (PDOException $e) {
        sendError('Failed to update coupon: ' . $e->getMessage(), 500);
    }
}

function deleteCoupon($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) { sendError('Coupon ID required', 400); return; }
        
        $stmt = $pdo->prepare("DELETE FROM Coupon WHERE coupon_id = ?");
        $stmt->execute([$id]);
        
        sendResponse(['success' => true, 'message' => 'Coupon deleted']);
    } catch (PDOException $e) {
        sendError('Failed to delete coupon: ' . $e->getMessage(), 500);
    }
}

// =====================================================
// BANNERS
// =====================================================
function handleBanners($pdo, $method) {
    switch ($method) {
        case 'GET':
            getBanners($pdo);
            break;
        case 'POST':
            createBanner($pdo);
            break;
        case 'PUT':
            updateBanner($pdo);
            break;
        case 'DELETE':
            deleteBanner($pdo);
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

function getBanners($pdo) {
    try {
        $activeOnly = isset($_GET['active']) && $_GET['active'] === 'true';
        $branchId = $_GET['branch_id'] ?? null;
        
        $sql = "SELECT b.*, e.name as created_by_name, e.branch_id, br.branch_name, br.city as branch_city
                FROM Homepage_Banner b 
                LEFT JOIN Employee e ON b.created_by = e.employee_id
                LEFT JOIN Branch br ON e.branch_id = br.branch_id";
        
        $conditions = [];
        $params = [];
        
        if ($activeOnly) {
            $conditions[] = "b.is_active = TRUE AND (b.start_date IS NULL OR b.start_date <= CURDATE()) AND (b.end_date IS NULL OR b.end_date >= CURDATE())";
        }
        
        // Filter by branch_id for admin view
        if ($branchId) {
            $conditions[] = "e.branch_id = ?";
            $params[] = $branchId;
        }
        
        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $sql .= " ORDER BY b.position ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $banners = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $banners, 'count' => count($banners)]);
    } catch (PDOException $e) {
        sendError('Failed to fetch banners: ' . $e->getMessage(), 500);
    }
}

function createBanner($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $stmt = $pdo->prepare("
            INSERT INTO Homepage_Banner (title, subtitle, image_url, link_url, link_text, position, start_date, end_date, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['title'],
            $data['subtitle'] ?? null,
            $data['image_url'] ?? null,
            $data['link_url'] ?? null,
            $data['link_text'] ?? null,
            $data['position'] ?? 1,
            $data['start_date'] ?? null,
            $data['end_date'] ?? null,
            $data['created_by'] ?? null
        ]);
        
        sendResponse(['success' => true, 'message' => 'Banner created', 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        sendError('Failed to create banner: ' . $e->getMessage(), 500);
    }
}

function updateBanner($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['banner_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) { sendError('Banner ID required', 400); return; }
        
        if (isset($data['is_active']) && count($data) <= 2) {
            // Convert boolean to integer for MySQL
            $isActive = $data['is_active'] ? 1 : 0;
            $stmt = $pdo->prepare("UPDATE Homepage_Banner SET is_active = ? WHERE banner_id = ?");
            $stmt->execute([$isActive, $id]);
        } else {
            // Convert boolean to integer for MySQL
            $isActive = isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : 1;
            $stmt = $pdo->prepare("
                UPDATE Homepage_Banner SET title = ?, subtitle = ?, image_url = ?, link_url = ?, 
                       link_text = ?, position = ?, start_date = ?, end_date = ?, is_active = ?
                WHERE banner_id = ?
            ");
            $stmt->execute([
                $data['title'], $data['subtitle'], $data['image_url'], $data['link_url'],
                $data['link_text'], $data['position'], $data['start_date'], $data['end_date'],
                $isActive, $id
            ]);
        }
        
        sendResponse(['success' => true, 'message' => 'Banner updated']);
    } catch (PDOException $e) {
        sendError('Failed to update banner: ' . $e->getMessage(), 500);
    }
}

function deleteBanner($pdo) {
    try {
        $id = $_GET['id'] ?? null;
        if (!$id) { sendError('Banner ID required', 400); return; }
        
        $stmt = $pdo->prepare("DELETE FROM Homepage_Banner WHERE banner_id = ?");
        $stmt->execute([$id]);
        
        sendResponse(['success' => true, 'message' => 'Banner deleted']);
    } catch (PDOException $e) {
        sendError('Failed to delete banner: ' . $e->getMessage(), 500);
    }
}

// =====================================================
// RETURNS (退货管理)
// =====================================================
function handleReturns($pdo, $method) {
    switch ($method) {
        case 'GET':
            getReturns($pdo);
            break;
        case 'PUT':
            processReturn($pdo);
            break;
        default:
            sendError('Method not allowed', 405);
    }
}

function getReturns($pdo) {
    try {
        $status = $_GET['status'] ?? null;
        
        $sql = "SELECT r.*, c.name as customer_name, c.email as customer_email,
                       so.order_number, so.final_amount as order_amount,
                       e.name as processed_by_name
                FROM Return_Request r
                JOIN Customer c ON r.customer_id = c.customer_id
                JOIN Sales_Order so ON r.order_id = so.order_id
                LEFT JOIN Employee e ON r.processed_by = e.employee_id";
        
        if ($status) {
            $sql .= " WHERE r.status = ?";
        }
        
        $sql .= " ORDER BY r.requested_at DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($status ? [$status] : []);
        $returns = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $returns, 'count' => count($returns)]);
    } catch (PDOException $e) {
        sendError('Failed to fetch returns: ' . $e->getMessage(), 500);
    }
}

function processReturn($pdo) {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        $id = $data['return_id'] ?? $_GET['id'] ?? null;
        
        if (!$id) { sendError('Return ID required', 400); return; }
        
        $stmt = $pdo->prepare("
            UPDATE Return_Request SET status = ?, refund_amount = ?, processed_by = ?, processed_at = NOW()
            WHERE return_id = ?
        ");
        $stmt->execute([$data['status'], $data['refund_amount'] ?? null, $data['processed_by'] ?? null, $id]);
        
        sendResponse(['success' => true, 'message' => 'Return request processed']);
    } catch (PDOException $e) {
        sendError('Failed to process return: ' . $e->getMessage(), 500);
    }
}
?>

