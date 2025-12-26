<?php
/**
 * Database Connection Test
 * 
 * Visit: http://localhost/summit-gear/api/test.php
 */

require_once 'config.php';

echo "<h1>Summit Gear API - Database Test</h1>";

$pdo = getDBConnection();

if (!$pdo) {
    echo "<p style='color: red;'>❌ Database connection FAILED!</p>";
    echo "<p>Please make sure:</p>";
    echo "<ol>";
    echo "<li>XAMPP MySQL is running</li>";
    echo "<li>Database 'summit_gear_db' exists</li>";
    echo "<li>You have imported the 数据库.sql file</li>";
    echo "</ol>";
    echo "<h2>How to import the database:</h2>";
    echo "<ol>";
    echo "<li>Open phpMyAdmin: <a href='http://localhost/phpmyadmin'>http://localhost/phpmyadmin</a></li>";
    echo "<li>Click 'Import' in the top menu</li>";
    echo "<li>Select the file: 数据库.sql</li>";
    echo "<li>Click 'Go' to import</li>";
    echo "</ol>";
    exit();
}

echo "<p style='color: green;'>✅ Database connection successful!</p>";

// Test tables
$tables = ['Branch', 'Customer', 'Employee', 'Product', 'Supplier', 'Sales_Order', 'Purchase_Order', 'StockItem'];

echo "<h2>Table Status:</h2>";
echo "<table border='1' cellpadding='10'>";
echo "<tr><th>Table</th><th>Record Count</th><th>Status</th></tr>";

foreach ($tables as $table) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM {$table}");
        $result = $stmt->fetch();
        $count = $result['count'];
        $status = $count > 0 ? '✅ Has data' : '⚠️ Empty';
        echo "<tr><td>{$table}</td><td>{$count}</td><td>{$status}</td></tr>";
    } catch (PDOException $e) {
        echo "<tr><td>{$table}</td><td>-</td><td style='color:red;'>❌ Error: {$e->getMessage()}</td></tr>";
    }
}

echo "</table>";

// Test API endpoints
echo "<h2>Test API Endpoints:</h2>";
echo "<ul>";
echo "<li><a href='products.php'>Products API</a></li>";
echo "<li><a href='customers.php'>Customers API</a></li>";
echo "<li><a href='orders.php'>Sales Orders API</a></li>";
echo "<li><a href='purchase-orders.php'>Purchase Orders API</a></li>";
echo "<li><a href='suppliers.php'>Suppliers API</a></li>";
echo "</ul>";

echo "<h2>Sample Data:</h2>";

// Show some sample data
echo "<h3>Products (first 5):</h3>";
try {
    $stmt = $pdo->query("SELECT product_id, sku, name, brand, category, retail_price FROM Product LIMIT 5");
    $products = $stmt->fetchAll();
    echo "<pre>" . print_r($products, true) . "</pre>";
} catch (PDOException $e) {
    echo "<p style='color:red;'>Error: {$e->getMessage()}</p>";
}

echo "<h3>Suppliers:</h3>";
try {
    $stmt = $pdo->query("SELECT supplier_id, name, contact_person, email FROM Supplier");
    $suppliers = $stmt->fetchAll();
    echo "<pre>" . print_r($suppliers, true) . "</pre>";
} catch (PDOException $e) {
    echo "<p style='color:red;'>Error: {$e->getMessage()}</p>";
}

echo "<h3>Purchase Orders:</h3>";
try {
    $stmt = $pdo->query("SELECT po_id, po_number, supplier_id, total_amount, status FROM Purchase_Order");
    $pos = $stmt->fetchAll();
    echo "<pre>" . print_r($pos, true) . "</pre>";
} catch (PDOException $e) {
    echo "<p style='color:red;'>Error: {$e->getMessage()}</p>";
}
?>

