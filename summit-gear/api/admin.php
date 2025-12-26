<?php
/**
 * Summit Gear & Adventures - Admin API
 * 
 * Endpoints:
 * GET /api/admin.php?action=dashboard - Get dashboard statistics
 * GET /api/admin.php?action=customers - Get all customers
 * GET /api/admin.php?action=orders - Get all orders
 * GET /api/admin.php?action=products - Get all products with stock
 * GET /api/admin.php?action=employees - Get all employees
 */

require_once 'config.php';

$pdo = getDBConnection();
if (!$pdo) {
    sendError('Database connection failed', 500);
}

$action = $_GET['action'] ?? 'dashboard';

switch ($action) {
    case 'dashboard':
        getDashboardStats($pdo);
        break;
    case 'customers':
        getAllCustomers($pdo);
        break;
    case 'orders':
        getAllOrders($pdo);
        break;
    case 'products':
        getAllProducts($pdo);
        break;
    case 'employees':
        getAllEmployees($pdo);
        break;
    case 'low-stock':
        getLowStock($pdo);
        break;
    default:
        sendError('Invalid action', 400);
}

function getDashboardStats($pdo) {
    try {
        // Today's date
        $today = date('Y-m-d');
        $thisMonth = date('Y-m');
        
        // Total Revenue Today
        $stmt = $pdo->prepare("
            SELECT COALESCE(SUM(final_amount), 0) as revenue 
            FROM Sales_Order 
            WHERE DATE(order_date) = ?
        ");
        $stmt->execute([$today]);
        $todayRevenue = $stmt->fetch()['revenue'];
        
        // Total Orders Today
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM Sales_Order 
            WHERE DATE(order_date) = ?
        ");
        $stmt->execute([$today]);
        $todayOrders = $stmt->fetch()['count'];
        
        // Total Customers
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM Customer WHERE is_active = TRUE");
        $totalCustomers = $stmt->fetch()['count'];
        
        // New Customers This Month
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM Customer 
            WHERE DATE_FORMAT(registration_date, '%Y-%m') = ? AND is_active = TRUE
        ");
        $stmt->execute([$thisMonth]);
        $newCustomersMonth = $stmt->fetch()['count'];
        
        // Total Products
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM Product WHERE status = 'Active'");
        $totalProducts = $stmt->fetch()['count'];
        
        // Low Stock Items
        $stmt = $pdo->query("
            SELECT COUNT(DISTINCT p.product_id) as count 
            FROM Product p
            LEFT JOIN StockItem si ON p.product_id = si.product_id
            GROUP BY p.product_id
            HAVING COALESCE(SUM(CASE WHEN si.status = 'In Stock' THEN si.quantity ELSE 0 END), 0) <= 10
        ");
        $lowStockCount = $stmt->fetch()['count'] ?? 0;
        
        // Total Employees
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM Employee WHERE is_active = TRUE");
        $totalEmployees = $stmt->fetch()['count'];
        
        // Total Inventory Value
        $stmt = $pdo->query("
            SELECT COALESCE(SUM(p.cost_price * si.quantity), 0) as value 
            FROM StockItem si 
            JOIN Product p ON si.product_id = p.product_id
            WHERE si.status = 'In Stock'
        ");
        $inventoryValue = $stmt->fetch()['value'];
        
        // Recent Orders (last 10)
        $stmt = $pdo->query("
            SELECT 
                so.order_id,
                so.order_number,
                so.order_date,
                so.final_amount,
                so.status,
                c.name as customer_name,
                c.email as customer_email,
                m.membership_type
            FROM Sales_Order so
            JOIN Customer c ON so.customer_id = c.customer_id
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            ORDER BY so.order_date DESC
            LIMIT 10
        ");
        $recentOrders = $stmt->fetchAll();
        
        // Revenue by Month (last 6 months)
        $stmt = $pdo->query("
            SELECT 
                DATE_FORMAT(order_date, '%Y-%m') as month,
                SUM(final_amount) as revenue,
                COUNT(*) as orders
            FROM Sales_Order
            WHERE order_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(order_date, '%Y-%m')
            ORDER BY month ASC
        ");
        $monthlyRevenue = $stmt->fetchAll();
        
        sendResponse([
            'success' => true,
            'data' => [
                'today_revenue' => floatval($todayRevenue),
                'today_orders' => intval($todayOrders),
                'total_customers' => intval($totalCustomers),
                'new_customers_month' => intval($newCustomersMonth),
                'total_products' => intval($totalProducts),
                'low_stock_count' => intval($lowStockCount),
                'total_employees' => intval($totalEmployees),
                'inventory_value' => floatval($inventoryValue),
                'recent_orders' => $recentOrders,
                'monthly_revenue' => $monthlyRevenue
            ]
        ]);
        
    } catch (PDOException $e) {
        error_log("Admin dashboard error: " . $e->getMessage());
        sendError('Failed to fetch dashboard stats', 500);
    }
}

function getAllCustomers($pdo) {
    try {
        $branchId = $_GET['branch_id'] ?? null;
        
        // If branch_id is provided, get customers who have ordered from this branch
        if ($branchId) {
            $stmt = $pdo->prepare("
                SELECT 
                    c.customer_id,
                    c.name,
                    SUBSTRING_INDEX(c.name, ' ', 1) as first_name,
                    SUBSTRING_INDEX(c.name, ' ', -1) as last_name,
                    c.email,
                    c.phone,
                    c.city,
                    c.total_points,
                    c.total_spent,
                    c.registration_date,
                    c.registration_date as created_at,
                    m.membership_type as membership_name,
                    (SELECT COUNT(*) FROM Sales_Order so WHERE so.customer_id = c.customer_id AND so.branch_id = ?) as total_orders,
                    (SELECT COALESCE(SUM(so.final_amount), 0) FROM Sales_Order so WHERE so.customer_id = c.customer_id AND so.branch_id = ?) as branch_spent
                FROM Customer c
                LEFT JOIN Membership m ON c.membership_id = m.membership_id
                WHERE c.is_active = TRUE
                AND c.customer_id IN (SELECT DISTINCT customer_id FROM Sales_Order WHERE branch_id = ?)
                ORDER BY branch_spent DESC
            ");
            $stmt->execute([$branchId, $branchId, $branchId]);
        } else {
        $stmt = $pdo->query("
            SELECT 
                c.customer_id,
                c.name,
                    SUBSTRING_INDEX(c.name, ' ', 1) as first_name,
                    SUBSTRING_INDEX(c.name, ' ', -1) as last_name,
                c.email,
                c.phone,
                c.city,
                c.total_points,
                c.total_spent,
                c.registration_date,
                    c.registration_date as created_at,
                    m.membership_type as membership_name,
                    (SELECT COUNT(*) FROM Sales_Order so WHERE so.customer_id = c.customer_id) as total_orders
            FROM Customer c
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            WHERE c.is_active = TRUE
            ORDER BY c.registration_date DESC
        ");
        }
        
        $customers = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $customers, 'count' => count($customers)]);
        
    } catch (PDOException $e) {
        error_log("Admin customers error: " . $e->getMessage());
        sendError('Failed to fetch customers', 500);
    }
}

function getAllOrders($pdo) {
    try {
        $status = $_GET['status'] ?? null;
        $branchId = $_GET['branch_id'] ?? null;
        $limit = $_GET['limit'] ?? 200;
        $includeItems = $_GET['include_items'] ?? 'true';
        
        $sql = "
            SELECT 
                so.order_id,
                so.order_number,
                so.order_date,
                so.customer_id,
                so.branch_id,
                so.total_amount,
                so.discount_amount,
                so.final_amount,
                so.status,
                so.payment_method,
                c.name as customer_name,
                c.email as customer_email,
                m.membership_type,
                e.name as employee_name,
                b.branch_name
            FROM Sales_Order so
            JOIN Customer c ON so.customer_id = c.customer_id
            LEFT JOIN Membership m ON c.membership_id = m.membership_id
            JOIN Employee e ON so.employee_id = e.employee_id
            JOIN Branch b ON so.branch_id = b.branch_id
            WHERE 1=1
        ";
        
        $params = [];
        
        if ($branchId) {
            $sql .= " AND so.branch_id = ?";
            $params[] = $branchId;
        }
        
        if ($status) {
            $sql .= " AND so.status = ?";
            $params[] = $status;
        }
        
        $sql .= " ORDER BY so.order_date DESC LIMIT " . intval($limit);
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        $orders = $stmt->fetchAll();
        
        // Include order items for analytics
        if ($includeItems === 'true') {
            $itemsStmt = $pdo->prepare("
                SELECT 
                    soi.order_id,
                    soi.product_id,
                    soi.quantity,
                    soi.unit_price,
                    soi.total_price as subtotal,
                    p.name,
                    p.brand,
                    p.category,
                    p.cost_price,
                    (soi.total_price - (p.cost_price * soi.quantity)) as profit
                FROM Sales_Order_Item soi
                JOIN Product p ON soi.product_id = p.product_id
                WHERE soi.order_id = ?
            ");
            
            foreach ($orders as &$order) {
                $itemsStmt->execute([$order['order_id']]);
                $order['items'] = $itemsStmt->fetchAll();
            }
        }
        
        sendResponse(['success' => true, 'data' => $orders, 'count' => count($orders)]);
        
    } catch (PDOException $e) {
        error_log("Admin orders error: " . $e->getMessage());
        sendError('Failed to fetch orders', 500);
    }
}

function getAllProducts($pdo) {
    try {
        $branchId = $_GET['branch_id'] ?? null;
        
        // If branch_id is provided, filter stock by that branch only
        if ($branchId) {
            $stmt = $pdo->prepare("
                SELECT 
                    p.product_id,
                    p.sku,
                    p.name,
                    p.brand,
                    p.category,
                    p.retail_price,
                    p.cost_price,
                    p.status,
                    s.name as supplier_name,
                    p.supplier_id,
                    COALESCE(stock.total_qty, 0) as stock_quantity
                FROM Product p
                LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
                LEFT JOIN (
                    SELECT product_id, SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END) AS total_qty
                    FROM StockItem
                    WHERE branch_id = ?
                    GROUP BY product_id
                ) stock ON p.product_id = stock.product_id
                ORDER BY p.product_id
            ");
            $stmt->execute([$branchId]);
        } else {
            // No branch filter - return total across all branches
        $stmt = $pdo->query("
            SELECT 
                p.product_id,
                p.sku,
                p.name,
                p.brand,
                p.category,
                p.retail_price,
                p.cost_price,
                p.status,
                s.name as supplier_name,
                    p.supplier_id,
                COALESCE(stock.total_qty, 0) as stock_quantity
            FROM Product p
            LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
            LEFT JOIN (
                SELECT product_id, SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END) AS total_qty
                FROM StockItem
                GROUP BY product_id
            ) stock ON p.product_id = stock.product_id
            ORDER BY p.product_id
        ");
        }
        $products = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $products, 'count' => count($products)]);
        
    } catch (PDOException $e) {
        error_log("Admin products error: " . $e->getMessage());
        sendError('Failed to fetch products', 500);
    }
}

function getAllEmployees($pdo) {
    try {
        $branchId = $_GET['branch_id'] ?? null;
        
        $sql = "
            SELECT 
                e.employee_id,
                e.name,
                e.email,
                e.phone,
                e.position,
                e.hire_date,
                e.salary,
                e.is_active,
                e.branch_id,
                b.branch_name
            FROM Employee e
            JOIN Branch b ON e.branch_id = b.branch_id
        ";
        
        $params = [];
        if ($branchId) {
            $sql .= " WHERE e.branch_id = ?";
            $params[] = $branchId;
        }
        
        $sql .= " ORDER BY e.branch_id, e.position, e.name";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $employees = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $employees, 'count' => count($employees)]);
        
    } catch (PDOException $e) {
        error_log("Admin employees error: " . $e->getMessage());
        sendError('Failed to fetch employees', 500);
    }
}

function getLowStock($pdo) {
    try {
        $branchId = $_GET['branch_id'] ?? null;
        
        if ($branchId) {
            $stmt = $pdo->prepare("
                SELECT 
                    p.product_id,
                    p.sku,
                    p.name,
                    p.brand,
                    p.category,
                    p.supplier_id,
                    COALESCE(SUM(CASE WHEN si.status = 'In Stock' THEN si.quantity ELSE 0 END), 0) as stock_quantity,
                    s.name as supplier_name
                FROM Product p
                LEFT JOIN StockItem si ON p.product_id = si.product_id AND si.branch_id = ?
                LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
                WHERE p.status = 'Active'
                GROUP BY p.product_id, p.sku, p.name, p.brand, p.category, p.supplier_id, s.name
                HAVING stock_quantity <= 10
                ORDER BY stock_quantity ASC
            ");
            $stmt->execute([$branchId]);
        } else {
        $stmt = $pdo->query("
            SELECT 
                p.product_id,
                p.sku,
                p.name,
                p.brand,
                p.category,
                    p.supplier_id,
                COALESCE(SUM(CASE WHEN si.status = 'In Stock' THEN si.quantity ELSE 0 END), 0) as stock_quantity,
                s.name as supplier_name
            FROM Product p
            LEFT JOIN StockItem si ON p.product_id = si.product_id
            LEFT JOIN Supplier s ON p.supplier_id = s.supplier_id
            WHERE p.status = 'Active'
                GROUP BY p.product_id, p.sku, p.name, p.brand, p.category, p.supplier_id, s.name
            HAVING stock_quantity <= 10
            ORDER BY stock_quantity ASC
        ");
        }
        $lowStockItems = $stmt->fetchAll();
        
        sendResponse(['success' => true, 'data' => $lowStockItems, 'count' => count($lowStockItems)]);
        
    } catch (PDOException $e) {
        error_log("Admin low stock error: " . $e->getMessage());
        sendError('Failed to fetch low stock items', 500);
    }
}
?>

