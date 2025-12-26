<?php
/**
 * Summit Gear & Adventures - API Documentation
 * 
 * This file provides an overview of all available API endpoints
 */

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Summit Gear API Documentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: #f5f7fa;
            padding: 2rem;
            line-height: 1.6;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #1F2937; margin-bottom: 1rem; }
        h2 { color: #374151; margin: 2rem 0 1rem; border-bottom: 2px solid #E5E7EB; padding-bottom: 0.5rem; }
        h3 { color: #4B5563; margin: 1rem 0 0.5rem; }
        .intro { background: white; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 2rem; }
        .endpoint-group { background: white; padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1rem; }
        .endpoint {
            background: #F9FAFB;
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 0.5rem 0;
            border-left: 4px solid #7C3AED;
        }
        .method {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-weight: bold;
            font-size: 0.8rem;
            margin-right: 0.5rem;
        }
        .method.get { background: #10B981; color: white; }
        .method.post { background: #3B82F6; color: white; }
        .method.put { background: #F59E0B; color: white; }
        .method.delete { background: #EF4444; color: white; }
        .path { font-family: monospace; color: #1F2937; }
        .description { color: #6B7280; margin-top: 0.5rem; font-size: 0.9rem; }
        code {
            background: #E5E7EB;
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-size: 0.85rem;
        }
        pre {
            background: #1F2937;
            color: #F9FAFB;
            padding: 1rem;
            border-radius: 0.5rem;
            overflow-x: auto;
            margin: 0.5rem 0;
        }
        .status { color: #10B981; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏔️ Summit Gear & Adventures - API Documentation</h1>
        
        <div class="intro">
            <p><strong>Base URL:</strong> <code><?php echo (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/api'; ?></code></p>
            <p><strong>Status:</strong> <span class="status">✅ Online</span></p>
            <p><strong>Version:</strong> 1.0.0</p>
            <p style="margin-top: 1rem;">All responses are in JSON format with the following structure:</p>
            <pre>{
    "success": true/false,
    "message": "Response message",
    "data": { ... },
    "timestamp": "2025-12-17 10:30:00"
}</pre>
        </div>
        
        <h2>🔐 Authentication</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/login.php</span>
                <p class="description">Login for all user types (customer, staff, admin, supplier)</p>
                <pre>Body: { "email": "user@email.com", "password": "pass123", "user_type": "customer" }</pre>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/auth/register.php</span>
                <p class="description">Register new customer account (includes 100 welcome bonus points)</p>
                <pre>Body: { "name": "John Doe", "email": "john@email.com", "password": "pass123", "phone": "07123456789" }</pre>
            </div>
        </div>
        
        <h2>📦 Products</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/products/list.php</span>
                <p class="description">Get products list with filtering and pagination. Uses <code>v_customer_products</code> view.</p>
                <pre>Params: ?category=Camping&brand=&search=tent&min_price=0&max_price=500&in_stock=true&page=1&limit=20</pre>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/products/detail.php</span>
                <p class="description">Get single product details with stock by branch</p>
                <pre>Params: ?id=1</pre>
            </div>
        </div>
        
        <h2>🛒 Orders</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/orders/customer_orders.php</span>
                <p class="description">Get customer order history. Uses <code>v_customer_orders</code> view.</p>
                <pre>Params: ?customer_id=1</pre>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/orders/create.php</span>
                <p class="description">Create new sales order with items, calculates discounts and points</p>
                <pre>Body: {
    "customer_id": 1,
    "employee_id": 2,
    "branch_id": 1,
    "payment_method": "Card",
    "use_points": 0,
    "items": [{"product_id": 1, "quantity": 2}]
}</pre>
            </div>
        </div>
        
        <h2>📊 Inventory (Staff)</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/inventory/list.php</span>
                <p class="description">Get branch inventory. Uses <code>v_staff_inventory</code> and <code>v_low_stock_alert</code> views.</p>
                <pre>Params: ?branch_id=1&category=&status=In Stock&search=</pre>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/inventory/stock_in.php</span>
                <p class="description">Add new stock (receiving goods). Creates StockItem record.</p>
                <pre>Body: {
    "product_id": 1,
    "branch_id": 1,
    "quantity": 50,
    "purchase_order_id": 3,
    "location": "A-01-01",
    "unit_cost": 180.00,
    "batch_no": "BSG_20241217_001"
}</pre>
            </div>
        </div>
        
        <h2>🏭 Supplier</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/supplier/orders.php</span>
                <p class="description">Get purchase orders for supplier. Uses <code>v_supplier_orders</code> view.</p>
                <pre>Params: ?supplier_id=1&status=Pending</pre>
            </div>
            <div class="endpoint">
                <span class="method put">PUT</span>
                <span class="path">/supplier/update_order.php</span>
                <p class="description">Update purchase order status (Confirm, Ship, Cancel)</p>
                <pre>Body: { "po_id": 3, "supplier_id": 4, "status": "Confirmed", "expected_date": "2024-12-25" }</pre>
            </div>
        </div>
        
        <h2>👑 Admin</h2>
        <div class="endpoint-group">
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/admin/dashboard.php</span>
                <p class="description">Get dashboard statistics. Uses multiple views including <code>v_advanced_product_ranking</code>.</p>
                <pre>Params: ?branch_id=1&range=today (today|week|month)</pre>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/admin/employees.php</span>
                <p class="description">List employees. Uses <code>v_hr_employees</code> view.</p>
                <pre>Params: ?branch_id=1&position=Sales Staff</pre>
            </div>
            <div class="endpoint">
                <span class="method post">POST</span>
                <span class="path">/admin/employees.php</span>
                <p class="description">Create new employee</p>
            </div>
            <div class="endpoint">
                <span class="method put">PUT</span>
                <span class="path">/admin/employees.php</span>
                <p class="description">Update employee</p>
            </div>
            <div class="endpoint">
                <span class="method get">GET</span>
                <span class="path">/admin/customers.php</span>
                <p class="description">List customers. Uses <code>v_customer_membership</code> and <code>v_advanced_top_customers</code> views.</p>
                <pre>Params: ?membership=Gold&search=james&page=1&limit=20</pre>
            </div>
        </div>
        
        <h2>📚 Database Views Used</h2>
        <div class="endpoint-group">
            <ul style="list-style: none;">
                <li>✅ <code>v_customer_products</code> - Products visible to customers with stock status</li>
                <li>✅ <code>v_customer_orders</code> - Customer order history</li>
                <li>✅ <code>v_staff_inventory</code> - Detailed inventory for staff</li>
                <li>✅ <code>v_branch_stock</code> - Aggregated stock by branch</li>
                <li>✅ <code>v_supplier_orders</code> - Orders visible to suppliers</li>
                <li>✅ <code>v_supplier_order_items</code> - Order items for suppliers</li>
                <li>✅ <code>v_admin_sales_dashboard</code> - Sales dashboard data</li>
                <li>✅ <code>v_hr_employees</code> - Employee information for HR</li>
                <li>✅ <code>v_low_stock_alert</code> - Low stock warnings</li>
                <li>✅ <code>v_customer_membership</code> - Customer membership details</li>
                <li>⭐ <code>v_advanced_product_ranking</code> - Advanced SQL with CTE + Window Functions</li>
                <li>⭐ <code>v_advanced_top_customers</code> - Advanced SQL with Correlated Subqueries</li>
                <li>⭐ <code>v_advanced_inventory_turnover</code> - Advanced SQL with Complex JOINs</li>
            </ul>
        </div>
        
        <h2>🔧 JavaScript Client</h2>
        <div class="endpoint-group">
            <p>Include the JavaScript API client in your HTML pages:</p>
            <pre>&lt;script src="/api/js/api-client.js"&gt;&lt;/script&gt;

// Usage examples:
const result = await SummitGearAPI.Auth.login('email@example.com', 'password', 'customer');
const products = await SummitGearAPI.Products.getList({ category: 'Camping' });
const order = await SummitGearAPI.Orders.create({ customer_id: 1, items: [...] });</pre>
        </div>
        
        <div style="text-align: center; margin-top: 2rem; color: #6B7280;">
            <p>© 2025 Summit Gear & Adventures. All rights reserved.</p>
            <p>API Version 1.0.0</p>
        </div>
    </div>
</body>
</html>

