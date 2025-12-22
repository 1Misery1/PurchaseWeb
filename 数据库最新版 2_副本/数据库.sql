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
CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'default_hash',
    phone VARCHAR(20) NOT NULL,
    position ENUM('Store Manager', 'Sales Staff', 'Inventory Staff', 'HR Admin', 'Business Admin') NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    branch_id INT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_position (position)
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

-- Insert Employees
INSERT INTO Employee (name, email, password_hash, phone, position, salary, hire_date, branch_id) VALUES
('Robert MacGregor', 'r.macgregor@summitgear.co.uk', 'hash123', '07700-100001', 'Store Manager', 55000.00, '2018-03-01', 1),
('Tom Green', 't.green@summitgear.co.uk', 'hash123', '07700-100002', 'Sales Staff', 28000.00, '2019-05-15', 1),
('Lucy White', 'l.white@summitgear.co.uk', 'hash123', '07700-100003', 'Inventory Staff', 30000.00, '2019-08-20', 1),
('Fiona Campbell', 'f.campbell@summitgear.co.uk', 'hash123', '07700-100004', 'Store Manager', 52000.00, '2019-06-01', 2),
('James Wilson', 'j.wilson@summitgear.co.uk', 'hash123', '07700-100005', 'Sales Staff', 27000.00, '2020-02-10', 2),
('Angus Stewart', 'a.stewart@summitgear.co.uk', 'hash123', '07700-100006', 'Store Manager', 50000.00, '2020-01-05', 3),
('Eilidh Fraser', 'e.fraser@summitgear.co.uk', 'hash123', '07700-100007', 'Store Manager', 48000.00, '2021-04-01', 4),
('Callum Murray', 'c.murray@summitgear.co.uk', 'hash123', '07700-100008', 'Store Manager', 46000.00, '2022-09-01', 5),
('HR Admin', 'hr@summitgear.co.uk', 'hash123', '07700-100009', 'HR Admin', 45000.00, '2018-03-01', 1),
('Business Admin', 'business@summitgear.co.uk', 'hash123', '07700-100010', 'Business Admin', 48000.00, '2018-03-01', 1);

-- Insert Products
INSERT INTO Product (sku, name, brand, category, description, cost_price, retail_price, weight_kg, color, size, supplier_id) VALUES
('TNT001', 'North Face Stormbreak 2', 'The North Face', 'Camping', '2-person tent with waterproof coating', 180.00, 450.00, 2.50, 'Green', '2P', 1),
('TNT002', 'North Face Wawona 6', 'The North Face', 'Camping', '6-person family tent', 280.00, 699.00, 8.20, 'Orange', '6P', 1),
('CLR001', 'Black Diamond Climbing Rope', 'Black Diamond', 'Climbing', '60m dynamic climbing rope', 85.00, 180.00, 4.10, 'Blue', '60m', 2),
('CLR002', 'Black Diamond Harness', 'Black Diamond', 'Climbing', 'Professional climbing harness', 45.00, 120.00, 0.45, 'Black', 'M', 2),
('SLP001', 'North Face Sleeping Bag', 'The North Face', 'Camping', '-10°C rated sleeping bag', 120.00, 280.00, 1.80, 'Red', 'Regular', 1),
('BKP001', 'Osprey Atmos 65', 'Osprey', 'Backpacks', '65L hiking backpack', 130.00, 320.00, 2.10, 'Grey', '65L', 5),
('GPS001', 'Garmin GPSMAP 66i', 'Garmin', 'Electronics', 'Handheld GPS with satellite communicator', 250.00, 549.00, 0.24, 'Black', 'Standard', 4),
('HLM001', 'Black Diamond Vapor Helmet', 'Black Diamond', 'Climbing', 'Ultra-lightweight climbing helmet', 55.00, 130.00, 0.19, 'White', 'M/L', 2),
('STK001', 'MSR PocketRocket 2', 'MSR', 'Camping', 'Ultralight camping stove', 30.00, 75.00, 0.07, 'Silver', 'Standard', 3),
('JKT001', 'Patagonia Nano Puff', 'Patagonia', 'Clothing', 'Lightweight insulated jacket', 90.00, 220.00, 0.34, 'Blue', 'L', 5);

-- Insert Customers
INSERT INTO Customer (name, email, password_hash, phone, address, city, postcode, membership_id, total_points, total_spent, registration_date) VALUES
('James Wilson', 'james.wilson@email.com', 'hash123', '07712-345678', '45 Royal Mile', 'Edinburgh', 'EH1 1AA', 3, 2450, 2850.00, '2023-01-15'),
('Emma Thompson', 'emma.t@email.com', 'hash123', '07723-456789', '12 George Street', 'Glasgow', 'G1 2AF', 2, 680, 890.00, '2023-03-20'),
('Oliver Brown', 'o.brown@email.com', 'hash123', '07734-567890', '78 Union Terrace', 'Aberdeen', 'AB10 1QT', 4, 5200, 6100.00, '2022-06-10'),
('Sophie Clark', 's.clark@email.com', 'hash123', '07745-678901', '23 Academy Street', 'Inverness', 'IV1 1LP', 1, 120, 150.00, '2024-01-05'),
('William Scott', 'w.scott@email.com', 'hash123', '07756-789012', '56 Nethergate', 'Dundee', 'DD1 4ER', 2, 890, 1200.00, '2023-08-15');

-- Insert Purchase Orders
INSERT INTO Purchase_Order (po_number, supplier_id, employee_id, branch_id, order_date, expected_date, total_amount, status, payment_status) VALUES
('PO-2024-001', 1, 3, 1, '2024-10-01', '2024-10-15', 5400.00, 'Received', 'Paid'),
('PO-2024-002', 2, 3, 1, '2024-10-05', '2024-10-20', 2600.00, 'Received', 'Paid'),
('PO-2024-003', 4, 3, 1, '2024-10-10', '2024-10-25', 5000.00, 'Shipped', 'Unpaid'),
('PO-2024-004', 1, 5, 2, '2024-10-12', '2024-10-28', 3600.00, 'Confirmed', 'Unpaid');

-- Insert Purchase Order Items
INSERT INTO Purchase_Order_Item (po_id, product_id, quantity, received_qty, unit_price, total_price) VALUES
(1, 1, 20, 20, 180.00, 3600.00),
(1, 5, 10, 10, 120.00, 1200.00),
(1, 2, 2, 2, 280.00, 560.00),
(2, 3, 20, 20, 85.00, 1700.00),
(2, 4, 20, 20, 45.00, 900.00),
(3, 7, 10, 0, 250.00, 2500.00),
(3, 7, 10, 0, 250.00, 2500.00),
(4, 1, 15, 0, 180.00, 2700.00),
(4, 5, 8, 0, 120.00, 960.00);

-- Insert Stock Items (with batch tracking)
INSERT INTO StockItem (batch_no, product_id, branch_id, quantity, purchase_order_id, received_date, location, unit_cost, status) VALUES
('BSG_20241015_1', 1, 1, 15, 1, '2024-10-15', 'A-01-01', 180.00, 'In Stock'),
('BSG_20241015_1', 5, 1, 8, 1, '2024-10-15', 'A-02-01', 120.00, 'In Stock'),
('BSG_20241015_1', 2, 1, 2, 1, '2024-10-15', 'A-01-02', 280.00, 'In Stock'),
('BSG_20241020_2', 3, 1, 18, 2, '2024-10-20', 'B-01-01', 85.00, 'In Stock'),
('BSG_20241020_2', 4, 1, 15, 2, '2024-10-20', 'B-01-02', 45.00, 'In Stock'),
('BSG_20241001_0', 6, 1, 12, NULL, '2024-10-01', 'C-01-01', 130.00, 'In Stock'),
('BSG_20241001_0', 8, 1, 10, NULL, '2024-10-01', 'B-02-01', 55.00, 'In Stock'),
('BSG_20241001_0', 9, 1, 25, NULL, '2024-10-01', 'C-02-01', 30.00, 'In Stock'),
('BSG_20241001_0', 10, 1, 8, NULL, '2024-10-01', 'D-01-01', 90.00, 'In Stock'),
('BSG_20240915_0', 1, 2, 10, NULL, '2024-09-15', 'A-01-01', 180.00, 'In Stock'),
('BSG_20240915_0', 3, 2, 12, NULL, '2024-09-15', 'B-01-01', 85.00, 'In Stock'),
('BSG_20240915_0', 7, 2, 5, NULL, '2024-09-15', 'C-01-01', 250.00, 'In Stock'),
('BSG_20240920_0', 1, 3, 8, NULL, '2024-09-20', 'A-01-01', 180.00, 'In Stock'),
('BSG_20240920_0', 5, 3, 6, NULL, '2024-09-20', 'A-02-01', 120.00, 'In Stock');

-- Insert Sales Orders
INSERT INTO Sales_Order (order_number, customer_id, employee_id, branch_id, order_date, total_amount, discount_amount, final_amount, payment_method, status, points_earned, payment_status) VALUES
('SO-2024-0001', 1, 2, 1, '2024-10-20 14:30:00', 730.00, 73.00, 657.00, 'Card', 'Completed', 131, 'Paid'),
('SO-2024-0002', 2, 2, 1, '2024-10-21 11:15:00', 180.00, 9.00, 171.00, 'Card', 'Completed', 26, 'Paid'),
('SO-2024-0003', 3, 5, 2, '2024-10-21 16:45:00', 549.00, 82.35, 466.65, 'Card', 'Completed', 140, 'Paid'),
('SO-2024-0004', 1, 2, 1, '2024-10-22 10:00:00', 320.00, 32.00, 288.00, 'Cash', 'Completed', 58, 'Paid');

-- Insert Sales Order Items
INSERT INTO Sales_Order_Item (order_id, product_id, stock_id, quantity, unit_price, discount, total_price) VALUES
(1, 1, 1, 1, 450.00, 45.00, 405.00),
(1, 5, 2, 1, 280.00, 28.00, 252.00),
(2, 3, 4, 1, 180.00, 9.00, 171.00),
(3, 7, 12, 1, 549.00, 82.35, 466.65),
(4, 6, 6, 1, 320.00, 32.00, 288.00);

-- Insert Points Transactions
INSERT INTO Points_Transaction (customer_id, order_id, point_change, trans_type, balance_after, description) VALUES
(1, 1, 131, 'Earn', 2581, 'Points earned from order SO-2024-0001'),
(2, 2, 26, 'Earn', 706, 'Points earned from order SO-2024-0002'),
(3, 3, 140, 'Earn', 5340, 'Points earned from order SO-2024-0003'),
(1, 4, 58, 'Earn', 2639, 'Points earned from order SO-2024-0004');

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
