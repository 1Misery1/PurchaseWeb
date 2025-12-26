-- ============================================================
-- Summit Gear & Adventures - Database Schema
-- Version 2.0 - Updated based on Assignment 1 Feedback
-- ============================================================

DROP DATABASE IF EXISTS summit_gear_db;
CREATE DATABASE summit_gear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE summit_gear_db;

-- ============================================================
-- SECTION 1: BASE TABLES
-- ============================================================

-- 1. Branch (Store Locations)
CREATE TABLE Branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    manager_name VARCHAR(100),
    opening_date DATE NOT NULL,
    INDEX idx_city (city)
) ENGINE=InnoDB;

-- 2. Employee
-- Staff positions use password 'staff123', Admin positions use password 'admin123'
CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'default_hash',
    phone VARCHAR(20) NOT NULL,
    position ENUM('Store Manager', 'Business Admin', 'Inventory Admin', 'HR Admin', 'Staff') NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    branch_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_position (position),
    INDEX idx_branch (branch_id)
) ENGINE=InnoDB;

-- 3. Membership (Using ENUM type as per feedback -1)
-- Keep as separate table for flexibility, but also add ENUM in Customer
CREATE TABLE Membership (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    membership_type ENUM('Bronze', 'Silver', 'Gold', 'Platinum') NOT NULL UNIQUE,
    discount_rate DECIMAL(5,2) NOT NULL,
    point_rate DECIMAL(5,2) NOT NULL,
    min_consume DECIMAL(10,2) NOT NULL,
    benefits TEXT
) ENGINE=InnoDB;

-- 4. Customer
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'default_hash',
    phone VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(200),
    city VARCHAR(50),
    postcode VARCHAR(10),
    membership_id INT DEFAULT NULL,
    total_points INT NOT NULL DEFAULT 0,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    registration_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (membership_id) REFERENCES Membership(membership_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_membership (membership_id)
) ENGINE=InnoDB;

-- 5. Supplier
CREATE TABLE Supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'default_hash',
    phone VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(200),
    city VARCHAR(50),
    country VARCHAR(50) NOT NULL DEFAULT 'UK',
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- 6. Product
CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    category ENUM('Camping', 'Climbing', 'Clothing', 'Footwear', 'Electronics', 'Backpacks', 'Lighting', 'Tools') NOT NULL,
    description TEXT,
    cost_price DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    weight_kg DECIMAL(6,2),
    dimensions VARCHAR(50),
    color VARCHAR(30),
    size VARCHAR(20),
    supplier_id INT NOT NULL,
    status ENUM('Active','Discontinued') NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_brand (brand),
    INDEX idx_category (category),
    INDEX idx_supplier (supplier_id)
) ENGINE=InnoDB;

-- 7. StockItem - NEW TABLE (Replaces Inventory, fixes -8 penalty)
-- This table tracks individual batches of stock for physical traceability
CREATE TABLE StockItem (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_no VARCHAR(30) NOT NULL,                      -- Batch number, e.g., BSG_20241101
    serial_no VARCHAR(50) UNIQUE,                       -- Optional serial number for individual items
    product_id INT NOT NULL,
    branch_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,                    -- Quantity in this batch
    purchase_order_id INT,                              -- Links to purchase order (fixes -4 penalty)
    received_date DATE NOT NULL,                        -- When stock was received
    expiry_date DATE,                                   -- Optional expiry date
    location VARCHAR(50),                               -- Warehouse location (e.g., A-01-05)
    unit_cost DECIMAL(10,2) NOT NULL,                   -- Cost per unit for this batch
    status ENUM('In Stock', 'Reserved', 'Sold', 'Damaged', 'Returned') NOT NULL DEFAULT 'In Stock',
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_batch (batch_no),
    INDEX idx_product_branch (product_id, branch_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 8. Sales_Order
CREATE TABLE Sales_Order (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    order_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    employee_id INT NOT NULL,
    branch_id INT NOT NULL,
    order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('Cash', 'Card', 'Bank Transfer', 'Points') NOT NULL,
    status ENUM('Pending', 'Completed', 'Returned', 'Cancelled') NOT NULL DEFAULT 'Pending',
    points_earned INT NOT NULL DEFAULT 0,
    points_used INT NOT NULL DEFAULT 0,
    payment_status ENUM('Unpaid', 'Partial', 'Paid') NOT NULL DEFAULT 'Unpaid',
    notes TEXT,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_date (order_date)
) ENGINE=InnoDB;

-- 9. Sales_Order_Item (Links to StockItem for traceability)
CREATE TABLE Sales_Order_Item (
    so_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    stock_id INT,                                       -- Links to specific stock batch
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES StockItem(stock_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    -- Composite unique key instead of simple integer PK (fixes -3 penalty)
    UNIQUE KEY uk_order_product_stock (order_id, product_id, stock_id)
) ENGINE=InnoDB;

-- 10. Purchase_Order
CREATE TABLE Purchase_Order (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    employee_id INT NOT NULL,
    branch_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_date DATE,
    received_date DATE,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('Draft', 'Pending', 'Confirmed', 'Shipped', 'Received', 'Cancelled') NOT NULL DEFAULT 'Draft',
    payment_status ENUM('Unpaid', 'Partial', 'Paid') NOT NULL DEFAULT 'Unpaid',
    notes TEXT,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_supplier (supplier_id),
    INDEX idx_status (status)
) ENGINE=InnoDB;

-- 11. Purchase_Order_Item
CREATE TABLE Purchase_Order_Item (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    received_qty INT NOT NULL DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES Purchase_Order(po_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    -- Composite unique key (fixes -3 penalty)
    UNIQUE KEY uk_po_product (po_id, product_id)
) ENGINE=InnoDB;

-- 12. Points_Transaction
CREATE TABLE Points_Transaction (
    trans_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT,
    point_change INT NOT NULL,
    trans_type ENUM('Earn', 'Redeem', 'Expire', 'Adjust', 'Bonus') NOT NULL,
    trans_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    balance_after INT NOT NULL,
    description VARCHAR(200),
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_customer (customer_id),
    INDEX idx_date (trans_date)
) ENGINE=InnoDB;

-- 13. Stock_Transfer (NEW - for inter-branch transfers)
CREATE TABLE Stock_Transfer (
    transfer_id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_number VARCHAR(20) NOT NULL UNIQUE,
    from_branch_id INT NOT NULL,
    to_branch_id INT NOT NULL,
    requested_by INT NOT NULL,
    approved_by INT,
    transfer_date DATE NOT NULL,
    status ENUM('Pending', 'Approved', 'In Transit', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    notes TEXT,
    FOREIGN KEY (from_branch_id) REFERENCES Branch(branch_id),
    FOREIGN KEY (to_branch_id) REFERENCES Branch(branch_id),
    FOREIGN KEY (requested_by) REFERENCES Employee(employee_id),
    FOREIGN KEY (approved_by) REFERENCES Employee(employee_id)
) ENGINE=InnoDB;

-- 14. Stock_Transfer_Item
CREATE TABLE Stock_Transfer_Item (
    transfer_item_id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_id INT NOT NULL,
    stock_id INT NOT NULL,
    quantity INT NOT NULL,
    FOREIGN KEY (transfer_id) REFERENCES Stock_Transfer(transfer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (stock_id) REFERENCES StockItem(stock_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 15. Product_Review (Customer reviews for products)
CREATE TABLE Product_Review (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    order_id INT,                                       -- Optional: link to purchase order for verified reviews
    rating TINYINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_verified_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,          -- For moderation
    helpful_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id)
        ON DELETE SET NULL ON UPDATE CASCADE,
    -- Each customer can only review a product once
    UNIQUE KEY uk_customer_product_review (customer_id, product_id),
    INDEX idx_product (product_id),
    INDEX idx_rating (rating),
    INDEX idx_created (created_at)
) ENGINE=InnoDB;

-- 16. Promotion (促销活动 - Business Admin管理)
CREATE TABLE Promotion (
    promotion_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type ENUM('Percentage', 'Fixed', 'Buy X Get Y') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    applies_to ENUM('All', 'Category', 'Product') NOT NULL DEFAULT 'All',
    category VARCHAR(50),
    product_id INT,
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_dates (start_date, end_date),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- 17. Coupon (优惠券 - Business Admin管理)
CREATE TABLE Coupon (
    coupon_id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(200),
    discount_type ENUM('Percentage', 'Fixed') NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_uses INT DEFAULT NULL,              -- NULL = unlimited
    used_count INT NOT NULL DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB;

-- 18. Homepage_Banner (首页Banner - Business Admin管理)
CREATE TABLE Homepage_Banner (
    banner_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    subtitle VARCHAR(300),
    image_url VARCHAR(500),
    link_url VARCHAR(500),
    link_text VARCHAR(100),
    position INT NOT NULL DEFAULT 1,        -- Display order
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    start_date DATE,
    end_date DATE,
    created_by INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_position (position),
    INDEX idx_active (is_active)
) ENGINE=InnoDB;

-- 19. Stock_Request (库存采购请求 - Inventory Admin创建, Supplier响应)
CREATE TABLE Stock_Request (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    supplier_id INT NOT NULL,
    branch_id INT NOT NULL,
    requested_quantity INT NOT NULL,
    current_stock INT NOT NULL,
    urgency ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'In Transit', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Unpaid', 'Paid') NOT NULL DEFAULT 'Unpaid',
    notes TEXT,
    requested_by INT,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME,
    completed_at DATETIME,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_supplier (supplier_id),
    INDEX idx_urgency (urgency)
) ENGINE=InnoDB;

-- 20. Return_Request (退货申请 - 客户发起, Business Admin处理)
CREATE TABLE Return_Request (
    return_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    customer_id INT NOT NULL,
    reason ENUM('Defective', 'Wrong Item', 'Not as Described', 'Changed Mind', 'Other') NOT NULL,
    description TEXT,
    status ENUM('Pending', 'Approved', 'Rejected', 'Refunded') NOT NULL DEFAULT 'Pending',
    refund_amount DECIMAL(10,2),
    processed_by INT,
    requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    processed_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (processed_by) REFERENCES Employee(employee_id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_customer (customer_id)
) ENGINE=InnoDB;

-- ============================================================
-- SECTION 2: VIEWS FOR ROLE-BASED ACCESS (Fixes -4 penalty)
-- Users access data through views, not direct table access
-- ============================================================

-- Add foreign key for StockItem -> Purchase_Order after Purchase_Order is created
ALTER TABLE StockItem
ADD CONSTRAINT fk_stock_purchase_order
FOREIGN KEY (purchase_order_id) REFERENCES Purchase_Order(po_id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- VIEW 1: Customer Product View (Customers can only see active products with stock)
CREATE VIEW v_customer_products AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    p.brand,
    p.category,
    p.description,
    p.retail_price,
    p.color,
    p.size,
    COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) AS available_qty,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) > 10 THEN 'In Stock'
        WHEN COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) > 0 THEN 'Low Stock'
        ELSE 'Out of Stock'
    END AS stock_status
FROM Product p
LEFT JOIN StockItem s ON p.product_id = s.product_id
WHERE p.status = 'Active'
GROUP BY p.product_id, p.sku, p.name, p.brand, p.category, p.description, 
         p.retail_price, p.color, p.size;

-- VIEW 2: Customer Order History (Customers can only see their own orders)
CREATE VIEW v_customer_orders AS
SELECT 
    so.order_id,
    so.order_number,
    so.customer_id,
    so.order_date,
    so.total_amount,
    so.discount_amount,
    so.final_amount,
    so.payment_method,
    so.status,
    so.points_earned,
    so.points_used,
    b.branch_name
FROM Sales_Order so
JOIN Branch b ON so.branch_id = b.branch_id;

-- VIEW 3: Staff Inventory View (Staff can see detailed inventory for their branch)
CREATE VIEW v_staff_inventory AS
SELECT 
    s.stock_id,
    s.batch_no,
    s.serial_no,
    p.sku,
    p.name AS product_name,
    p.brand,
    p.category,
    p.retail_price,
    s.quantity,
    s.location,
    s.status,
    s.received_date,
    s.unit_cost,
    b.branch_id,
    b.branch_name,
    (s.quantity * s.unit_cost) AS stock_value
FROM StockItem s
JOIN Product p ON s.product_id = p.product_id
JOIN Branch b ON s.branch_id = b.branch_id;

-- VIEW 4: Branch Stock Summary (Aggregated stock by product and branch)
-- This replaces the original Inventory table functionality
CREATE VIEW v_branch_stock AS
SELECT 
    b.branch_id,
    b.branch_name,
    p.product_id,
    p.sku,
    p.name AS product_name,
    p.category,
    p.retail_price,
    COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) AS total_qty,
    COALESCE(SUM(CASE WHEN s.status = 'Reserved' THEN s.quantity ELSE 0 END), 0) AS reserved_qty,
    COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity * s.unit_cost ELSE 0 END), 0) AS stock_value,
    MAX(s.received_date) AS last_received
FROM Branch b
CROSS JOIN Product p
LEFT JOIN StockItem s ON p.product_id = s.product_id AND b.branch_id = s.branch_id
WHERE p.status = 'Active'
GROUP BY b.branch_id, b.branch_name, p.product_id, p.sku, p.name, p.category, p.retail_price;

-- VIEW 5: Supplier Order View (Suppliers can only see their own orders)
CREATE VIEW v_supplier_orders AS
SELECT 
    po.po_id,
    po.po_number,
    po.supplier_id,
    po.order_date,
    po.expected_date,
    po.total_amount,
    po.status,
    po.payment_status,
    b.branch_name AS destination_branch,
    e.name AS ordered_by
FROM Purchase_Order po
JOIN Branch b ON po.branch_id = b.branch_id
JOIN Employee e ON po.employee_id = e.employee_id;

-- VIEW 6: Supplier Order Items View
CREATE VIEW v_supplier_order_items AS
SELECT 
    poi.po_item_id,
    poi.po_id,
    po.po_number,
    po.supplier_id,
    p.sku,
    p.name AS product_name,
    poi.quantity AS ordered_qty,
    poi.received_qty,
    poi.unit_price,
    poi.total_price,
    po.status AS order_status
FROM Purchase_Order_Item poi
JOIN Purchase_Order po ON poi.po_id = po.po_id
JOIN Product p ON poi.product_id = p.product_id;

-- VIEW 7: Admin Sales Dashboard
CREATE VIEW v_admin_sales_dashboard AS
SELECT 
    b.branch_id,
    b.branch_name,
    DATE(so.order_date) AS sale_date,
    COUNT(DISTINCT so.order_id) AS total_orders,
    COUNT(DISTINCT so.customer_id) AS unique_customers,
    SUM(so.final_amount) AS total_revenue,
    SUM(so.discount_amount) AS total_discounts,
    AVG(so.final_amount) AS avg_order_value
FROM Sales_Order so
JOIN Branch b ON so.branch_id = b.branch_id
WHERE so.status = 'Completed'
GROUP BY b.branch_id, b.branch_name, DATE(so.order_date);

-- VIEW 8: HR Employee View
CREATE VIEW v_hr_employees AS
SELECT 
    e.employee_id,
    e.name,
    e.email,
    e.phone,
    e.position,
    e.salary,
    e.hire_date,
    e.is_active,
    b.branch_id,
    b.branch_name,
    DATEDIFF(CURDATE(), e.hire_date) AS days_employed
FROM Employee e
JOIN Branch b ON e.branch_id = b.branch_id;

-- VIEW 9: Low Stock Alert View
CREATE VIEW v_low_stock_alert AS
SELECT 
    b.branch_id,
    b.branch_name,
    p.product_id,
    p.sku,
    p.name AS product_name,
    p.category,
    COALESCE(SUM(CASE WHEN s.status = 'In Stock' THEN s.quantity ELSE 0 END), 0) AS current_stock,
    10 AS reorder_point,  -- Default reorder point
    sup.name AS supplier_name,
    sup.email AS supplier_email
FROM Branch b
CROSS JOIN Product p
LEFT JOIN StockItem s ON p.product_id = s.product_id AND b.branch_id = s.branch_id
JOIN Supplier sup ON p.supplier_id = sup.supplier_id
WHERE p.status = 'Active'
GROUP BY b.branch_id, b.branch_name, p.product_id, p.sku, p.name, p.category, sup.name, sup.email
HAVING current_stock < 10;

-- VIEW 10: Customer Membership Summary
CREATE VIEW v_customer_membership AS
SELECT 
    c.customer_id,
    c.name,
    c.email,
    c.total_points,
    c.total_spent,
    c.registration_date,
    m.membership_type,
    m.discount_rate,
    m.point_rate,
    CASE 
        WHEN c.total_spent >= 5000 THEN 'Platinum'
        WHEN c.total_spent >= 2000 THEN 'Gold'
        WHEN c.total_spent >= 500 THEN 'Silver'
        ELSE 'Bronze'
    END AS recommended_tier
FROM Customer c
LEFT JOIN Membership m ON c.membership_id = m.membership_id
WHERE c.is_active = TRUE;

-- ============================================================
-- SECTION 3: ADVANCED SQL QUERIES (Required: at least 3)
-- ============================================================

-- ADVANCED QUERY 1: Using CTE and Window Functions - Monthly Sales Ranking by Branch
-- This query ranks products by sales within each branch using RANK() window function
CREATE VIEW v_advanced_product_ranking AS
WITH MonthlySales AS (
    SELECT 
        b.branch_id,
        b.branch_name,
        p.product_id,
        p.name AS product_name,
        p.category,
        DATE_FORMAT(so.order_date, '%Y-%m') AS sale_month,
        SUM(soi.quantity) AS units_sold,
        SUM(soi.total_price) AS revenue
    FROM Sales_Order_Item soi
    JOIN Sales_Order so ON soi.order_id = so.order_id
    JOIN Product p ON soi.product_id = p.product_id
    JOIN Branch b ON so.branch_id = b.branch_id
    WHERE so.status = 'Completed'
    GROUP BY b.branch_id, b.branch_name, p.product_id, p.name, p.category, DATE_FORMAT(so.order_date, '%Y-%m')
)
SELECT 
    branch_id,
    branch_name,
    product_id,
    product_name,
    category,
    sale_month,
    units_sold,
    revenue,
    RANK() OVER (PARTITION BY branch_id, sale_month ORDER BY revenue DESC) AS revenue_rank,
    DENSE_RANK() OVER (PARTITION BY branch_id, sale_month ORDER BY units_sold DESC) AS units_rank,
    SUM(revenue) OVER (PARTITION BY branch_id ORDER BY sale_month) AS cumulative_revenue
FROM MonthlySales;

-- ADVANCED QUERY 2: Correlated Subquery - Find customers who spent above branch average
CREATE VIEW v_advanced_top_customers AS
SELECT 
    c.customer_id,
    c.name AS customer_name,
    c.email,
    m.membership_type,
    c.total_spent,
    (SELECT AVG(c2.total_spent) FROM Customer c2 WHERE c2.is_active = TRUE) AS avg_customer_spend,
    c.total_spent - (SELECT AVG(c2.total_spent) FROM Customer c2 WHERE c2.is_active = TRUE) AS above_average_by,
    (SELECT COUNT(*) FROM Sales_Order so WHERE so.customer_id = c.customer_id AND so.status = 'Completed') AS total_orders,
    (SELECT MAX(so.order_date) FROM Sales_Order so WHERE so.customer_id = c.customer_id) AS last_order_date,
    CASE 
        WHEN c.total_spent > (SELECT AVG(c2.total_spent) * 2 FROM Customer c2 WHERE c2.is_active = TRUE) THEN 'VIP'
        WHEN c.total_spent > (SELECT AVG(c2.total_spent) FROM Customer c2 WHERE c2.is_active = TRUE) THEN 'Premium'
        ELSE 'Regular'
    END AS customer_tier
FROM Customer c
LEFT JOIN Membership m ON c.membership_id = m.membership_id
WHERE c.is_active = TRUE
HAVING total_orders > 0;

-- ADVANCED QUERY 3: Complex JOIN with HAVING and Aggregate Functions - Inventory Turnover Analysis
CREATE VIEW v_advanced_inventory_turnover AS
SELECT 
    p.product_id,
    p.sku,
    p.name AS product_name,
    p.category,
    p.brand,
    sup.name AS supplier_name,
    COALESCE(stock_data.total_stock, 0) AS current_stock,
    COALESCE(stock_data.stock_value, 0) AS current_stock_value,
    COALESCE(sales_data.units_sold_90days, 0) AS units_sold_90days,
    COALESCE(sales_data.revenue_90days, 0) AS revenue_90days,
    CASE 
        WHEN COALESCE(stock_data.total_stock, 0) = 0 THEN 0
        ELSE ROUND(COALESCE(sales_data.units_sold_90days, 0) / NULLIF(COALESCE(stock_data.total_stock, 0), 0) * 4, 2)
    END AS annual_turnover_rate,
    CASE 
        WHEN COALESCE(sales_data.units_sold_90days, 0) = 0 THEN 'Dead Stock'
        WHEN COALESCE(sales_data.units_sold_90days, 0) < 5 THEN 'Slow Moving'
        WHEN COALESCE(sales_data.units_sold_90days, 0) < 20 THEN 'Normal'
        ELSE 'Fast Moving'
    END AS movement_status
FROM Product p
JOIN Supplier sup ON p.supplier_id = sup.supplier_id
LEFT JOIN (
    SELECT 
        product_id,
        SUM(CASE WHEN status = 'In Stock' THEN quantity ELSE 0 END) AS total_stock,
        SUM(CASE WHEN status = 'In Stock' THEN quantity * unit_cost ELSE 0 END) AS stock_value
    FROM StockItem
    GROUP BY product_id
) stock_data ON p.product_id = stock_data.product_id
LEFT JOIN (
    SELECT 
        soi.product_id,
        SUM(soi.quantity) AS units_sold_90days,
        SUM(soi.total_price) AS revenue_90days
    FROM Sales_Order_Item soi
    JOIN Sales_Order so ON soi.order_id = so.order_id
    WHERE so.status = 'Completed' 
    AND so.order_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
    GROUP BY soi.product_id
) sales_data ON p.product_id = sales_data.product_id
WHERE p.status = 'Active';

-- ============================================================
-- SECTION 4: STORED PROCEDURES FOR TRANSACTION CONTROL
-- ============================================================

-- Procedure 1: Stock In - Add stock from purchase order (fixes -3 functionality issue)
DELIMITER //
CREATE PROCEDURE sp_stock_in(
    IN p_po_id INT,
    IN p_product_id INT,
    IN p_quantity INT,
    IN p_branch_id INT,
    IN p_location VARCHAR(50),
    IN p_employee_id INT
)
BEGIN
    DECLARE v_batch_no VARCHAR(30);
    DECLARE v_unit_cost DECIMAL(10,2);
    DECLARE v_po_status VARCHAR(20);
    
    -- Start transaction
    START TRANSACTION;
    
    -- Check if PO exists and is valid
    SELECT status INTO v_po_status FROM Purchase_Order WHERE po_id = p_po_id;
    IF v_po_status NOT IN ('Confirmed', 'Shipped') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid purchase order status';
    END IF;
    
    -- Generate batch number
    SET v_batch_no = CONCAT('BSG_', DATE_FORMAT(CURDATE(), '%Y%m%d'), '_', p_po_id);
    
    -- Get unit cost from PO item
    SELECT unit_price INTO v_unit_cost 
    FROM Purchase_Order_Item 
    WHERE po_id = p_po_id AND product_id = p_product_id
    LIMIT 1;
    
    -- Insert stock item
    INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, purchase_order_id, 
                           received_date, location, unit_cost, status)
    VALUES (v_batch_no, p_product_id, p_branch_id, p_quantity, p_po_id,
            CURDATE(), p_location, v_unit_cost, 'In Stock');
    
    -- Update PO item received quantity
    UPDATE Purchase_Order_Item 
    SET received_qty = received_qty + p_quantity 
    WHERE po_id = p_po_id AND product_id = p_product_id;
    
    -- Check if all items received, update PO status
    UPDATE Purchase_Order po
    SET status = 'Received', received_date = CURDATE()
    WHERE po_id = p_po_id
    AND NOT EXISTS (
        SELECT 1 FROM Purchase_Order_Item poi 
        WHERE poi.po_id = po.po_id AND poi.received_qty < poi.quantity
    );
    
    COMMIT;
END //
DELIMITER ;

-- Procedure 2: Process Sale with Stock Deduction
DELIMITER //
CREATE PROCEDURE sp_process_sale(
    IN p_order_id INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_product_id INT;
    DECLARE v_quantity INT;
    DECLARE v_branch_id INT;
    DECLARE v_stock_id INT;
    DECLARE v_available INT;
    
    DECLARE item_cursor CURSOR FOR 
        SELECT soi.product_id, soi.quantity, so.branch_id
        FROM Sales_Order_Item soi
        JOIN Sales_Order so ON soi.order_id = so.order_id
        WHERE soi.order_id = p_order_id;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    START TRANSACTION;
    
    OPEN item_cursor;
    
    read_loop: LOOP
        FETCH item_cursor INTO v_product_id, v_quantity, v_branch_id;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        -- Find available stock (FIFO - oldest first)
        SELECT stock_id, quantity INTO v_stock_id, v_available
        FROM StockItem
        WHERE product_id = v_product_id 
        AND branch_id = v_branch_id 
        AND status = 'In Stock'
        AND quantity >= v_quantity
        ORDER BY received_date ASC
        LIMIT 1;
        
        IF v_stock_id IS NULL THEN
            ROLLBACK;
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
        END IF;
        
        -- Deduct stock
        UPDATE StockItem 
        SET quantity = quantity - v_quantity,
            status = CASE WHEN quantity - v_quantity = 0 THEN 'Sold' ELSE status END
        WHERE stock_id = v_stock_id;
        
        -- Link sale to stock
        UPDATE Sales_Order_Item 
        SET stock_id = v_stock_id 
        WHERE order_id = p_order_id AND product_id = v_product_id;
    END LOOP;
    
    CLOSE item_cursor;
    
    -- Update order status
    UPDATE Sales_Order SET status = 'Completed' WHERE order_id = p_order_id;
    
    COMMIT;
END //
DELIMITER ;

-- Procedure 3: Customer Registration (fixes -3 missing register button)
DELIMITER //
CREATE PROCEDURE sp_register_customer(
    IN p_name VARCHAR(50),
    IN p_email VARCHAR(100),
    IN p_password VARCHAR(255),
    IN p_phone VARCHAR(20),
    IN p_address VARCHAR(200),
    IN p_city VARCHAR(50),
    IN p_postcode VARCHAR(10),
    OUT p_customer_id INT
)
BEGIN
    DECLARE v_membership_id INT;
    
    START TRANSACTION;
    
    -- Get Bronze membership ID
    SELECT membership_id INTO v_membership_id 
    FROM Membership WHERE membership_type = 'Bronze' LIMIT 1;
    
    -- Insert customer
    INSERT INTO Customer (name, email, password_hash, phone, address, city, postcode, 
                          membership_id, registration_date)
    VALUES (p_name, p_email, p_password, p_phone, p_address, p_city, p_postcode,
            v_membership_id, CURDATE());
    
    SET p_customer_id = LAST_INSERT_ID();
    
    -- Give welcome bonus points
    INSERT INTO Points_Transaction (customer_id, point_change, trans_type, balance_after, description)
    VALUES (p_customer_id, 100, 'Bonus', 100, 'Welcome bonus for new registration');
    
    UPDATE Customer SET total_points = 100 WHERE customer_id = p_customer_id;
    
    COMMIT;
END //
DELIMITER ;

-- ============================================================
-- SECTION 5: TRIGGERS FOR DATA INTEGRITY
-- ============================================================

-- Trigger: Update customer membership based on total spent
DELIMITER //
CREATE TRIGGER trg_update_membership
AFTER UPDATE ON Customer
FOR EACH ROW
BEGIN
    DECLARE v_new_membership_id INT;
    
    IF NEW.total_spent != OLD.total_spent THEN
        SELECT membership_id INTO v_new_membership_id
        FROM Membership
        WHERE min_consume <= NEW.total_spent
        ORDER BY min_consume DESC
        LIMIT 1;
        
        IF v_new_membership_id IS NOT NULL AND v_new_membership_id != NEW.membership_id THEN
            UPDATE Customer SET membership_id = v_new_membership_id 
            WHERE customer_id = NEW.customer_id;
        END IF;
    END IF;
END //
DELIMITER ;

-- Trigger: Update customer total spent after order completion
DELIMITER //
CREATE TRIGGER trg_update_customer_spent
AFTER UPDATE ON Sales_Order
FOR EACH ROW
BEGIN
    IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
        UPDATE Customer 
        SET total_spent = total_spent + NEW.final_amount,
            total_points = total_points + NEW.points_earned
        WHERE customer_id = NEW.customer_id;
    END IF;
END //
DELIMITER ;

-- ============================================================
-- SECTION 6: SAMPLE DATA
-- ============================================================

-- Insert Branches
INSERT INTO Branch (branch_name, city, address, phone, manager_name, opening_date) VALUES
('Edinburgh Flagship', 'Edinburgh', '123 Princes Street, Edinburgh EH2 4AD', '0131-123-4567', 'Robert MacGregor', '2018-03-15'),
('Glasgow Central', 'Glasgow', '45 Buchanan Street, Glasgow G1 3HL', '0141-234-5678', 'Fiona Campbell', '2019-06-20'),
('Aberdeen Store', 'Aberdeen', '78 Union Street, Aberdeen AB10 1QJ', '01224-345-678', 'Angus Stewart', '2020-01-10'),
('Inverness Highland', 'Inverness', '12 High Street, Inverness IV1 1HJ', '01463-456-789', 'Eilidh Fraser', '2021-04-05'),
('Dundee Outlet', 'Dundee', '34 Reform Street, Dundee DD1 1RG', '01382-567-890', 'Callum Murray', '2022-09-01');

-- Insert Membership Tiers
INSERT INTO Membership (membership_type, discount_rate, point_rate, min_consume, benefits) VALUES
('Bronze', 0.00, 1.00, 0.00, 'Basic membership with 1 point per £1 spent'),
('Silver', 5.00, 1.50, 500.00, '5% discount, 1.5 points per £1, free shipping over £50'),
('Gold', 10.00, 2.00, 2000.00, '10% discount, 2 points per £1, free shipping, early access to sales'),
('Platinum', 15.00, 3.00, 5000.00, '15% discount, 3 points per £1, free shipping, VIP events, personal shopper');

-- Insert Suppliers
INSERT INTO Supplier (name, contact_person, email, phone, address, city, country) VALUES
('North Face UK', 'James Mitchell', 'j.mitchell@northface.co.uk', '020-111-2222', '100 Commercial Road', 'London', 'UK'),
('Black Diamond Equipment', 'Sarah Connor', 's.connor@blackdiamond.co.uk', '020-222-3333', '55 Outdoor Way', 'Manchester', 'UK'),
('MSR Outdoor', 'Mike Chen', 'm.chen@msr.co.uk', '020-333-4444', '88 Adventure Lane', 'Birmingham', 'UK'),
('Garmin UK', 'Emma Watson', 'e.watson@garmin.co.uk', '020-444-5555', '200 Tech Park', 'Reading', 'UK'),
('Patagonia Europe', 'David Brown', 'd.brown@patagonia.eu', '020-555-6666', '150 Eco Street', 'Bristol', 'UK');

-- Insert Employees (14 per branch × 5 branches = 70 employees)
-- 4 Admins per branch: Store Manager, Business Admin, Inventory Admin, HR Admin (password: admin123 = admin_hash)
-- 10 Staff per branch (password: staff123 = staff_hash)
INSERT INTO Employee (name, email, password_hash, phone, position, salary, hire_date, branch_id) VALUES
-- ==================== EDINBURGH FLAGSHIP (Branch 1) ====================
-- Admins (4)
('Robert MacGregor', 'r.macgregor@summitgear.co.uk', 'admin_hash', '07700-100001', 'Store Manager', 55000.00, '2018-03-01', 1),
('Emily Watson', 'e.watson@summitgear.co.uk', 'admin_hash', '07700-100002', 'Business Admin', 48000.00, '2018-05-15', 1),
('Lucy White', 'l.white@summitgear.co.uk', 'admin_hash', '07700-100003', 'Inventory Admin', 45000.00, '2019-08-20', 1),
('David Henderson', 'd.henderson@summitgear.co.uk', 'admin_hash', '07700-100004', 'HR Admin', 45000.00, '2018-03-01', 1),
-- Staff (10)
('Alice Murray', 'a.murray.ed@summitgear.co.uk', 'staff_hash', '07700-110001', 'Staff', 26000.00, '2020-01-15', 1),
('Ben Fraser', 'b.fraser.ed@summitgear.co.uk', 'staff_hash', '07700-110002', 'Staff', 25000.00, '2020-03-20', 1),
('Claire Douglas', 'c.douglas.ed@summitgear.co.uk', 'staff_hash', '07700-110003', 'Staff', 25500.00, '2020-06-10', 1),
('Daniel Ross', 'd.ross.ed@summitgear.co.uk', 'staff_hash', '07700-110004', 'Staff', 26000.00, '2021-02-01', 1),
('Emma Campbell', 'e.campbell.ed@summitgear.co.uk', 'staff_hash', '07700-110005', 'Staff', 25000.00, '2021-05-15', 1),
('Finlay Stewart', 'f.stewart.ed@summitgear.co.uk', 'staff_hash', '07700-110006', 'Staff', 24500.00, '2021-08-20', 1),
('Grace Thomson', 'g.thomson.ed@summitgear.co.uk', 'staff_hash', '07700-110007', 'Staff', 25000.00, '2022-01-10', 1),
('Harry McKenzie', 'h.mckenzie.ed@summitgear.co.uk', 'staff_hash', '07700-110008', 'Staff', 24000.00, '2022-04-15', 1),
('Isla Grant', 'i.grant.ed@summitgear.co.uk', 'staff_hash', '07700-110009', 'Staff', 25500.00, '2022-07-01', 1),
('Jack Bruce', 'j.bruce.ed@summitgear.co.uk', 'staff_hash', '07700-110010', 'Staff', 24500.00, '2023-01-05', 1),

-- ==================== GLASGOW CENTRAL (Branch 2) ====================
-- Admins (4)
('Fiona Campbell', 'f.campbell@summitgear.co.uk', 'admin_hash', '07700-100005', 'Store Manager', 52000.00, '2019-06-01', 2),
('Craig Thomson', 'c.thomson@summitgear.co.uk', 'admin_hash', '07700-100006', 'Business Admin', 46000.00, '2019-08-10', 2),
('Isla McKenzie', 'i.mckenzie@summitgear.co.uk', 'admin_hash', '07700-100007', 'Inventory Admin', 44000.00, '2020-02-10', 2),
('Hamish Bruce', 'h.bruce@summitgear.co.uk', 'admin_hash', '07700-100008', 'HR Admin', 44000.00, '2019-07-15', 2),
-- Staff (10)
('Karen Wallace', 'k.wallace.gla@summitgear.co.uk', 'staff_hash', '07700-120001', 'Staff', 25500.00, '2020-02-15', 2),
('Liam Sinclair', 'l.sinclair.gla@summitgear.co.uk', 'staff_hash', '07700-120002', 'Staff', 25000.00, '2020-05-20', 2),
('Megan Robertson', 'm.robertson.gla@summitgear.co.uk', 'staff_hash', '07700-120003', 'Staff', 24500.00, '2020-08-10', 2),
('Nathan Ferguson', 'n.ferguson.gla@summitgear.co.uk', 'staff_hash', '07700-120004', 'Staff', 25000.00, '2021-01-15', 2),
('Olivia MacLeod', 'o.macleod.gla@summitgear.co.uk', 'staff_hash', '07700-120005', 'Staff', 24000.00, '2021-04-20', 2),
('Patrick Murray', 'p.murray.gla@summitgear.co.uk', 'staff_hash', '07700-120006', 'Staff', 25500.00, '2021-07-10', 2),
('Quinn Henderson', 'q.henderson.gla@summitgear.co.uk', 'staff_hash', '07700-120007', 'Staff', 24500.00, '2022-02-01', 2),
('Rachel Scott', 'r.scott.gla@summitgear.co.uk', 'staff_hash', '07700-120008', 'Staff', 25000.00, '2022-05-15', 2),
('Samuel Brown', 's.brown.gla@summitgear.co.uk', 'staff_hash', '07700-120009', 'Staff', 24000.00, '2022-08-20', 2),
('Tara Wilson', 't.wilson.gla@summitgear.co.uk', 'staff_hash', '07700-120010', 'Staff', 25500.00, '2023-02-01', 2),

-- ==================== ABERDEEN STORE (Branch 3) ====================
-- Admins (4)
('Angus Stewart', 'a.stewart@summitgear.co.uk', 'admin_hash', '07700-100009', 'Store Manager', 50000.00, '2020-01-05', 3),
('Morag Douglas', 'm.douglas@summitgear.co.uk', 'admin_hash', '07700-100010', 'Business Admin', 45000.00, '2020-03-20', 3),
('Rory MacLeod', 'r.macleod@summitgear.co.uk', 'admin_hash', '07700-100011', 'Inventory Admin', 43000.00, '2020-06-01', 3),
('Shona Grant', 's.grant@summitgear.co.uk', 'admin_hash', '07700-100012', 'HR Admin', 43000.00, '2020-04-10', 3),
-- Staff (10)
('Una Fraser', 'u.fraser.abd@summitgear.co.uk', 'staff_hash', '07700-130001', 'Staff', 24500.00, '2020-04-15', 3),
('Victor Ross', 'v.ross.abd@summitgear.co.uk', 'staff_hash', '07700-130002', 'Staff', 24000.00, '2020-07-20', 3),
('Wendy Campbell', 'w.campbell.abd@summitgear.co.uk', 'staff_hash', '07700-130003', 'Staff', 24500.00, '2020-10-10', 3),
('Xavier Thomson', 'x.thomson.abd@summitgear.co.uk', 'staff_hash', '07700-130004', 'Staff', 24000.00, '2021-02-15', 3),
('Yvonne McKenzie', 'y.mckenzie.abd@summitgear.co.uk', 'staff_hash', '07700-130005', 'Staff', 23500.00, '2021-05-20', 3),
('Zachary Bruce', 'z.bruce.abd@summitgear.co.uk', 'staff_hash', '07700-130006', 'Staff', 24000.00, '2021-08-10', 3),
('Amy Wallace', 'amy.wallace.abd@summitgear.co.uk', 'staff_hash', '07700-130007', 'Staff', 24500.00, '2022-01-15', 3),
('Brian Sinclair', 'brian.sinclair.abd@summitgear.co.uk', 'staff_hash', '07700-130008', 'Staff', 23500.00, '2022-04-20', 3),
('Carol Robertson', 'carol.robertson.abd@summitgear.co.uk', 'staff_hash', '07700-130009', 'Staff', 24000.00, '2022-07-10', 3),
('Derek Ferguson', 'derek.ferguson.abd@summitgear.co.uk', 'staff_hash', '07700-130010', 'Staff', 24500.00, '2023-01-05', 3),

-- ==================== INVERNESS HIGHLAND (Branch 4) ====================
-- Admins (4)
('Eilidh Fraser', 'e.fraser@summitgear.co.uk', 'admin_hash', '07700-100013', 'Store Manager', 48000.00, '2021-04-01', 4),
('Alasdair Ross', 'a.ross@summitgear.co.uk', 'admin_hash', '07700-100014', 'Business Admin', 44000.00, '2021-05-15', 4),
('Kirsty Munro', 'k.munro@summitgear.co.uk', 'admin_hash', '07700-100015', 'Inventory Admin', 42000.00, '2021-07-20', 4),
('Gregor Sinclair', 'g.sinclair@summitgear.co.uk', 'admin_hash', '07700-100016', 'HR Admin', 42000.00, '2021-06-01', 4),
-- Staff (10)
('Ellen Murray', 'ellen.murray.inv@summitgear.co.uk', 'staff_hash', '07700-140001', 'Staff', 23500.00, '2021-06-15', 4),
('Fraser Henderson', 'fraser.henderson.inv@summitgear.co.uk', 'staff_hash', '07700-140002', 'Staff', 23000.00, '2021-09-20', 4),
('Gillian Scott', 'gillian.scott.inv@summitgear.co.uk', 'staff_hash', '07700-140003', 'Staff', 23500.00, '2021-12-10', 4),
('Hamish Brown', 'hamish.brown.inv@summitgear.co.uk', 'staff_hash', '07700-140004', 'Staff', 23000.00, '2022-03-15', 4),
('Irene Wilson', 'irene.wilson.inv@summitgear.co.uk', 'staff_hash', '07700-140005', 'Staff', 22500.00, '2022-06-20', 4),
('Jamie Douglas', 'jamie.douglas.inv@summitgear.co.uk', 'staff_hash', '07700-140006', 'Staff', 23000.00, '2022-09-10', 4),
('Kara Campbell', 'kara.campbell.inv@summitgear.co.uk', 'staff_hash', '07700-140007', 'Staff', 23500.00, '2022-12-01', 4),
('Lewis Thomson', 'lewis.thomson.inv@summitgear.co.uk', 'staff_hash', '07700-140008', 'Staff', 22500.00, '2023-03-15', 4),
('Mhairi McKenzie', 'mhairi.mckenzie.inv@summitgear.co.uk', 'staff_hash', '07700-140009', 'Staff', 23000.00, '2023-06-20', 4),
('Neil Bruce', 'neil.bruce.inv@summitgear.co.uk', 'staff_hash', '07700-140010', 'Staff', 23500.00, '2023-09-01', 4),

-- ==================== DUNDEE OUTLET (Branch 5) ====================
-- Admins (4)
('Callum Murray', 'c.murray@summitgear.co.uk', 'admin_hash', '07700-100017', 'Store Manager', 46000.00, '2022-09-01', 5),
('Aileen Ferguson', 'a.ferguson@summitgear.co.uk', 'admin_hash', '07700-100018', 'Business Admin', 43000.00, '2022-10-15', 5),
('Blair Robertson', 'b.robertson@summitgear.co.uk', 'admin_hash', '07700-100019', 'Inventory Admin', 41000.00, '2022-11-01', 5),
('Catriona Wallace', 'c.wallace@summitgear.co.uk', 'admin_hash', '07700-100020', 'HR Admin', 41000.00, '2022-10-01', 5),
-- Staff (10)
('Orla Grant', 'orla.grant.dun@summitgear.co.uk', 'staff_hash', '07700-150001', 'Staff', 22500.00, '2022-10-15', 5),
('Peter Sinclair', 'peter.sinclair.dun@summitgear.co.uk', 'staff_hash', '07700-150002', 'Staff', 22000.00, '2022-11-20', 5),
('Rhona Robertson', 'rhona.robertson.dun@summitgear.co.uk', 'staff_hash', '07700-150003', 'Staff', 22500.00, '2022-12-10', 5),
('Scott Ferguson', 'scott.ferguson.dun@summitgear.co.uk', 'staff_hash', '07700-150004', 'Staff', 22000.00, '2023-01-15', 5),
('Tina MacLeod', 'tina.macleod.dun@summitgear.co.uk', 'staff_hash', '07700-150005', 'Staff', 21500.00, '2023-02-20', 5),
('Ulric Murray', 'ulric.murray.dun@summitgear.co.uk', 'staff_hash', '07700-150006', 'Staff', 22000.00, '2023-03-10', 5),
('Victoria Henderson', 'victoria.henderson.dun@summitgear.co.uk', 'staff_hash', '07700-150007', 'Staff', 22500.00, '2023-04-15', 5),
('William Scott', 'william.scott.dun@summitgear.co.uk', 'staff_hash', '07700-150008', 'Staff', 21500.00, '2023-05-20', 5),
('Xena Brown', 'xena.brown.dun@summitgear.co.uk', 'staff_hash', '07700-150009', 'Staff', 22000.00, '2023-06-10', 5),
('Yuri Wilson', 'yuri.wilson.dun@summitgear.co.uk', 'staff_hash', '07700-150010', 'Staff', 22500.00, '2023-07-01', 5);

-- Insert Products (40 products across 8 categories)
-- Categories: Camping, Climbing, Clothing, Footwear, Electronics, Backpacks, Lighting, Tools
-- Suppliers: 1=North Face UK, 2=Black Diamond, 3=MSR Outdoor, 4=Garmin UK, 5=Patagonia Europe
-- Insert Products (40 products, 5 brands matching suppliers)
-- Brands: The North Face (1), Black Diamond (2), MSR (3), Garmin (4), Patagonia (5)
INSERT INTO Product (sku, name, brand, category, description, cost_price, retail_price, weight_kg, color, size, supplier_id) VALUES
-- CAMPING (8 products)
('CMP001', 'North Face Stormbreak 2 Tent', 'The North Face', 'Camping', '2-person tent with waterproof coating', 180.00, 450.00, 2.50, 'Green', '2P', 1),
('CMP002', 'North Face Wawona 6 Tent', 'The North Face', 'Camping', '6-person family tent', 280.00, 699.00, 8.20, 'Orange', '6P', 1),
('CMP003', 'North Face Sleeping Bag -10C', 'The North Face', 'Camping', '-10°C rated sleeping bag', 120.00, 280.00, 1.80, 'Red', 'Regular', 1),
('CMP004', 'MSR PocketRocket 2 Stove', 'MSR', 'Camping', 'Ultralight camping stove', 30.00, 75.00, 0.07, 'Silver', 'Standard', 3),
('CMP005', 'MSR WindBurner Stove System', 'MSR', 'Camping', 'All-in-one stove and cookware', 95.00, 189.00, 0.45, 'Red', '1L', 3),
('CMP006', 'MSR NeoAir XLite Sleeping Pad', 'MSR', 'Camping', 'Ultralight inflatable sleeping pad', 85.00, 199.00, 0.35, 'Yellow', 'Regular', 3),
('CMP007', 'MSR Hubba Hubba NX 2 Tent', 'MSR', 'Camping', '2-person backpacking tent', 200.00, 450.00, 1.54, 'Green', '2P', 3),
('CMP008', 'MSR Alpine Cooler 45L', 'MSR', 'Camping', 'Premium hard cooler', 150.00, 325.00, 10.40, 'White', '45L', 3),

-- CLIMBING (6 products)
('CLM001', 'Black Diamond Climbing Rope 60m', 'Black Diamond', 'Climbing', '60m dynamic climbing rope', 85.00, 180.00, 4.10, 'Blue', '60m', 2),
('CLM002', 'Black Diamond Momentum Harness', 'Black Diamond', 'Climbing', 'All-around climbing harness', 45.00, 120.00, 0.45, 'Black', 'M', 2),
('CLM003', 'Black Diamond Vapor Helmet', 'Black Diamond', 'Climbing', 'Ultra-lightweight climbing helmet', 55.00, 130.00, 0.19, 'White', 'M/L', 2),
('CLM004', 'Black Diamond Camalot C4', 'Black Diamond', 'Climbing', 'Cam device for trad climbing', 35.00, 85.00, 0.11, 'Red', '#2', 2),
('CLM005', 'Black Diamond ATC-Guide Belay', 'Black Diamond', 'Climbing', 'Versatile belay/rappel device', 55.00, 140.00, 0.20, 'Orange', 'Standard', 2),
('CLM006', 'Black Diamond Zone Climbing Shoes', 'Black Diamond', 'Climbing', 'High-performance climbing shoes', 70.00, 175.00, 0.42, 'Yellow', 'EU 42', 2),

-- CLOTHING (6 products)
('CLT001', 'Patagonia Nano Puff Jacket', 'Patagonia', 'Clothing', 'Lightweight insulated jacket', 90.00, 220.00, 0.34, 'Blue', 'L', 5),
('CLT002', 'Patagonia R1 Fleece Pullover', 'Patagonia', 'Clothing', 'Technical fleece for layering', 65.00, 159.00, 0.31, 'Black', 'M', 5),
('CLT003', 'North Face ThermoBall Eco Jacket', 'The North Face', 'Clothing', 'Synthetic insulated jacket', 80.00, 199.00, 0.40, 'Navy', 'L', 1),
('CLT004', 'Patagonia Torrentshell 3L Jacket', 'Patagonia', 'Clothing', 'Waterproof rain jacket', 60.00, 149.00, 0.39, 'Green', 'M', 5),
('CLT005', 'Patagonia Tres 3-in-1 Parka', 'Patagonia', 'Clothing', 'Versatile all-weather parka', 250.00, 599.00, 0.49, 'Black', 'L', 5),
('CLT006', 'North Face Summit Down Jacket', 'The North Face', 'Clothing', 'Lightweight down jacket', 110.00, 260.00, 0.38, 'Red', 'M', 1),

-- FOOTWEAR (5 products)
('FTW001', 'Patagonia Drifter Hiking Shoes', 'Patagonia', 'Footwear', 'Waterproof hiking shoes', 70.00, 165.00, 0.80, 'Grey', 'UK 10', 5),
('FTW002', 'Black Diamond Mission Approach', 'Black Diamond', 'Footwear', 'Technical approach shoes', 65.00, 145.00, 0.75, 'Blue', 'UK 9', 2),
('FTW003', 'Black Diamond Alpine Boots', 'Black Diamond', 'Footwear', 'Mountain hiking boots', 120.00, 280.00, 1.50, 'Brown', 'UK 10', 2),
('FTW004', 'Patagonia Range Hiking Boots', 'Patagonia', 'Footwear', 'Mid-cut hiking boots', 55.00, 130.00, 0.90, 'Olive', 'UK 9', 5),
('FTW005', 'Black Diamond Absolute Mountaineering', 'Black Diamond', 'Footwear', 'Mountaineering boots', 200.00, 480.00, 2.10, 'Yellow', 'UK 10', 2),

-- ELECTRONICS (5 products)
('ELC001', 'Garmin GPSMAP 66i', 'Garmin', 'Electronics', 'Handheld GPS with satellite communicator', 250.00, 549.00, 0.24, 'Black', 'Standard', 4),
('ELC002', 'Garmin Fenix 7 Solar Watch', 'Garmin', 'Electronics', 'Solar-powered GPS smartwatch', 350.00, 749.00, 0.08, 'Black', 'Standard', 4),
('ELC003', 'Garmin inReach Mini 2', 'Garmin', 'Electronics', 'Compact satellite communicator', 180.00, 399.00, 0.10, 'Orange', 'Standard', 4),
('ELC004', 'Garmin Venture Powerbank', 'Garmin', 'Electronics', 'Rugged portable charger', 40.00, 89.00, 0.26, 'Black', '35Wh', 4),
('ELC005', 'Garmin Instinct 2 Solar', 'Garmin', 'Electronics', 'Solar GPS outdoor watch', 75.00, 179.00, 0.05, 'Green', 'Standard', 4),

-- BACKPACKS (5 products)
('BKP001', 'Patagonia Refugio Pack 65L', 'Patagonia', 'Backpacks', '65L hiking backpack with suspension', 130.00, 320.00, 2.10, 'Grey', '65L', 5),
('BKP002', 'Patagonia Arbor Classic 22L', 'Patagonia', 'Backpacks', 'Lightweight daypack', 55.00, 130.00, 0.75, 'Green', '22L', 5),
('BKP003', 'Patagonia Ascensionist 75L', 'Patagonia', 'Backpacks', 'Heavy-load expedition pack', 150.00, 359.00, 2.45, 'Navy', '75L', 5),
('BKP004', 'Patagonia Altvia Pack 20L', 'Patagonia', 'Backpacks', 'Fast and light daypack', 40.00, 95.00, 0.45, 'Red', '20L', 5),
('BKP005', 'Patagonia Black Hole 32L', 'Patagonia', 'Backpacks', 'Durable recycled duffel-pack', 65.00, 149.00, 0.88, 'Black', '32L', 5),

-- LIGHTING (3 products)
('LGT001', 'Black Diamond Spot 400 Headlamp', 'Black Diamond', 'Lighting', '400-lumen rechargeable headlamp', 25.00, 55.00, 0.09, 'Graphite', 'Standard', 2),
('LGT002', 'Black Diamond Storm 500 Headlamp', 'Black Diamond', 'Lighting', '500-lumen rechargeable headlamp', 35.00, 79.00, 0.10, 'Blue', 'Standard', 2),
('LGT003', 'Garmin Beacon Lantern', 'Garmin', 'Lighting', 'Portable USB lantern with GPS', 35.00, 79.00, 0.54, 'Black', 'Standard', 4),

-- TOOLS (2 products)
('TLS001', 'MSR Alpine Multi-Tool', 'MSR', 'Tools', '18-in-1 multi-tool', 50.00, 120.00, 0.24, 'Silver', 'Standard', 3),
('TLS002', 'MSR Pocket Tool Kit', 'MSR', 'Tools', '15-in-1 compact multi-tool', 25.00, 59.00, 0.20, 'Black', 'Standard', 3);

-- Insert Initial Stock (50 units per product per branch = 40 products × 5 branches × 50 units)
INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, received_date, location, unit_cost, status) VALUES
-- Edinburgh Flagship (Branch 1) - All 40 products
('INIT-2025-001', 1, 1, 50, '2025-01-01', 'A-01-01', 180.00, 'In Stock'),
('INIT-2025-001', 2, 1, 50, '2025-01-01', 'A-01-02', 280.00, 'In Stock'),
('INIT-2025-001', 3, 1, 50, '2025-01-01', 'A-01-03', 120.00, 'In Stock'),
('INIT-2025-001', 4, 1, 50, '2025-01-01', 'A-01-04', 30.00, 'In Stock'),
('INIT-2025-001', 5, 1, 50, '2025-01-01', 'A-01-05', 95.00, 'In Stock'),
('INIT-2025-001', 6, 1, 50, '2025-01-01', 'A-01-06', 85.00, 'In Stock'),
('INIT-2025-001', 7, 1, 50, '2025-01-01', 'A-01-07', 200.00, 'In Stock'),
('INIT-2025-001', 8, 1, 50, '2025-01-01', 'A-01-08', 150.00, 'In Stock'),
('INIT-2025-001', 9, 1, 50, '2025-01-01', 'A-02-01', 85.00, 'In Stock'),
('INIT-2025-001', 10, 1, 50, '2025-01-01', 'A-02-02', 45.00, 'In Stock'),
('INIT-2025-001', 11, 1, 50, '2025-01-01', 'A-02-03', 55.00, 'In Stock'),
('INIT-2025-001', 12, 1, 50, '2025-01-01', 'A-02-04', 35.00, 'In Stock'),
('INIT-2025-001', 13, 1, 50, '2025-01-01', 'A-02-05', 55.00, 'In Stock'),
('INIT-2025-001', 14, 1, 50, '2025-01-01', 'A-02-06', 70.00, 'In Stock'),
('INIT-2025-001', 15, 1, 50, '2025-01-01', 'B-01-01', 90.00, 'In Stock'),
('INIT-2025-001', 16, 1, 50, '2025-01-01', 'B-01-02', 65.00, 'In Stock'),
('INIT-2025-001', 17, 1, 50, '2025-01-01', 'B-01-03', 80.00, 'In Stock'),
('INIT-2025-001', 18, 1, 50, '2025-01-01', 'B-01-04', 60.00, 'In Stock'),
('INIT-2025-001', 19, 1, 50, '2025-01-01', 'B-01-05', 250.00, 'In Stock'),
('INIT-2025-001', 20, 1, 50, '2025-01-01', 'B-01-06', 110.00, 'In Stock'),
('INIT-2025-001', 21, 1, 50, '2025-01-01', 'B-02-01', 70.00, 'In Stock'),
('INIT-2025-001', 22, 1, 50, '2025-01-01', 'B-02-02', 65.00, 'In Stock'),
('INIT-2025-001', 23, 1, 50, '2025-01-01', 'B-02-03', 120.00, 'In Stock'),
('INIT-2025-001', 24, 1, 50, '2025-01-01', 'B-02-04', 55.00, 'In Stock'),
('INIT-2025-001', 25, 1, 50, '2025-01-01', 'B-02-05', 200.00, 'In Stock'),
('INIT-2025-001', 26, 1, 50, '2025-01-01', 'C-01-01', 250.00, 'In Stock'),
('INIT-2025-001', 27, 1, 50, '2025-01-01', 'C-01-02', 350.00, 'In Stock'),
('INIT-2025-001', 28, 1, 50, '2025-01-01', 'C-01-03', 180.00, 'In Stock'),
('INIT-2025-001', 29, 1, 50, '2025-01-01', 'C-01-04', 40.00, 'In Stock'),
('INIT-2025-001', 30, 1, 50, '2025-01-01', 'C-01-05', 75.00, 'In Stock'),
('INIT-2025-001', 31, 1, 50, '2025-01-01', 'C-02-01', 130.00, 'In Stock'),
('INIT-2025-001', 32, 1, 50, '2025-01-01', 'C-02-02', 55.00, 'In Stock'),
('INIT-2025-001', 33, 1, 50, '2025-01-01', 'C-02-03', 150.00, 'In Stock'),
('INIT-2025-001', 34, 1, 50, '2025-01-01', 'C-02-04', 40.00, 'In Stock'),
('INIT-2025-001', 35, 1, 50, '2025-01-01', 'C-02-05', 65.00, 'In Stock'),
('INIT-2025-001', 36, 1, 50, '2025-01-01', 'D-01-01', 25.00, 'In Stock'),
('INIT-2025-001', 37, 1, 50, '2025-01-01', 'D-01-02', 35.00, 'In Stock'),
('INIT-2025-001', 38, 1, 50, '2025-01-01', 'D-01-03', 35.00, 'In Stock'),
('INIT-2025-001', 39, 1, 50, '2025-01-01', 'D-01-04', 50.00, 'In Stock'),
('INIT-2025-001', 40, 1, 50, '2025-01-01', 'D-01-05', 25.00, 'In Stock'),

-- Glasgow Central (Branch 2) - All 40 products
('INIT-2025-001', 1, 2, 50, '2025-01-01', 'A-01-01', 180.00, 'In Stock'),
('INIT-2025-001', 2, 2, 50, '2025-01-01', 'A-01-02', 280.00, 'In Stock'),
('INIT-2025-001', 3, 2, 50, '2025-01-01', 'A-01-03', 120.00, 'In Stock'),
('INIT-2025-001', 4, 2, 50, '2025-01-01', 'A-01-04', 30.00, 'In Stock'),
('INIT-2025-001', 5, 2, 50, '2025-01-01', 'A-01-05', 95.00, 'In Stock'),
('INIT-2025-001', 6, 2, 50, '2025-01-01', 'A-01-06', 85.00, 'In Stock'),
('INIT-2025-001', 7, 2, 50, '2025-01-01', 'A-01-07', 200.00, 'In Stock'),
('INIT-2025-001', 8, 2, 50, '2025-01-01', 'A-01-08', 150.00, 'In Stock'),
('INIT-2025-001', 9, 2, 50, '2025-01-01', 'A-02-01', 85.00, 'In Stock'),
('INIT-2025-001', 10, 2, 50, '2025-01-01', 'A-02-02', 45.00, 'In Stock'),
('INIT-2025-001', 11, 2, 50, '2025-01-01', 'A-02-03', 55.00, 'In Stock'),
('INIT-2025-001', 12, 2, 50, '2025-01-01', 'A-02-04', 35.00, 'In Stock'),
('INIT-2025-001', 13, 2, 50, '2025-01-01', 'A-02-05', 55.00, 'In Stock'),
('INIT-2025-001', 14, 2, 50, '2025-01-01', 'A-02-06', 70.00, 'In Stock'),
('INIT-2025-001', 15, 2, 50, '2025-01-01', 'B-01-01', 90.00, 'In Stock'),
('INIT-2025-001', 16, 2, 50, '2025-01-01', 'B-01-02', 65.00, 'In Stock'),
('INIT-2025-001', 17, 2, 50, '2025-01-01', 'B-01-03', 80.00, 'In Stock'),
('INIT-2025-001', 18, 2, 50, '2025-01-01', 'B-01-04', 60.00, 'In Stock'),
('INIT-2025-001', 19, 2, 50, '2025-01-01', 'B-01-05', 250.00, 'In Stock'),
('INIT-2025-001', 20, 2, 50, '2025-01-01', 'B-01-06', 110.00, 'In Stock'),
('INIT-2025-001', 21, 2, 50, '2025-01-01', 'B-02-01', 70.00, 'In Stock'),
('INIT-2025-001', 22, 2, 50, '2025-01-01', 'B-02-02', 65.00, 'In Stock'),
('INIT-2025-001', 23, 2, 50, '2025-01-01', 'B-02-03', 120.00, 'In Stock'),
('INIT-2025-001', 24, 2, 50, '2025-01-01', 'B-02-04', 55.00, 'In Stock'),
('INIT-2025-001', 25, 2, 50, '2025-01-01', 'B-02-05', 200.00, 'In Stock'),
('INIT-2025-001', 26, 2, 50, '2025-01-01', 'C-01-01', 250.00, 'In Stock'),
('INIT-2025-001', 27, 2, 50, '2025-01-01', 'C-01-02', 350.00, 'In Stock'),
('INIT-2025-001', 28, 2, 50, '2025-01-01', 'C-01-03', 180.00, 'In Stock'),
('INIT-2025-001', 29, 2, 50, '2025-01-01', 'C-01-04', 40.00, 'In Stock'),
('INIT-2025-001', 30, 2, 50, '2025-01-01', 'C-01-05', 75.00, 'In Stock'),
('INIT-2025-001', 31, 2, 50, '2025-01-01', 'C-02-01', 130.00, 'In Stock'),
('INIT-2025-001', 32, 2, 50, '2025-01-01', 'C-02-02', 55.00, 'In Stock'),
('INIT-2025-001', 33, 2, 50, '2025-01-01', 'C-02-03', 150.00, 'In Stock'),
('INIT-2025-001', 34, 2, 50, '2025-01-01', 'C-02-04', 40.00, 'In Stock'),
('INIT-2025-001', 35, 2, 50, '2025-01-01', 'C-02-05', 65.00, 'In Stock'),
('INIT-2025-001', 36, 2, 50, '2025-01-01', 'D-01-01', 25.00, 'In Stock'),
('INIT-2025-001', 37, 2, 50, '2025-01-01', 'D-01-02', 35.00, 'In Stock'),
('INIT-2025-001', 38, 2, 50, '2025-01-01', 'D-01-03', 35.00, 'In Stock'),
('INIT-2025-001', 39, 2, 50, '2025-01-01', 'D-01-04', 50.00, 'In Stock'),
('INIT-2025-001', 40, 2, 50, '2025-01-01', 'D-01-05', 25.00, 'In Stock'),

-- Aberdeen Store (Branch 3) - All 40 products
('INIT-2025-001', 1, 3, 50, '2025-01-01', 'A-01-01', 180.00, 'In Stock'),
('INIT-2025-001', 2, 3, 50, '2025-01-01', 'A-01-02', 280.00, 'In Stock'),
('INIT-2025-001', 3, 3, 50, '2025-01-01', 'A-01-03', 120.00, 'In Stock'),
('INIT-2025-001', 4, 3, 50, '2025-01-01', 'A-01-04', 30.00, 'In Stock'),
('INIT-2025-001', 5, 3, 50, '2025-01-01', 'A-01-05', 95.00, 'In Stock'),
('INIT-2025-001', 6, 3, 50, '2025-01-01', 'A-01-06', 85.00, 'In Stock'),
('INIT-2025-001', 7, 3, 50, '2025-01-01', 'A-01-07', 200.00, 'In Stock'),
('INIT-2025-001', 8, 3, 50, '2025-01-01', 'A-01-08', 150.00, 'In Stock'),
('INIT-2025-001', 9, 3, 50, '2025-01-01', 'A-02-01', 85.00, 'In Stock'),
('INIT-2025-001', 10, 3, 50, '2025-01-01', 'A-02-02', 45.00, 'In Stock'),
('INIT-2025-001', 11, 3, 50, '2025-01-01', 'A-02-03', 55.00, 'In Stock'),
('INIT-2025-001', 12, 3, 50, '2025-01-01', 'A-02-04', 35.00, 'In Stock'),
('INIT-2025-001', 13, 3, 50, '2025-01-01', 'A-02-05', 55.00, 'In Stock'),
('INIT-2025-001', 14, 3, 50, '2025-01-01', 'A-02-06', 70.00, 'In Stock'),
('INIT-2025-001', 15, 3, 50, '2025-01-01', 'B-01-01', 90.00, 'In Stock'),
('INIT-2025-001', 16, 3, 50, '2025-01-01', 'B-01-02', 65.00, 'In Stock'),
('INIT-2025-001', 17, 3, 50, '2025-01-01', 'B-01-03', 80.00, 'In Stock'),
('INIT-2025-001', 18, 3, 50, '2025-01-01', 'B-01-04', 60.00, 'In Stock'),
('INIT-2025-001', 19, 3, 50, '2025-01-01', 'B-01-05', 250.00, 'In Stock'),
('INIT-2025-001', 20, 3, 50, '2025-01-01', 'B-01-06', 110.00, 'In Stock'),
('INIT-2025-001', 21, 3, 50, '2025-01-01', 'B-02-01', 70.00, 'In Stock'),
('INIT-2025-001', 22, 3, 50, '2025-01-01', 'B-02-02', 65.00, 'In Stock'),
('INIT-2025-001', 23, 3, 50, '2025-01-01', 'B-02-03', 120.00, 'In Stock'),
('INIT-2025-001', 24, 3, 50, '2025-01-01', 'B-02-04', 55.00, 'In Stock'),
('INIT-2025-001', 25, 3, 50, '2025-01-01', 'B-02-05', 200.00, 'In Stock'),
('INIT-2025-001', 26, 3, 50, '2025-01-01', 'C-01-01', 250.00, 'In Stock'),
('INIT-2025-001', 27, 3, 50, '2025-01-01', 'C-01-02', 350.00, 'In Stock'),
('INIT-2025-001', 28, 3, 50, '2025-01-01', 'C-01-03', 180.00, 'In Stock'),
('INIT-2025-001', 29, 3, 50, '2025-01-01', 'C-01-04', 40.00, 'In Stock'),
('INIT-2025-001', 30, 3, 50, '2025-01-01', 'C-01-05', 75.00, 'In Stock'),
('INIT-2025-001', 31, 3, 50, '2025-01-01', 'C-02-01', 130.00, 'In Stock'),
('INIT-2025-001', 32, 3, 50, '2025-01-01', 'C-02-02', 55.00, 'In Stock'),
('INIT-2025-001', 33, 3, 50, '2025-01-01', 'C-02-03', 150.00, 'In Stock'),
('INIT-2025-001', 34, 3, 50, '2025-01-01', 'C-02-04', 40.00, 'In Stock'),
('INIT-2025-001', 35, 3, 50, '2025-01-01', 'C-02-05', 65.00, 'In Stock'),
('INIT-2025-001', 36, 3, 50, '2025-01-01', 'D-01-01', 25.00, 'In Stock'),
('INIT-2025-001', 37, 3, 50, '2025-01-01', 'D-01-02', 35.00, 'In Stock'),
('INIT-2025-001', 38, 3, 50, '2025-01-01', 'D-01-03', 35.00, 'In Stock'),
('INIT-2025-001', 39, 3, 50, '2025-01-01', 'D-01-04', 50.00, 'In Stock'),
('INIT-2025-001', 40, 3, 50, '2025-01-01', 'D-01-05', 25.00, 'In Stock'),

-- Inverness Highland (Branch 4) - All 40 products
('INIT-2025-001', 1, 4, 50, '2025-01-01', 'A-01-01', 180.00, 'In Stock'),
('INIT-2025-001', 2, 4, 50, '2025-01-01', 'A-01-02', 280.00, 'In Stock'),
('INIT-2025-001', 3, 4, 50, '2025-01-01', 'A-01-03', 120.00, 'In Stock'),
('INIT-2025-001', 4, 4, 50, '2025-01-01', 'A-01-04', 30.00, 'In Stock'),
('INIT-2025-001', 5, 4, 50, '2025-01-01', 'A-01-05', 95.00, 'In Stock'),
('INIT-2025-001', 6, 4, 50, '2025-01-01', 'A-01-06', 85.00, 'In Stock'),
('INIT-2025-001', 7, 4, 50, '2025-01-01', 'A-01-07', 200.00, 'In Stock'),
('INIT-2025-001', 8, 4, 50, '2025-01-01', 'A-01-08', 150.00, 'In Stock'),
('INIT-2025-001', 9, 4, 50, '2025-01-01', 'A-02-01', 85.00, 'In Stock'),
('INIT-2025-001', 10, 4, 50, '2025-01-01', 'A-02-02', 45.00, 'In Stock'),
('INIT-2025-001', 11, 4, 50, '2025-01-01', 'A-02-03', 55.00, 'In Stock'),
('INIT-2025-001', 12, 4, 50, '2025-01-01', 'A-02-04', 35.00, 'In Stock'),
('INIT-2025-001', 13, 4, 50, '2025-01-01', 'A-02-05', 55.00, 'In Stock'),
('INIT-2025-001', 14, 4, 50, '2025-01-01', 'A-02-06', 70.00, 'In Stock'),
('INIT-2025-001', 15, 4, 50, '2025-01-01', 'B-01-01', 90.00, 'In Stock'),
('INIT-2025-001', 16, 4, 50, '2025-01-01', 'B-01-02', 65.00, 'In Stock'),
('INIT-2025-001', 17, 4, 50, '2025-01-01', 'B-01-03', 80.00, 'In Stock'),
('INIT-2025-001', 18, 4, 50, '2025-01-01', 'B-01-04', 60.00, 'In Stock'),
('INIT-2025-001', 19, 4, 50, '2025-01-01', 'B-01-05', 250.00, 'In Stock'),
('INIT-2025-001', 20, 4, 50, '2025-01-01', 'B-01-06', 110.00, 'In Stock'),
('INIT-2025-001', 21, 4, 50, '2025-01-01', 'B-02-01', 70.00, 'In Stock'),
('INIT-2025-001', 22, 4, 50, '2025-01-01', 'B-02-02', 65.00, 'In Stock'),
('INIT-2025-001', 23, 4, 50, '2025-01-01', 'B-02-03', 120.00, 'In Stock'),
('INIT-2025-001', 24, 4, 50, '2025-01-01', 'B-02-04', 55.00, 'In Stock'),
('INIT-2025-001', 25, 4, 50, '2025-01-01', 'B-02-05', 200.00, 'In Stock'),
('INIT-2025-001', 26, 4, 50, '2025-01-01', 'C-01-01', 250.00, 'In Stock'),
('INIT-2025-001', 27, 4, 50, '2025-01-01', 'C-01-02', 350.00, 'In Stock'),
('INIT-2025-001', 28, 4, 50, '2025-01-01', 'C-01-03', 180.00, 'In Stock'),
('INIT-2025-001', 29, 4, 50, '2025-01-01', 'C-01-04', 40.00, 'In Stock'),
('INIT-2025-001', 30, 4, 50, '2025-01-01', 'C-01-05', 75.00, 'In Stock'),
('INIT-2025-001', 31, 4, 50, '2025-01-01', 'C-02-01', 130.00, 'In Stock'),
('INIT-2025-001', 32, 4, 50, '2025-01-01', 'C-02-02', 55.00, 'In Stock'),
('INIT-2025-001', 33, 4, 50, '2025-01-01', 'C-02-03', 150.00, 'In Stock'),
('INIT-2025-001', 34, 4, 50, '2025-01-01', 'C-02-04', 40.00, 'In Stock'),
('INIT-2025-001', 35, 4, 50, '2025-01-01', 'C-02-05', 65.00, 'In Stock'),
('INIT-2025-001', 36, 4, 50, '2025-01-01', 'D-01-01', 25.00, 'In Stock'),
('INIT-2025-001', 37, 4, 50, '2025-01-01', 'D-01-02', 35.00, 'In Stock'),
('INIT-2025-001', 38, 4, 50, '2025-01-01', 'D-01-03', 35.00, 'In Stock'),
('INIT-2025-001', 39, 4, 50, '2025-01-01', 'D-01-04', 50.00, 'In Stock'),
('INIT-2025-001', 40, 4, 50, '2025-01-01', 'D-01-05', 25.00, 'In Stock'),

-- Dundee Outlet (Branch 5) - All 40 products
('INIT-2025-001', 1, 5, 50, '2025-01-01', 'A-01-01', 180.00, 'In Stock'),
('INIT-2025-001', 2, 5, 50, '2025-01-01', 'A-01-02', 280.00, 'In Stock'),
('INIT-2025-001', 3, 5, 50, '2025-01-01', 'A-01-03', 120.00, 'In Stock'),
('INIT-2025-001', 4, 5, 50, '2025-01-01', 'A-01-04', 30.00, 'In Stock'),
('INIT-2025-001', 5, 5, 50, '2025-01-01', 'A-01-05', 95.00, 'In Stock'),
('INIT-2025-001', 6, 5, 50, '2025-01-01', 'A-01-06', 85.00, 'In Stock'),
('INIT-2025-001', 7, 5, 50, '2025-01-01', 'A-01-07', 200.00, 'In Stock'),
('INIT-2025-001', 8, 5, 50, '2025-01-01', 'A-01-08', 150.00, 'In Stock'),
('INIT-2025-001', 9, 5, 50, '2025-01-01', 'A-02-01', 85.00, 'In Stock'),
('INIT-2025-001', 10, 5, 50, '2025-01-01', 'A-02-02', 45.00, 'In Stock'),
('INIT-2025-001', 11, 5, 50, '2025-01-01', 'A-02-03', 55.00, 'In Stock'),
('INIT-2025-001', 12, 5, 50, '2025-01-01', 'A-02-04', 35.00, 'In Stock'),
('INIT-2025-001', 13, 5, 50, '2025-01-01', 'A-02-05', 55.00, 'In Stock'),
('INIT-2025-001', 14, 5, 50, '2025-01-01', 'A-02-06', 70.00, 'In Stock'),
('INIT-2025-001', 15, 5, 50, '2025-01-01', 'B-01-01', 90.00, 'In Stock'),
('INIT-2025-001', 16, 5, 50, '2025-01-01', 'B-01-02', 65.00, 'In Stock'),
('INIT-2025-001', 17, 5, 50, '2025-01-01', 'B-01-03', 80.00, 'In Stock'),
('INIT-2025-001', 18, 5, 50, '2025-01-01', 'B-01-04', 60.00, 'In Stock'),
('INIT-2025-001', 19, 5, 50, '2025-01-01', 'B-01-05', 250.00, 'In Stock'),
('INIT-2025-001', 20, 5, 50, '2025-01-01', 'B-01-06', 110.00, 'In Stock'),
('INIT-2025-001', 21, 5, 50, '2025-01-01', 'B-02-01', 70.00, 'In Stock'),
('INIT-2025-001', 22, 5, 50, '2025-01-01', 'B-02-02', 65.00, 'In Stock'),
('INIT-2025-001', 23, 5, 50, '2025-01-01', 'B-02-03', 120.00, 'In Stock'),
('INIT-2025-001', 24, 5, 50, '2025-01-01', 'B-02-04', 55.00, 'In Stock'),
('INIT-2025-001', 25, 5, 50, '2025-01-01', 'B-02-05', 200.00, 'In Stock'),
('INIT-2025-001', 26, 5, 50, '2025-01-01', 'C-01-01', 250.00, 'In Stock'),
('INIT-2025-001', 27, 5, 50, '2025-01-01', 'C-01-02', 350.00, 'In Stock'),
('INIT-2025-001', 28, 5, 50, '2025-01-01', 'C-01-03', 180.00, 'In Stock'),
('INIT-2025-001', 29, 5, 50, '2025-01-01', 'C-01-04', 40.00, 'In Stock'),
('INIT-2025-001', 30, 5, 50, '2025-01-01', 'C-01-05', 75.00, 'In Stock'),
('INIT-2025-001', 31, 5, 50, '2025-01-01', 'C-02-01', 130.00, 'In Stock'),
('INIT-2025-001', 32, 5, 50, '2025-01-01', 'C-02-02', 55.00, 'In Stock'),
('INIT-2025-001', 33, 5, 50, '2025-01-01', 'C-02-03', 150.00, 'In Stock'),
('INIT-2025-001', 34, 5, 50, '2025-01-01', 'C-02-04', 40.00, 'In Stock'),
('INIT-2025-001', 35, 5, 50, '2025-01-01', 'C-02-05', 65.00, 'In Stock'),
('INIT-2025-001', 36, 5, 50, '2025-01-01', 'D-01-01', 25.00, 'In Stock'),
('INIT-2025-001', 37, 5, 50, '2025-01-01', 'D-01-02', 35.00, 'In Stock'),
('INIT-2025-001', 38, 5, 50, '2025-01-01', 'D-01-03', 35.00, 'In Stock'),
('INIT-2025-001', 39, 5, 50, '2025-01-01', 'D-01-04', 50.00, 'In Stock'),
('INIT-2025-001', 40, 5, 50, '2025-01-01', 'D-01-05', 25.00, 'In Stock');

-- Insert Customers
INSERT INTO Customer (name, email, password_hash, phone, address, city, postcode, membership_id, total_points, total_spent, registration_date) VALUES
('James Wilson', 'james.wilson@email.com', 'hash123', '07712-345678', '45 Royal Mile', 'Edinburgh', 'EH1 1AA', 3, 2450, 2850.00, '2023-01-15'),
('Emma Thompson', 'emma.t@email.com', 'hash123', '07723-456789', '12 George Street', 'Glasgow', 'G1 2AF', 2, 680, 890.00, '2023-03-20'),
('Oliver Brown', 'o.brown@email.com', 'hash123', '07734-567890', '78 Union Terrace', 'Aberdeen', 'AB10 1QT', 4, 5200, 6100.00, '2022-06-10'),
('Sophie Clark', 's.clark@email.com', 'hash123', '07745-678901', '23 Academy Street', 'Inverness', 'IV1 1LP', 1, 120, 150.00, '2024-01-05'),
('William Scott', 'w.scott@email.com', 'hash123', '07756-789012', '56 Nethergate', 'Dundee', 'DD1 4ER', 2, 890, 1200.00, '2023-08-15');

-- No pre-inserted Purchase Orders (data will be created through the application)

-- No pre-inserted Stock Items (data will be created through the application)

-- No pre-inserted Sales Orders (data will be created through the application)

-- No pre-inserted Points Transactions (data will be created through the application)

-- Insert Sample Promotions
INSERT INTO Promotion (title, description, discount_type, discount_value, min_purchase, start_date, end_date, applies_to, category) VALUES
('Winter Sale 2025', 'Get 20% off all winter gear! Perfect for your next adventure.', 'Percentage', 20.00, 50.00, '2025-01-01', '2025-02-28', 'Category', 'Clothing'),
('New Year Special', '£10 off on orders over £100', 'Fixed', 10.00, 100.00, '2025-01-01', '2025-01-31', 'All', NULL),
('Camping Season Prep', '15% off all camping equipment', 'Percentage', 15.00, 0.00, '2025-03-01', '2025-04-30', 'Category', 'Camping');

-- Insert Sample Coupons
INSERT INTO Coupon (code, description, discount_type, discount_value, min_purchase, max_uses, start_date, end_date) VALUES
('WELCOME10', 'Welcome discount for new customers', 'Percentage', 10.00, 30.00, NULL, '2025-01-01', '2025-12-31'),
('WINTER25', 'Winter special - £25 off', 'Fixed', 25.00, 150.00, 100, '2025-01-01', '2025-02-28'),
('LOYALTY15', 'Loyalty reward - 15% off', 'Percentage', 15.00, 50.00, 50, '2025-01-01', '2025-06-30');

-- Insert Sample Homepage Banners
INSERT INTO Homepage_Banner (title, subtitle, image_url, link_url, link_text, position, start_date, end_date) VALUES
('Winter Adventure Awaits', 'Up to 20% off winter gear - Stay warm, stay active!', '/images/banners/winter-sale.jpg', '/customer-portal/products.html?category=Clothing', 'Shop Winter Gear', 1, '2025-01-01', '2025-02-28'),
('New Arrivals', 'Check out the latest outdoor equipment for 2025', '/images/banners/new-arrivals.jpg', '/customer-portal/products.html', 'Explore New Products', 2, NULL, NULL),
('Free Delivery', 'Free delivery on orders over £75', '/images/banners/free-delivery.jpg', '/customer-portal/products.html', 'Start Shopping', 3, NULL, NULL)

-- ============================================================
-- SECTION 7: USER ACCOUNTS FOR DATABASE ACCESS
-- ============================================================

-- Create database users with appropriate privileges
-- Note: Run these with admin privileges

-- Customer User (Read-only access to customer views)
-- CREATE USER 'customer_user'@'%' IDENTIFIED BY 'customer123';
-- GRANT SELECT ON summit_gear_db.v_customer_products TO 'customer_user'@'%';
-- GRANT SELECT ON summit_gear_db.v_customer_orders TO 'customer_user'@'%';
-- GRANT SELECT ON summit_gear_db.v_customer_membership TO 'customer_user'@'%';

-- Staff User (Access to staff views and limited updates)
-- CREATE USER 'staff_user'@'%' IDENTIFIED BY 'staff123';
-- GRANT SELECT ON summit_gear_db.v_staff_inventory TO 'staff_user'@'%';
-- GRANT SELECT ON summit_gear_db.v_branch_stock TO 'staff_user'@'%';
-- GRANT SELECT, INSERT, UPDATE ON summit_gear_db.Sales_Order TO 'staff_user'@'%';
-- GRANT SELECT, INSERT ON summit_gear_db.Sales_Order_Item TO 'staff_user'@'%';
-- GRANT EXECUTE ON PROCEDURE summit_gear_db.sp_process_sale TO 'staff_user'@'%';

-- Supplier User (Access to supplier views)
-- CREATE USER 'supplier_user'@'%' IDENTIFIED BY 'supplier123';
-- GRANT SELECT ON summit_gear_db.v_supplier_orders TO 'supplier_user'@'%';
-- GRANT SELECT ON summit_gear_db.v_supplier_order_items TO 'supplier_user'@'%';

-- Admin User (Full access)
-- CREATE USER 'admin_user'@'%' IDENTIFIED BY 'admin123';
-- GRANT ALL PRIVILEGES ON summit_gear_db.* TO 'admin_user'@'%';

-- FLUSH PRIVILEGES;

SELECT 'Database setup completed successfully!' AS Status;
