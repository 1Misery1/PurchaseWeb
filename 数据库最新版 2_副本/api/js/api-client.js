/**
 * Summit Gear & Adventures - API Client
 * 
 * JavaScript client for communicating with the PHP backend API
 * Include this file in your HTML pages to access the database
 */

const SummitGearAPI = (function() {
    // API base URL - UPDATE THIS WHEN DEPLOYING TO AWS
    const API_BASE_URL = '/api';
    
    // Store current user session
    let currentUser = null;
    let authToken = null;
    
    // Initialize from localStorage
    function init() {
        const savedUser = localStorage.getItem('summitGearUser');
        const savedToken = localStorage.getItem('summitGearToken');
        if (savedUser && savedToken) {
            currentUser = JSON.parse(savedUser);
            authToken = savedToken;
        }
    }
    
    /**
     * Make API request
     */
    async function request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        if (options.body) {
            config.body = JSON.stringify(options.body);
        }
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'API request failed');
            }
            
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
    
    // ==================== AUTH APIs ====================
    
    const Auth = {
        /**
         * Login user
         * @param {string} email 
         * @param {string} password 
         * @param {string} userType - 'customer', 'staff', 'admin', 'supplier'
         */
        async login(email, password, userType = 'customer') {
            const result = await request('/auth/login.php', {
                method: 'POST',
                body: { email, password, user_type: userType }
            });
            
            if (result.success && result.data) {
                currentUser = result.data;
                authToken = result.data.token;
                localStorage.setItem('summitGearUser', JSON.stringify(currentUser));
                localStorage.setItem('summitGearToken', authToken);
            }
            
            return result;
        },
        
        /**
         * Register new customer
         */
        async register(customerData) {
            return await request('/auth/register.php', {
                method: 'POST',
                body: customerData
            });
        },
        
        /**
         * Logout current user
         */
        logout() {
            currentUser = null;
            authToken = null;
            localStorage.removeItem('summitGearUser');
            localStorage.removeItem('summitGearToken');
        },
        
        /**
         * Get current user
         */
        getCurrentUser() {
            return currentUser;
        },
        
        /**
         * Check if user is logged in
         */
        isLoggedIn() {
            return currentUser !== null && authToken !== null;
        }
    };
    
    // ==================== PRODUCTS APIs ====================
    
    const Products = {
        /**
         * Get products list
         * @param {object} filters - { category, brand, search, min_price, max_price, in_stock, page, limit }
         */
        async getList(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return await request(`/products/list.php?${params}`);
        },
        
        /**
         * Get product details
         * @param {number} productId 
         */
        async getDetail(productId) {
            return await request(`/products/detail.php?id=${productId}`);
        }
    };
    
    // ==================== ORDERS APIs ====================
    
    const Orders = {
        /**
         * Get customer orders
         * @param {number} customerId 
         */
        async getCustomerOrders(customerId) {
            return await request(`/orders/customer_orders.php?customer_id=${customerId}`);
        },
        
        /**
         * Create new order
         * @param {object} orderData - { customer_id, items: [{product_id, quantity}], payment_method, use_points }
         */
        async create(orderData) {
            return await request('/orders/create.php', {
                method: 'POST',
                body: orderData
            });
        }
    };
    
    // ==================== INVENTORY APIs ====================
    
    const Inventory = {
        /**
         * Get inventory for a branch
         * @param {number} branchId 
         * @param {object} filters - { category, status, search }
         */
        async getList(branchId, filters = {}) {
            const params = new URLSearchParams({ branch_id: branchId, ...filters }).toString();
            return await request(`/inventory/list.php?${params}`);
        },
        
        /**
         * Stock in - add new stock
         * @param {object} stockData - { product_id, branch_id, quantity, purchase_order_id, location, unit_cost, batch_no }
         */
        async stockIn(stockData) {
            return await request('/inventory/stock_in.php', {
                method: 'POST',
                body: stockData
            });
        }
    };
    
    // ==================== SUPPLIER APIs ====================
    
    const Supplier = {
        /**
         * Get supplier orders
         * @param {number} supplierId 
         * @param {string} status - optional filter
         */
        async getOrders(supplierId, status = '') {
            let url = `/supplier/orders.php?supplier_id=${supplierId}`;
            if (status) url += `&status=${status}`;
            return await request(url);
        },
        
        /**
         * Update order status
         * @param {number} poId 
         * @param {number} supplierId 
         * @param {string} status - 'Confirmed', 'Shipped', 'Cancelled'
         * @param {string} expectedDate - optional
         */
        async updateOrderStatus(poId, supplierId, status, expectedDate = '') {
            return await request('/supplier/update_order.php', {
                method: 'PUT',
                body: { po_id: poId, supplier_id: supplierId, status, expected_date: expectedDate }
            });
        }
    };
    
    // ==================== ADMIN APIs ====================
    
    const Admin = {
        /**
         * Get dashboard data
         * @param {number} branchId - optional, 0 for all branches
         * @param {string} range - 'today', 'week', 'month'
         */
        async getDashboard(branchId = 0, range = 'today') {
            return await request(`/admin/dashboard.php?branch_id=${branchId}&range=${range}`);
        },
        
        /**
         * Get employees list
         * @param {number} branchId - optional
         * @param {string} position - optional
         */
        async getEmployees(branchId = 0, position = '') {
            let url = '/admin/employees.php?';
            if (branchId > 0) url += `branch_id=${branchId}&`;
            if (position) url += `position=${position}`;
            return await request(url);
        },
        
        /**
         * Create employee
         * @param {object} employeeData 
         */
        async createEmployee(employeeData) {
            return await request('/admin/employees.php', {
                method: 'POST',
                body: employeeData
            });
        },
        
        /**
         * Update employee
         * @param {object} employeeData - must include employee_id
         */
        async updateEmployee(employeeData) {
            return await request('/admin/employees.php', {
                method: 'PUT',
                body: employeeData
            });
        },
        
        /**
         * Get customers list
         * @param {object} filters - { membership, search, page, limit }
         */
        async getCustomers(filters = {}) {
            const params = new URLSearchParams(filters).toString();
            return await request(`/admin/customers.php?${params}`);
        },
        
        /**
         * Update customer
         * @param {object} customerData - must include customer_id
         */
        async updateCustomer(customerData) {
            return await request('/admin/customers.php', {
                method: 'PUT',
                body: customerData
            });
        }
    };
    
    // Initialize on load
    init();
    
    // Public API
    return {
        Auth,
        Products,
        Orders,
        Inventory,
        Supplier,
        Admin,
        // Utility
        setApiBaseUrl(url) {
            API_BASE_URL = url;
        }
    };
})();

// Make it globally available
window.SummitGearAPI = SummitGearAPI;

// Usage examples:
/*
// Login
const result = await SummitGearAPI.Auth.login('james.wilson@email.com', 'password123', 'customer');

// Get products
const products = await SummitGearAPI.Products.getList({ category: 'Camping', page: 1 });

// Create order
const order = await SummitGearAPI.Orders.create({
    customer_id: 1,
    items: [{ product_id: 1, quantity: 2 }],
    payment_method: 'Card'
});

// Stock in
const stock = await SummitGearAPI.Inventory.stockIn({
    product_id: 1,
    branch_id: 1,
    quantity: 50,
    location: 'A-01-01'
});
*/

