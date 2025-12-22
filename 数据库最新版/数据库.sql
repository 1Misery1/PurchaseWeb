DROP DATABASE IF EXISTS summit_gear_db;
CREATE DATABASE summit_gear_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE summit_gear_db;

-- 1. Branch
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
    phone VARCHAR(20) NOT NULL,
    position VARCHAR(50) NOT NULL,
    salary DECIMAL(10,2) NOT NULL,
    hire_date DATE NOT NULL,
    branch_id INT NOT NULL,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 3. Membership
CREATE TABLE Membership (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    membership_name VARCHAR(20) NOT NULL UNIQUE,
    discount_rate DECIMAL(5,2) NOT NULL,
    point_rate DECIMAL(5,2) NOT NULL,
    min_consume DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- 4. Customer
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(200),
    city VARCHAR(50),
    postcode VARCHAR(10),
    membership_id INT DEFAULT NULL,
    total_points INT NOT NULL DEFAULT 0,
    registration_date DATE NOT NULL,
    FOREIGN KEY (membership_id) REFERENCES Membership(membership_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. Supplier
CREATE TABLE Supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address VARCHAR(200),
    city VARCHAR(50),
    country VARCHAR(50) NOT NULL DEFAULT 'UK'
) ENGINE=InnoDB;

-- 6. Product
CREATE TABLE Product (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,
    cost_price DECIMAL(10,2) NOT NULL,
    retail_price DECIMAL(10,2) NOT NULL,
    weight_kg DECIMAL(6,2),
    dimensions VARCHAR(50),
    color VARCHAR(30),
    size VARCHAR(20),
    supplier_id INT NOT NULL,
    status ENUM('Active','Discontinued') NOT NULL DEFAULT 'Active',
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_brand (brand)
) ENGINE=InnoDB;

-- 7. Inventory
CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    branch_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    location VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uk_product_branch (product_id, branch_id)
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
    payment_method VARCHAR(20) NOT NULL,
    status ENUM('Completed','Returned','Cancelled') NOT NULL DEFAULT 'Completed',
    points_earned INT NOT NULL DEFAULT 0,
    payment_status ENUM('Unpaid','Partial','Paid') NOT NULL DEFAULT 'Unpaid',
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 9. Sales_Order_Item
CREATE TABLE Sales_Order_Item (
    so_item_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 10. Purchase_Order
CREATE TABLE Purchase_Order (
    po_id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(20) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    employee_id INT NOT NULL,
    branch_id INT NOT NULL,
    order_date DATE NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status ENUM('Pending','Confirmed','Shipped','Received','Cancelled') NOT NULL DEFAULT 'Pending',
    payment_status ENUM('Unpaid','Partial','Paid') NOT NULL DEFAULT 'Unpaid',
    FOREIGN KEY (supplier_id) REFERENCES Supplier(supplier_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 11. Purchase_Order_Item
CREATE TABLE Purchase_Order_Item (
    po_item_id INT AUTO_INCREMENT PRIMARY KEY,
    po_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (po_id) REFERENCES Purchase_Order(po_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 12. Points_Transaction
CREATE TABLE Points_Transaction (
    trans_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_id INT,
    point_change INT NOT NULL,
    trans_type ENUM('Earn','Redeem','Expire','Adjust') NOT NULL,
    trans_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    balance_after INT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (order_id) REFERENCES Sales_Order(order_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;