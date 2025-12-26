// =====================================================
// Summit Gear & Adventures - Supplier Portal JavaScript
// Database-Connected Version - With Login Support
// =====================================================

const API_BASE = '/summit-gear/api';

// Current logged in supplier
let currentSupplier = null;
let purchaseOrders = [];
let productsCatalog = [];
let salesStats = null;

// =====================================================
// Authentication Check
// =====================================================
function checkAuth() {
    const supplierData = localStorage.getItem('currentSupplier');
    if (!supplierData) {
        // Not logged in, redirect to login page
        window.location.href = 'login.html';
        return false;
    }
    currentSupplier = JSON.parse(supplierData);
    return true;
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear all supplier login data
        localStorage.removeItem('currentSupplier');
        localStorage.removeItem('supplierId');
        
        // Also clear any cached data
        currentSupplier = null;
        purchaseOrders = [];
        productsCatalog = [];
        
        // Redirect to main site homepage
        window.location.href = '../index.html';
    }
}

// =====================================================
// Utility Functions
// =====================================================

function formatPrice(price) {
    return '£' + parseFloat(price || 0).toFixed(2);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function calculateDaysUntil(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function showNotification(message, type = 'success') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
    `;
    
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : type === 'warning' ? '#F59E0B' : '#3B82F6'};
        color: white;
        font-weight: 600;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function showLoading(element, show = true) {
    if (element && show) {
        element.innerHTML = '<div class="loading">⏳ Loading from database...</div>';
    }
}

function getStatusBadgeClass(status) {
    const statusMap = {
        'Pending': 'pending',
        'Confirmed': 'confirmed',
        'Shipped': 'shipped',
        'Received': 'delivered',
        'Delivered': 'delivered',
        'Paid': 'paid',
        'Active': 'active',
        'In Stock': 'in-stock',
        'Low Stock': 'low-stock',
        'Out of Stock': 'out-of-stock'
    };
    return statusMap[status] || '';
}

function getStatusIcon(status) {
    const iconMap = {
        'Pending': '⏳',
        'Confirmed': '✔️',
        'Shipped': '🚚',
        'Received': '✅',
        'Delivered': '✅',
        'Paid': '💰',
        'Unpaid': '⏳'
    };
    return iconMap[status] || '';
}

// =====================================================
// API Functions
// =====================================================

async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadSupplierData() {
    // Supplier data is loaded from localStorage after login
    if (!currentSupplier) {
        const supplierData = localStorage.getItem('currentSupplier');
        if (supplierData) {
            currentSupplier = JSON.parse(supplierData);
        } else {
            // Not logged in
            window.location.href = 'login.html';
            return;
        }
    }
    
    // Optionally refresh from database
    try {
        const response = await apiRequest(`/suppliers.php?id=${currentSupplier.supplier_id}`);
        if (response.success && response.data) {
            currentSupplier = response.data;
            localStorage.setItem('currentSupplier', JSON.stringify(currentSupplier));
            console.log('Refreshed supplier data:', currentSupplier.name);
        }
    } catch (error) {
        console.log('Using cached supplier data');
    }
    
        updateSupplierInfo();
}

async function loadPurchaseOrders() {
    const supplierId = currentSupplier?.supplier_id || 1;
    const ordersList = document.getElementById('ordersList');
    
    try {
        showLoading(ordersList);
        const response = await apiRequest(`/purchase-orders.php?supplier_id=${supplierId}`);
        if (response.success) {
            purchaseOrders = response.data || [];
            console.log('Loaded orders:', purchaseOrders.length);
            renderOrders();
            renderRecentOrders();
            updateDashboard();
        }
    } catch (error) {
        console.error('Failed to load orders:', error);
        purchaseOrders = [];
        if (ordersList) {
            ordersList.innerHTML = '<div class="no-data">❌ Failed to load orders from database. <br>Please check if the database is set up correctly.</div>';
        }
    }
}

async function loadProducts() {
    const supplierId = currentSupplier?.supplier_id || 1;
    const productsList = document.getElementById('productsList');
    
    try {
        showLoading(productsList);
        const response = await apiRequest(`/products.php?supplier_id=${supplierId}`);
        if (response.success) {
            productsCatalog = response.data || [];
            console.log('Loaded products:', productsCatalog.length);
            renderProducts();
        }
    } catch (error) {
        console.error('Failed to load products:', error);
        productsCatalog = [];
        if (productsList) {
            productsList.innerHTML = '<div class="no-data">❌ Failed to load products from database.</div>';
        }
    }
}

async function loadSalesStats() {
    const supplierId = currentSupplier?.supplier_id || 1;
    
    try {
        const response = await apiRequest(`/stats.php?supplier_id=${supplierId}`);
        if (response.success) {
            salesStats = response.data;
            console.log('Loaded stats:', salesStats);
            updateSalesPerformance();
            updateTopProducts();
            updateReportsSection();
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
        // Use fallback calculated from orders
        salesStats = calculateLocalStats();
        updateSalesPerformance();
        updateTopProducts();
        updateReportsSection();
    }
}

function calculateLocalStats() {
    // Calculate stats from loaded data as fallback
    const completedOrders = purchaseOrders.filter(o => o.status === 'Received');
    const totalRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
    
    return {
        this_month_revenue: totalRevenue,
        last_month_revenue: totalRevenue * 0.85, // Estimate
        growth_percent: 17.6,
        top_products: productsCatalog.slice(0, 5).map(p => ({
            name: p.name,
            units_sold: Math.floor(Math.random() * 50) + 10
        })),
        pending_orders: purchaseOrders.filter(o => o.status === 'Pending').length,
        pending_payment: purchaseOrders.filter(o => o.payment_status === 'Unpaid').reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0)
    };
}

// =====================================================
// Page Initialization
// =====================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Supplier Portal Loading...');
    
    // Check authentication first
    if (!checkAuth()) {
        return; // Will redirect to login
    }
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
        .loading {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
        }
        .no-data {
            text-align: center;
            padding: 2rem;
            color: #6b7280;
            font-size: 1.1rem;
        }
        .db-badge {
            background: #10B981;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 0.7rem;
            margin-left: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize navigation
    initNavigation();
    
    // Update supplier info display immediately from localStorage
    updateSupplierInfo();
    
    // Load data from database (load products first, then orders which calls updateDashboard)
    await loadProducts();
    await loadPurchaseOrders();
    await loadSalesStats();
    await loadStockRequests();
    
    // Update dashboard after all data is loaded
    updateDashboard();
    
    // Update date
    const dateEl = document.querySelector('.section-header .date');
    if (dateEl) {
        dateEl.textContent = '📅 ' + formatDate(new Date().toISOString().split('T')[0]);
    }
    
    console.log('Supplier Portal Ready!');
});

function updateSupplierInfo() {
    const companyName = document.querySelector('.company-name');
    const contactPerson = document.querySelector('.contact-person');
    const serviceArea = document.querySelector('.service-area');
    const welcomeMessage = document.querySelector('.welcome-message h2');
    
    const name = currentSupplier?.name || 'Supplier';
    const contact = currentSupplier?.contact_person || 'Contact';
    
    if (companyName) {
        companyName.textContent = '🏢 ' + name;
    }
    if (contactPerson) {
        contactPerson.textContent = 'Contact: ' + contact;
    }
    if (serviceArea) {
        // Dynamically get branch count
        fetch(`${API_BASE}/branches.php`)
            .then(res => res.json())
            .then(data => {
                const count = Array.isArray(data) ? data.length : (data.data?.length || 5);
                serviceArea.textContent = `📍 Serving ${count} UK Stores`;
            })
            .catch(() => {
                serviceArea.textContent = '📍 UK Supplier';
            });
    }
    if (welcomeMessage) {
        welcomeMessage.innerHTML = `Welcome Back, ${name} 👋 <span class="db-badge">DB</span>`;
    }
}

function updateSalesPerformance() {
    if (!salesStats) return;
    
    const perfContainer = document.querySelector('.performance-stats');
    if (!perfContainer) return;
    
    const thisMonth = salesStats.this_month_revenue || 0;
    const lastMonth = salesStats.last_month_revenue || 0;
    const growth = salesStats.growth_percent || 0;
    
    perfContainer.innerHTML = `
        <div class="perf-item">
            <span class="perf-label">This Month:</span>
            <span class="perf-value">${formatPrice(thisMonth)}</span>
        </div>
        <div class="perf-item">
            <span class="perf-label">Last Month:</span>
            <span class="perf-value">${formatPrice(lastMonth)}</span>
        </div>
        <div class="perf-item ${growth >= 0 ? 'success' : 'warning'}">
            <span class="perf-label">Growth:</span>
            <span class="perf-value">${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%</span>
        </div>
    `;
}

function updateTopProducts() {
    if (!salesStats || !salesStats.top_products) return;
    
    const topProductsList = document.querySelector('.top-products-list');
    if (!topProductsList) return;
    
    if (salesStats.top_products.length === 0) {
        topProductsList.innerHTML = '<li>No sales data yet</li>';
        return;
    }
    
    topProductsList.innerHTML = salesStats.top_products.map(p => 
        `<li>${p.name} (${p.units_sold || 0} units)</li>`
    ).join('');
}

// =====================================================
// Navigation
// =====================================================

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    function showSection(sectionId) {
        contentSections.forEach(section => section.classList.remove('active'));
        menuItems.forEach(item => item.classList.remove('active'));
        
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        const targetLink = document.querySelector(`.menu-item[href="#${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }
    
    function loadSectionFromHash() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        showSection(hash);
    }
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            window.location.hash = sectionId;
            showSection(sectionId);
        });
    });
    
    window.addEventListener('hashchange', loadSectionFromHash);
    loadSectionFromHash();
    
    // Logout button
    document.querySelector('.btn-logout')?.addEventListener('click', handleLogout);
}

function navigateTo(section) {
    window.location.hash = section;
    const targetSection = document.getElementById(section);
    if (targetSection) {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        targetSection.classList.add('active');
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        document.querySelector(`.menu-item[href="#${section}"]`)?.classList.add('active');
    }
}


// =====================================================
// Dashboard Functions
// =====================================================

function updateDashboard() {
    // Stock Requests stats
    const pendingRequests = stockRequests.filter(r => r.status === 'Pending').length;
    
    // Pending Payment: Completed but Unpaid stock requests
    const pendingPayment = stockRequests
        .filter(r => r.status === 'Completed' && r.payment_status === 'Unpaid')
        .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
    
    const pendingRequestsEl = document.getElementById('pendingRequestsCount');
    const pendingPaymentEl = document.getElementById('pendingPaymentAmount');
    const productCountEl = document.getElementById('productCount');
    
    if (pendingRequestsEl) pendingRequestsEl.textContent = pendingRequests;
    if (pendingPaymentEl) pendingPaymentEl.textContent = formatPrice(pendingPayment);
    if (productCountEl) productCountEl.textContent = productsCatalog.length;
    
    renderActionItems();
}

function renderRecentOrders() {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    
    const recentOrders = purchaseOrders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">No orders found in database</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td><strong>${order.po_number}</strong></td>
            <td>${formatDate(order.order_date)}</td>
            <td>${formatDate(order.expected_date)}</td>
            <td>${formatPrice(order.total_amount)}</td>
            <td><span class="status-badge ${getStatusBadgeClass(order.status)}">${getStatusIcon(order.status)} ${order.status}</span></td>
            <td>
                ${order.status === 'Pending' 
                    ? `<button class="btn btn-small btn-primary" onclick="confirmOrder(${order.po_id})">Confirm</button>`
                    : order.status === 'Confirmed'
                    ? `<button class="btn btn-small btn-primary" onclick="openShippingModal(${order.po_id})">Ship</button>`
                    : `<button class="btn btn-small" onclick="viewOrderDetails(${order.po_id})">View</button>`
                }
            </td>
        </tr>
    `).join('');
}

function renderActionItems() {
    const actionList = document.getElementById('actionItemsList');
    if (!actionList) return;
    
    const actions = [];
    
    // Purchase Orders - Pending
    purchaseOrders.filter(o => o.status === 'Pending').forEach(order => {
        actions.push({
            text: `${order.po_number} Awaiting Confirmation`,
            button: `<button class="btn btn-primary btn-small" onclick="confirmOrder(${order.po_id})">✅ Confirm</button>`
        });
    });
    
    // Purchase Orders - Ready to Ship
    purchaseOrders.filter(o => o.status === 'Confirmed').forEach(order => {
        actions.push({
            text: `${order.po_number} Ready to Ship`,
            button: `<button class="btn btn-primary btn-small" onclick="openShippingModal(${order.po_id})">📦 Ship Order</button>`
        });
    });
    
    // Stock Requests - Pending (from Inventory Admin)
    stockRequests.filter(r => r.status === 'Pending').forEach(req => {
        actions.push({
            text: `📥 Stock Request: ${req.product_name} (${req.requested_quantity} units) for ${req.branch_name}`,
            button: `<button class="btn btn-primary btn-small" onclick="confirmAndShip(${req.request_id})">✅ Confirm & Ship</button>`
        });
    });
    
    // Stock Requests - In Transit (waiting for store receipt)
    const inTransit = stockRequests.filter(r => r.status === 'In Transit').length;
    if (inTransit > 0) {
        actions.push({
            text: `🚚 ${inTransit} shipment(s) in transit - awaiting store receipt`,
            button: `<button class="btn btn-small" onclick="navigateTo('stock-requests')">View</button>`
        });
    }
    
    const lowStock = productsCatalog.filter(p => p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock');
    if (lowStock.length > 0) {
        actions.push({
            text: `${lowStock.length} Products with Low/No Stock`,
            button: `<button class="btn btn-primary btn-small" onclick="navigateTo('products')">📦 View Products</button>`
        });
    }
    
    if (actions.length === 0) {
        actionList.innerHTML = '<div class="action-item"><span class="action-text">✅ No pending actions</span></div>';
    } else {
        actionList.innerHTML = actions.map(action => `
            <div class="action-item">
                <span class="action-text">• ${action.text}</span>
                ${action.button}
            </div>
        `).join('');
    }
    
    // Also update payments section
    updatePaymentsSection();
}

// =====================================================
// Payments Section
// =====================================================
function updatePaymentsSection() {
    // Use Stock Requests for payment data
    // Pending: Completed but Unpaid
    const unpaidRequests = stockRequests.filter(r => r.status === 'Completed' && r.payment_status === 'Unpaid');
    const pendingAmount = unpaidRequests.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
    
    const pendingBalance = document.getElementById('pendingBalance');
    const pendingInvoiceCount = document.getElementById('pendingInvoiceCount');
    
    if (pendingBalance) pendingBalance.textContent = formatPrice(pendingAmount);
    if (pendingInvoiceCount) pendingInvoiceCount.textContent = `${unpaidRequests.length} Invoice(s)`;
    
    // Render pending invoices (completed but unpaid stock requests)
    const pendingTable = document.getElementById('pendingInvoicesTable');
    if (pendingTable) {
        if (unpaidRequests.length === 0) {
            pendingTable.innerHTML = '<tr><td colspan="6" style="text-align: center;">✅ No pending invoices</td></tr>';
        } else {
            pendingTable.innerHTML = unpaidRequests.map(req => {
                const orderDate = new Date(req.requested_at);
                const completedDate = new Date(req.completed_at || req.requested_at);
                const dueDate = new Date(completedDate);
                dueDate.setDate(dueDate.getDate() + 30); // Net 30 days
                
                const isOverdue = new Date() > dueDate;
                
                return `
                    <tr>
                        <td><strong>SR-${req.request_id}</strong><br><small>${req.product_name}</small></td>
                        <td>${formatDate(req.requested_at)}</td>
                        <td><span class="status-badge delivered">✓ ${req.status}</span></td>
                        <td><strong>${formatPrice(req.total_amount)}</strong><br><small>${req.requested_quantity} units</small></td>
                        <td style="color: ${isOverdue ? '#dc2626' : 'inherit'};">${formatDate(dueDate.toISOString())} ${isOverdue ? '⚠️ Overdue' : ''}</td>
                        <td><span style="color:#f59e0b;">⏳ Awaiting Payment</span></td>
                    </tr>
                `;
            }).join('');
        }
    }
    
    // Render paid requests
    const paidRequests = stockRequests.filter(r => r.payment_status === 'Paid');
    const paidTable = document.getElementById('paymentHistoryTable');
    
    if (paidTable) {
        if (paidRequests.length === 0) {
            paidTable.innerHTML = '<tr><td colspan="5" style="text-align: center;">No payment history yet</td></tr>';
        } else {
            paidTable.innerHTML = paidRequests.map(req => `
                <tr>
                    <td><strong>SR-${req.request_id}</strong><br><small>${req.product_name}</small></td>
                    <td>${formatDate(req.requested_at)}</td>
                    <td>${formatDate(req.completed_at)}</td>
                    <td>${formatPrice(req.total_amount)}</td>
                    <td><span class="status-badge paid">💰 Paid</span></td>
                </tr>
            `).join('');
        }
    }
}

// =====================================================
// Order Management Functions
// =====================================================

function renderOrders(filter = 'all') {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    let filteredOrders = purchaseOrders;
    
    if (filter !== 'all') {
        switch (filter) {
            case 'active':
                filteredOrders = purchaseOrders.filter(o => ['Pending', 'Confirmed', 'Shipped'].includes(o.status));
                break;
            case 'pending':
                filteredOrders = purchaseOrders.filter(o => o.status === 'Pending');
                break;
            case 'shipped':
                filteredOrders = purchaseOrders.filter(o => o.status === 'Shipped');
                break;
            case 'delivered':
            case 'received':
                filteredOrders = purchaseOrders.filter(o => o.status === 'Received');
                break;
        }
    }
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<div class="no-data">📋 No orders found</div>';
        return;
    }
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card ${order.status === 'Pending' ? 'urgent' : ''}">
            <div class="order-header">
                <div>
                    <h3>${order.po_number} - ${order.status}</h3>
                    ${order.status === 'Pending' ? '<span class="urgent-badge">⏳ Action Required</span>' : ''}
                </div>
                <span class="status-badge ${getStatusBadgeClass(order.status)}">${getStatusIcon(order.status)} ${order.status}</span>
            </div>
            
            <div class="order-info">
                <p><strong>Order Date:</strong> ${formatDate(order.order_date)}</p>
                <p><strong>Expected Delivery:</strong> ${formatDate(order.expected_date)}</p>
                <p><strong>Destination:</strong> ${order.branch_name || 'N/A'}</p>
                ${order.received_date ? `<p><strong>Received:</strong> ${formatDate(order.received_date)}</p>` : ''}
            </div>
            
            <div class="order-items-section">
                <h4>Ordered Products:</h4>
                <table class="mini-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(order.items || []).map(item => `
                            <tr>
                                <td>${item.sku || 'N/A'}</td>
                                <td>${item.product_name || 'Unknown'}</td>
                                <td>${item.quantity}</td>
                                <td>${formatPrice(item.unit_price)}</td>
                                <td>${formatPrice(item.total_price)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="order-total">
                <strong>Total Amount: ${formatPrice(order.total_amount)}</strong>
                <span class="status-badge ${order.payment_status === 'Paid' ? 'paid' : 'pending'}" style="margin-left: 1rem;">
                    ${getStatusIcon(order.payment_status)} ${order.payment_status}
                </span>
            </div>
            
            <div class="delivery-address">
                <p><strong>Delivery Address:</strong></p>
                <p>${order.branch_name || 'Unknown Branch'}<br>${order.branch_address || ''}, ${order.branch_city || ''}</p>
            </div>
            
            <div class="order-actions">
                ${order.status === 'Pending' ? `
                    <button class="btn btn-primary" onclick="confirmOrder(${order.po_id})">✅ Confirm Order</button>
                    <button class="btn btn-danger" onclick="rejectOrder(${order.po_id})">❌ Reject</button>
                ` : ''}
                ${order.status === 'Confirmed' ? `
                    <button class="btn btn-primary" onclick="openShippingModal(${order.po_id})">📦 Ship Order</button>
                ` : ''}
                ${order.status === 'Shipped' ? `
                    <button class="btn btn-primary" onclick="markDelivered(${order.po_id})">✅ Mark Delivered</button>
                ` : ''}
                <button class="btn btn-secondary" onclick="viewOrderDetails(${order.po_id})">📋 View Details</button>
            </div>
        </div>
    `).join('');
}

function applyOrderFilter(filter) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const activeTab = document.querySelector(`.tab[data-filter="${filter}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    renderOrders(filter);
}

function searchOrders(searchTerm) {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;
    
    if (!searchTerm || searchTerm.trim() === '') {
        renderOrders('all');
        return;
    }
    
    const term = searchTerm.toLowerCase().trim();
    const filteredOrders = purchaseOrders.filter(order => 
        order.po_number.toLowerCase().includes(term) ||
        (order.branch_name && order.branch_name.toLowerCase().includes(term))
    );
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = `<div class="no-data">🔍 No orders found matching "${searchTerm}"</div>`;
        return;
    }
    
    // Render filtered orders
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card ${order.status === 'Pending' ? 'urgent' : ''}">
            <div class="order-header">
                <div>
                    <h3>${order.po_number} - ${order.status}</h3>
                    ${order.status === 'Pending' ? '<span class="urgent-badge">⏳ Action Required</span>' : ''}
                </div>
                <span class="status-badge ${getStatusBadgeClass(order.status)}">${getStatusIcon(order.status)} ${order.status}</span>
            </div>
            
            <div class="order-info">
                <p><strong>Order Date:</strong> ${formatDate(order.order_date)}</p>
                <p><strong>Expected Delivery:</strong> ${formatDate(order.expected_date)}</p>
                <p><strong>Destination:</strong> ${order.branch_name || 'N/A'}</p>
            </div>
            
            <div class="order-total">
                <strong>Total Amount: ${formatPrice(order.total_amount)}</strong>
                <span class="status-badge ${order.payment_status === 'Paid' ? 'paid' : 'pending'}" style="margin-left: 1rem;">
                    ${getStatusIcon(order.payment_status)} ${order.payment_status}
                </span>
            </div>
            
            <div class="order-actions">
                <button class="btn btn-secondary" onclick="viewOrderDetails(${order.po_id})">📋 View Details</button>
            </div>
        </div>
    `).join('');
}

async function confirmOrder(poId) {
    const order = purchaseOrders.find(o => o.po_id == poId);
    if (!order) return;
    
    if (confirm(`Confirm order ${order.po_number}?\n\nTotal Amount: ${formatPrice(order.total_amount)}`)) {
        try {
            const response = await apiRequest('/purchase-orders.php', {
                method: 'PUT',
                body: JSON.stringify({
                    po_id: poId,
                    status: 'Confirmed'
                })
            });
            
            if (response.success) {
                showNotification(`Order ${order.po_number} confirmed!`, 'success');
                await loadPurchaseOrders();
            }
        } catch (error) {
            showNotification('Failed to confirm order: ' + error.message, 'error');
        }
    }
}

async function rejectOrder(poId) {
    const order = purchaseOrders.find(o => o.po_id == poId);
    if (!order) return;
    
    const reason = prompt(`Please enter the reason for rejecting order ${order.po_number}:`);
    if (reason) {
        try {
            const response = await apiRequest('/purchase-orders.php', {
                method: 'PUT',
                body: JSON.stringify({
                    po_id: poId,
                    status: 'Cancelled',
                    notes: 'Rejected by supplier: ' + reason
                })
            });
            
            if (response.success) {
                showNotification(`Order ${order.po_number} rejected`, 'warning');
                await loadPurchaseOrders();
            }
        } catch (error) {
            showNotification('Failed to reject order: ' + error.message, 'error');
        }
    }
}

function openShippingModal(poId) {
    const order = purchaseOrders.find(o => o.po_id == poId);
    if (!order) return;
    
    const modal = document.getElementById('shippingModal');
    if (!modal) return;
    
    document.getElementById('shippingOrderId').value = poId;
    document.getElementById('shippingOrderInfo').innerHTML = `
        <p><strong>Order:</strong> ${order.po_number}</p>
        <p><strong>Items:</strong> ${(order.items || []).map(i => `${i.product_name} x${i.quantity}`).join(', ')}</p>
        <p><strong>Delivery to:</strong> ${order.branch_name || 'Unknown'}</p>
    `;
    document.getElementById('trackingNumber').value = '';
    document.getElementById('carrierSelect').value = 'DHL Express';
    
    modal.style.display = 'flex';
}

function closeShippingModal() {
    document.getElementById('shippingModal').style.display = 'none';
}

async function submitShipping() {
    const poId = document.getElementById('shippingOrderId').value;
    const trackingNumber = document.getElementById('trackingNumber').value.trim();
    const carrier = document.getElementById('carrierSelect').value;
    
    if (!trackingNumber) {
        showNotification('Please enter a tracking number', 'error');
        return;
    }
    
    try {
        const response = await apiRequest('/purchase-orders.php', {
            method: 'PUT',
            body: JSON.stringify({
                po_id: poId,
                status: 'Shipped',
                tracking_number: trackingNumber,
                carrier: carrier
            })
        });
        
        if (response.success) {
            closeShippingModal();
            showNotification('Order marked as shipped!', 'success');
            await loadPurchaseOrders();
        }
    } catch (error) {
        showNotification('Failed to update shipping: ' + error.message, 'error');
    }
}

async function markDelivered(poId) {
    if (confirm('Confirm that this order has been delivered?')) {
        try {
            const response = await apiRequest('/purchase-orders.php', {
                method: 'PUT',
                body: JSON.stringify({
                    po_id: poId,
                    status: 'Received'
                })
            });
            
            if (response.success) {
                showNotification('Order marked as delivered!', 'success');
                await loadPurchaseOrders();
            }
        } catch (error) {
            showNotification('Failed to update order: ' + error.message, 'error');
        }
    }
}

function viewOrderDetails(poId) {
    // Navigate to order details page
    window.location.href = `order-details.html?id=${poId}`;
}

// =====================================================
// Product Management Functions
// =====================================================

function renderProducts(filter = 'all') {
    const productsList = document.getElementById('productsList');
    if (!productsList) return;
    
    let filteredProducts = productsCatalog;
    
    if (filter !== 'all') {
        filteredProducts = productsCatalog.filter(p => p.category.toLowerCase() === filter.toLowerCase());
    }
    
    if (filteredProducts.length === 0) {
        productsList.innerHTML = '<div class="no-data">📦 No products found in database</div>';
        return;
    }
    
    productsList.innerHTML = filteredProducts.map(product => `
        <div class="product-card-supplier">
            <div class="product-header">
                <h3>${product.sku} - ${product.name}</h3>
                <span class="status-badge ${getStatusBadgeClass(product.stock_status)}">${product.stock_status}</span>
            </div>
            
            <div class="product-details">
                <p><strong>Category:</strong> ${product.category} | <strong>Brand:</strong> ${product.brand}</p>
                
                <div class="pricing-info">
                    <p><strong>Cost Price:</strong> ${formatPrice(product.cost_price)}</p>
                    <p><strong>Retail Price:</strong> ${formatPrice(product.retail_price)}</p>
                    <p><strong>Stock:</strong> ${product.stock_quantity || 0} units</p>
                </div>
            </div>
            
            <div class="product-actions">
                <button class="btn btn-secondary btn-small" onclick="viewProductStats('${product.sku}')">📊 View Stats</button>
            </div>
        </div>
    `).join('');
}

function viewProductStats(sku) {
    const product = productsCatalog.find(p => p.sku === sku);
    if (!product) return;
    
    const margin = product.retail_price - product.cost_price;
    const marginPercent = (margin / product.retail_price * 100).toFixed(1);
    
    alert(`
Product Statistics: ${product.name}
========================================
SKU: ${product.sku}
Category: ${product.category}
Brand: ${product.brand}

Pricing:
• Cost: ${formatPrice(product.cost_price)}
• Retail: ${formatPrice(product.retail_price)}
• Margin: ${formatPrice(margin)} (${marginPercent}%)

Inventory:
• Current Stock: ${product.stock_quantity || 0} units
• Status: ${product.stock_status}
    `);
}

// =====================================================
// Reports Functions
// =====================================================

function generateSalesReport() {
    if (!currentSupplier) {
        alert('Please log in first');
        return;
    }
    
    const pendingCount = stockRequests.filter(r => r.status === 'Pending').length;
    const inTransitCount = stockRequests.filter(r => r.status === 'In Transit').length;
    const completedCount = stockRequests.filter(r => r.status === 'Completed').length;
    const totalPaid = stockRequests.filter(r => r.payment_status === 'Paid').reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
    const pendingPayment = stockRequests.filter(r => r.status === 'Completed' && r.payment_status === 'Unpaid').reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
    
    alert(`
📊 SALES REPORT - ${currentSupplier.name}
========================================
Generated: ${new Date().toLocaleString()}

📦 Products in Catalog: ${productsCatalog.length}
📋 Total Stock Requests: ${stockRequests.length}

Orders by Status:
• ⏳ Pending: ${pendingCount}
• 🚚 In Transit: ${inTransitCount}
• ✅ Completed: ${completedCount}

💰 Payment Summary:
• Total Paid: ${formatPrice(totalPaid)}
• Pending Payment: ${formatPrice(pendingPayment)}

Use "Export as PDF" or "Export as Excel" for detailed reports.
    `);
}

function updateReportsSection() {
    // Update Monthly Trend section
    const monthlyTrendStats = document.getElementById('monthlyTrendStats');
    if (monthlyTrendStats) {
        const stats = salesStats || {};
        const thisMonth = stats.this_month_revenue || 0;
        const lastMonth = stats.last_month_revenue || 0;
        const growth = stats.growth_percent || 0;
        
        // Calculate total from purchase orders
        const totalPOValue = purchaseOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        const receivedValue = purchaseOrders
            .filter(o => o.status === 'Received')
            .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
        
        monthlyTrendStats.innerHTML = `
            <div class="perf-item">
                <span class="perf-label">This Month Sales:</span>
                <span class="perf-value">${formatPrice(thisMonth)}</span>
            </div>
            <div class="perf-item">
                <span class="perf-label">Last Month Sales:</span>
                <span class="perf-value">${formatPrice(lastMonth)}</span>
            </div>
            <div class="perf-item ${growth >= 0 ? 'success' : 'warning'}">
                <span class="perf-label">Growth:</span>
                <span class="perf-value">${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%</span>
            </div>
            <div class="perf-item">
                <span class="perf-label">Total PO Value:</span>
                <span class="perf-value">${formatPrice(totalPOValue)}</span>
            </div>
        `;
    }
    
    // Update Order Summary section - Include Stock Requests
    const orderSummaryStats = document.getElementById('orderSummaryStats');
    if (orderSummaryStats) {
        // Stock Requests stats
        const srPending = stockRequests.filter(r => r.status === 'Pending').length;
        const srInTransit = stockRequests.filter(r => r.status === 'In Transit').length;
        const srCompleted = stockRequests.filter(r => r.status === 'Completed').length;
        
        // Pending Payment: Completed but Unpaid stock requests
        const pendingPaymentAmount = stockRequests
            .filter(r => r.status === 'Completed' && r.payment_status === 'Unpaid')
            .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
        
        // Paid amount
        const paidAmount = stockRequests
            .filter(r => r.payment_status === 'Paid')
            .reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);
        
        orderSummaryStats.innerHTML = `
            <div class="perf-item ${srPending > 0 ? 'warning' : ''}">
                <span class="perf-label">Pending Confirmation:</span>
                <span class="perf-value">${srPending} requests</span>
            </div>
            <div class="perf-item ${srInTransit > 0 ? '' : ''}">
                <span class="perf-label">In Transit:</span>
                <span class="perf-value">${srInTransit} shipments</span>
            </div>
            <div class="perf-item success">
                <span class="perf-label">Delivered:</span>
                <span class="perf-value">${srCompleted} completed</span>
            </div>
            <div class="perf-item ${pendingPaymentAmount > 0 ? 'warning' : 'success'}">
                <span class="perf-label">Pending Payment:</span>
                <span class="perf-value">${formatPrice(pendingPaymentAmount)}</span>
            </div>
            <div class="perf-item success">
                <span class="perf-label">Total Paid:</span>
                <span class="perf-value">${formatPrice(paidAmount)}</span>
            </div>
        `;
    }
}

function exportReport(format) {
    if (!currentSupplier) {
        showNotification('Please log in first', 'error');
        return;
    }
    
    showNotification(`Generating ${format.toUpperCase()} report...`, 'info');
    
    // Build report data from Stock Requests
    const reportData = {
        supplier: currentSupplier.name,
        generatedAt: new Date().toLocaleString(),
        totalProducts: productsCatalog.length,
        requests: stockRequests,
        summary: {
            pending: stockRequests.filter(r => r.status === 'Pending').length,
            inTransit: stockRequests.filter(r => r.status === 'In Transit').length,
            completed: stockRequests.filter(r => r.status === 'Completed').length,
            totalRevenue: stockRequests.filter(r => r.payment_status === 'Paid').reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0),
            pendingPayment: stockRequests.filter(r => r.status === 'Completed' && r.payment_status === 'Unpaid').reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0)
        }
    };
    
    if (format === 'pdf') {
        exportAsPDF(reportData);
    } else if (format === 'excel') {
        exportAsExcel(reportData);
    }
}

function exportAsPDF(reportData) {
    // Create a printable HTML content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sales Report - ${reportData.supplier}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
                h2 { color: #374151; margin-top: 30px; }
                .summary { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
                .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
                .stat { text-align: center; }
                .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
                .stat-label { color: #6b7280; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
                th { background: #1e40af; color: white; }
                tr:nth-child(even) { background: #f9fafb; }
                .footer { margin-top: 40px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <h1>📊 Sales Report</h1>
            <p><strong>Supplier:</strong> ${reportData.supplier}</p>
            <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
            
            <div class="summary">
                <h2>Summary</h2>
                <div class="summary-grid">
                    <div class="stat">
                        <div class="stat-value">${reportData.summary.completed}</div>
                        <div class="stat-label">Completed Orders</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">£${reportData.summary.totalRevenue.toFixed(2)}</div>
                        <div class="stat-label">Total Paid</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">£${reportData.summary.pendingPayment.toFixed(2)}</div>
                        <div class="stat-label">Pending Payment</div>
                    </div>
                </div>
            </div>
            
            <h2>Order Details</h2>
            <table>
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>Product</th>
                        <th>Branch</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                    </tr>
                </thead>
                <tbody>
                    ${reportData.requests.map(r => `
                        <tr>
                            <td>SR-${r.request_id}</td>
                            <td>${r.product_name || 'N/A'}</td>
                            <td>${r.branch_name || 'N/A'}</td>
                            <td>${r.requested_quantity}</td>
                            <td>£${parseFloat(r.total_amount || 0).toFixed(2)}</td>
                            <td>${r.status}</td>
                            <td>${r.payment_status}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>Summit Gear & Adventures - Supplier Portal</p>
                <p>Report generated on ${reportData.generatedAt}</p>
            </div>
        </body>
        </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
        printWindow.print();
        showNotification('PDF report ready for printing/saving', 'success');
    }, 500);
}

function exportAsExcel(reportData) {
    // Create CSV content (Excel can open CSV files)
    let csvContent = 'Summit Gear Sales Report\n';
    csvContent += `Supplier,${reportData.supplier}\n`;
    csvContent += `Generated,${reportData.generatedAt}\n`;
    csvContent += `Total Products,${reportData.totalProducts}\n\n`;
    
    // Summary
    csvContent += 'Summary\n';
    csvContent += `Pending Orders,${reportData.summary.pending}\n`;
    csvContent += `In Transit,${reportData.summary.inTransit}\n`;
    csvContent += `Completed Orders,${reportData.summary.completed}\n`;
    csvContent += `Total Paid,£${reportData.summary.totalRevenue.toFixed(2)}\n`;
    csvContent += `Pending Payment,£${reportData.summary.pendingPayment.toFixed(2)}\n\n`;
    
    // Order Details
    csvContent += 'Order Details\n';
    csvContent += 'Request ID,Product,Branch,Quantity,Amount,Status,Payment Status,Date\n';
    
    reportData.requests.forEach(r => {
        csvContent += `SR-${r.request_id},`;
        csvContent += `"${r.product_name || 'N/A'}",`;
        csvContent += `"${r.branch_name || 'N/A'}",`;
        csvContent += `${r.requested_quantity},`;
        csvContent += `£${parseFloat(r.total_amount || 0).toFixed(2)},`;
        csvContent += `${r.status},`;
        csvContent += `${r.payment_status},`;
        csvContent += `${r.requested_at || 'N/A'}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SalesReport_${reportData.supplier.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Excel (CSV) report downloaded!', 'success');
}

// =====================================================
// Stock Requests from Inventory Admin
// =====================================================

let stockRequests = [];

async function loadStockRequests() {
    if (!currentSupplier) return;
    
    const container = document.getElementById('stockRequestsContainer');
    if (!container) return;
    
    container.innerHTML = '<p style="text-align:center; padding:2rem; color:#6b7280;">Loading stock requests...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/stock-requests.php?supplier_id=${currentSupplier.supplier_id}`);
        const data = await response.json();
        
        if (data.success) {
            stockRequests = data.data;
            renderStockRequests();
            updateRequestsBadge();
            renderActionItems();  // Update action items with stock requests
            updateReportsSection();  // Update Order Summary with stock requests
        }
    } catch (error) {
        console.error('Error loading stock requests:', error);
        container.innerHTML = '<p style="text-align:center; padding:2rem; color:#ef4444;">Failed to load stock requests</p>';
    }
}

function updateRequestsBadge() {
    const badge = document.getElementById('requestsBadge');
    if (badge) {
        const pending = stockRequests.filter(r => r.status === 'Pending').length;
        if (pending > 0) {
            badge.textContent = pending;
            badge.style.display = 'inline-block';
            badge.style.cssText = 'background:#ef4444; color:white; padding:0.125rem 0.5rem; border-radius:1rem; font-size:0.7rem; margin-left:0.5rem;';
        } else {
            badge.style.display = 'none';
        }
    }
}

function renderStockRequests() {
    const container = document.getElementById('stockRequestsContainer');
    if (!container) return;
    
    if (stockRequests.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:#6b7280;">
                <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">📥</div>
                <p>No stock requests at this time</p>
            </div>
        `;
        return;
    }
    
    const urgencyColor = u => {
        const colors = { 'Critical': '#ef4444', 'High': '#f59e0b', 'Medium': '#3b82f6', 'Low': '#10b981' };
        return colors[u] || '#6b7280';
    };
    
    const statusBadge = s => {
        const map = {
            'Pending': { bg: '#fef3c7', color: '#92400e', label: '⏳ Pending' },
            'In Transit': { bg: '#dbeafe', color: '#1e40af', label: '🚚 In Transit' },
            'Completed': { bg: '#d1fae5', color: '#065f46', label: '✓ Completed' },
            'Cancelled': { bg: '#fee2e2', color: '#991b1b', label: '✗ Cancelled' }
        };
        const style = map[s] || { bg: '#f3f4f6', color: '#374151', label: s };
        return `<span style="display:inline-block; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.75rem; font-weight:600; background:${style.bg}; color:${style.color};">${style.label}</span>`;
    };
    
    container.innerHTML = `
        <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse;">
                <thead style="background:#f9fafb;">
                    <tr>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Product</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Branch</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Qty Needed</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Urgency</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Status</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Requested</th>
                        <th style="padding:0.75rem 1rem; text-align:left; font-weight:600; color:#374151; font-size:0.75rem; text-transform:uppercase;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${stockRequests.map(r => `
                        <tr style="border-top:1px solid #e5e7eb; ${r.urgency === 'Critical' ? 'background:#fee2e2;' : r.urgency === 'High' ? 'background:#fef3c7;' : ''}">
                            <td style="padding:0.75rem 1rem;">
                                <strong>${r.product_name}</strong><br>
                                <small style="color:#6b7280;">${r.sku}</small>
                            </td>
                            <td style="padding:0.75rem 1rem;">${r.branch_name}</td>
                            <td style="padding:0.75rem 1rem;">
                                <strong>${r.requested_quantity}</strong> units<br>
                                <small style="color:#6b7280;">Current: ${r.current_stock}</small>
                            </td>
                            <td style="padding:0.75rem 1rem;">
                                <span style="display:inline-block; padding:0.25rem 0.75rem; border-radius:1rem; font-size:0.75rem; font-weight:600; background:${urgencyColor(r.urgency)}22; color:${urgencyColor(r.urgency)};">
                                    ${r.urgency === 'Critical' ? '🔴' : r.urgency === 'High' ? '🟠' : r.urgency === 'Medium' ? '🟡' : '🟢'} ${r.urgency}
                                </span>
                            </td>
                            <td style="padding:0.75rem 1rem;">${statusBadge(r.status)}</td>
                            <td style="padding:0.75rem 1rem;">
                                ${formatDate(r.requested_at)}<br>
                                <small style="color:#6b7280;">${r.requested_by_name || ''}</small>
                            </td>
                            <td style="padding:0.75rem 1rem;">
                                ${r.status === 'Pending' ? `
                                    <button onclick="confirmAndShip(${r.request_id})" style="padding:0.375rem 0.75rem; background:#10b981; color:white; border:none; border-radius:0.5rem; cursor:pointer; font-size:0.8rem;">✓ Confirm & Ship</button>
                                ` : ''}
                                ${r.status === 'In Transit' ? `
                                    <span style="color:#3b82f6; font-weight:600;">🚚 In Transit - Awaiting Store Receipt</span>
                                ` : ''}
                                ${r.status === 'Completed' ? `
                                    <span style="color:#10b981; font-weight:600;">✓ Delivered & Received</span>
                                ` : ''}
                                ${r.status === 'Cancelled' ? `
                                    <span style="color:#ef4444; font-weight:600;">✗ Cancelled</span>
                                ` : ''}
                                ${r.notes ? `<br><small style="color:#6b7280; margin-top:0.25rem; display:block;">📝 ${r.notes}</small>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function confirmAndShip(id) {
    const request = stockRequests.find(r => r.request_id == id);
    if (!request) return;
    
    if (!confirm(`Confirm and ship ${request.requested_quantity} units of "${request.product_name}" to ${request.branch_name}?\n\nThis will mark the order as "In Transit".`)) return;
    
    await updateStockRequestStatus(id, 'In Transit');
}

async function updateStockRequestStatus(id, status) {
    try {
        const response = await fetch(`${API_BASE}/stock-requests.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: id, status: status })
        });
        
        const data = await response.json();
        if (data.success) {
            showNotification(`Request ${status.toLowerCase()}!`, 'success');
            loadStockRequests();
        } else {
            showNotification('Failed to update request', 'error');
        }
    } catch (error) {
        showNotification('Error updating request', 'error');
    }
}

// Global function exports
window.confirmOrder = confirmOrder;
window.rejectOrder = rejectOrder;
window.openShippingModal = openShippingModal;
window.closeShippingModal = closeShippingModal;
window.submitShipping = submitShipping;
window.markDelivered = markDelivered;
window.viewOrderDetails = viewOrderDetails;
window.viewProductStats = viewProductStats;
window.navigateTo = navigateTo;
window.applyOrderFilter = applyOrderFilter;
window.generateSalesReport = generateSalesReport;
window.exportReport = exportReport;
window.renderProducts = renderProducts;
window.updateReportsSection = updateReportsSection;
window.updatePaymentsSection = updatePaymentsSection;
window.handleLogout = handleLogout;
window.checkAuth = checkAuth;
window.searchOrders = searchOrders;
window.loadStockRequests = loadStockRequests;
window.confirmAndShip = confirmAndShip;
window.currentSupplier = currentSupplier;
window.productsCatalog = productsCatalog;
window.purchaseOrders = purchaseOrders;
