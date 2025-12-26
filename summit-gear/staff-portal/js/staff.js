// =====================================================
// Summit Gear & Adventures - Staff Portal JavaScript
// POS System with Database Integration
// =====================================================

const API_BASE = '/summit-gear/api';

// Global state
let cart = [];
let currentCustomer = null;
let currentStaff = null;
let products = [];
let customers = [];
let categories = [];

// =====================================================
// API Helper
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
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// =====================================================
// Initialization
// =====================================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Staff Portal POS System Loading...');
    
    // Check login status
    if (!checkStaffLogin()) return;
    
    // Setup UI components
    setupTabs();
    setupPaymentMethods();
    setupProductSearch();
    setupLogout();
    
    // Update time display
    updateTime();
    setInterval(updateTime, 1000);
    
    // Load data from API
    await loadInitialData();
    
    console.log('✅ Staff Portal loaded successfully');
});

// =====================================================
// Authentication
// =====================================================
function checkStaffLogin() {
    const isLoggedIn = localStorage.getItem('staffLoggedIn') === 'true';
    currentStaff = JSON.parse(localStorage.getItem('currentStaff') || 'null');
    
    if (!isLoggedIn || !currentStaff) {
        window.location.href = 'login.html';
        return false;
    }
    
    updateStaffDisplay();
    return true;
}

function updateStaffDisplay() {
    if (!currentStaff) return;
    
    const staffNameEl = document.querySelector('.staff-name');
    if (staffNameEl) {
        staffNameEl.textContent = `👤 ${currentStaff.name} (EMP-${String(currentStaff.employee_id).padStart(3, '0')})`;
    }
    
    const branchInfoEl = document.querySelector('.branch-info');
    if (branchInfoEl) {
        branchInfoEl.textContent = `📍 ${currentStaff.branch_name || currentStaff.branchName}`;
    }
}

function setupLogout() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('staffLoggedIn');
                localStorage.removeItem('currentStaff');
                window.location.href = '../index.html';
            }
        });
    }
}

// =====================================================
// Data Loading
// =====================================================
async function loadInitialData() {
    const branchId = currentStaff?.branch_id || currentStaff?.branchId || 1;
    
    // Load products
    const productsResponse = await apiRequest(`/stock.php?action=pos_products&branch_id=${branchId}`);
    if (productsResponse.success) {
        products = productsResponse.data;
        renderProductList();
    }
    
    // Load categories
    const categoriesResponse = await apiRequest('/sales.php?action=categories');
    if (categoriesResponse.success) {
        categories = categoriesResponse.data;
        updateCategoryFilter();
    }
    
    // Load customers for dropdown
    const customersResponse = await apiRequest('/sales.php?action=customers');
    if (customersResponse.success) {
        customers = customersResponse.data;
        updateCustomerDropdown();
    }
    
    // Load employee stats
    loadEmployeeStats();
}

function updateCategoryFilter() {
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect && categories.length > 0) {
        filterSelect.innerHTML = '<option>All Categories</option>';
        categories.forEach(cat => {
            filterSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    }
}

function updateCustomerDropdown() {
    const customerSelect = document.getElementById('customer-select');
    if (!customerSelect) return;
    
    customerSelect.innerHTML = '<option value="">Select Customer...</option>';
    
    customers.forEach(customer => {
        const tierEmoji = getTierEmoji(customer.membership_type);
        const label = `${customer.name} (${tierEmoji} ${customer.membership_type} - ${customer.points.toLocaleString()} pts)`;
        customerSelect.innerHTML += `<option value="${customer.customer_id}">${label}</option>`;
    });
    
    customerSelect.innerHTML += '<option value="new">➕ New Customer</option>';
}

function getTierEmoji(tier) {
    const emojis = { 'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Platinum': '💎' };
    return emojis[tier] || '🎖️';
}

// =====================================================
// Product Search & Display
// =====================================================
function setupProductSearch() {
    const searchInput = document.getElementById('product-search');
    const searchBtn = document.querySelector('.product-search-section .btn-primary');
    const categorySelect = document.querySelector('.filter-select');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') filterProducts();
        });
        
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(filterProducts, 300);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterProducts);
    }
    
    if (categorySelect) {
        categorySelect.addEventListener('change', filterProducts);
    }
}

async function filterProducts() {
    const searchTerm = document.getElementById('product-search')?.value || '';
    const category = document.querySelector('.filter-select')?.value || 'All Categories';
    const branchId = currentStaff?.branch_id || currentStaff?.branchId || 1;
    
    let url = `/stock.php?action=pos_products&branch_id=${branchId}`;
    if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
    if (category && category !== 'All Categories') url += `&category=${encodeURIComponent(category)}`;
    
    const response = await apiRequest(url);
    if (response.success) {
        products = response.data;
        renderProductList();
    }
}

function renderProductList(productList = products) {
    const productListEl = document.querySelector('.product-list');
    if (!productListEl) return;
    
    if (productList.length === 0) {
        productListEl.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No products found</p>';
        return;
    }
    
    productListEl.innerHTML = productList.map(product => `
        <div class="product-item">
            <div class="product-info">
                <strong>P${String(product.product_id).padStart(3, '0')}</strong> - ${product.name}<br>
                <span class="product-price">£${product.price.toFixed(2)}</span> | 
                <span class="stock-qty ${product.stock < 5 ? 'low-stock' : ''}">Stock: ${product.stock}</span>
            </div>
            <button class="btn btn-primary btn-small" 
                    onclick="addToCart(${product.product_id}, '${product.name.replace(/'/g, "\\'")}', ${product.price})" 
                    ${product.stock === 0 ? 'disabled' : ''}>
                ${product.stock === 0 ? '❌ Out of Stock' : '➕ Add'}
            </button>
        </div>
    `).join('');
}

// =====================================================
// Tab Navigation
// =====================================================
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            if (targetTab === 'my-sales') {
                loadEmployeeStats();
            }
            
            if (targetTab === 'returns') {
                loadReturns();
            }
        });
    });
}

// =====================================================
// Employee Statistics
// =====================================================
async function loadEmployeeStats() {
    if (!currentStaff) return;
    
    const response = await apiRequest(`/employees.php?action=stats&employee_id=${currentStaff.employee_id}`);
    
    if (response.success) {
        const stats = response.data;
        
        // Update stats cards - use #my-sales to target the correct section
        const mySalesSection = document.getElementById('my-sales');
        if (!mySalesSection) return;
        
        const statCards = mySalesSection.querySelectorAll('.stat-card');
        
        if (statCards.length >= 3) {
            // Today's sales
            const todaySales = statCards[0].querySelector('.stat-value');
            const todayTrend = statCards[0].querySelector('.stat-trend');
            if (todaySales) todaySales.textContent = `£${stats.today.sales.toFixed(2)}`;
            if (todayTrend) {
                const avgDaily = stats.this_month.sales / 30 || 0;
                todayTrend.textContent = stats.today.sales >= avgDaily ? '↑ Above Average' : '↓ Below Average';
                todayTrend.className = 'stat-trend ' + (stats.today.sales >= avgDaily ? 'success' : '');
            }
            
            // Orders processed
            const ordersValue = statCards[1].querySelector('.stat-value');
            const ordersTrend = statCards[1].querySelector('.stat-trend');
            if (ordersValue) ordersValue.textContent = stats.today.orders;
            if (ordersTrend) ordersTrend.textContent = `This week: ${stats.this_week.orders}`;
            
            // Customers served (using order count as proxy)
            const customersValue = statCards[2].querySelector('.stat-value');
            const customersTrend = statCards[2].querySelector('.stat-trend');
            if (customersValue) customersValue.textContent = stats.today.orders;
            if (customersTrend) customersTrend.textContent = `This week: ${stats.this_week.orders}`;
        }
        
        // Update transactions table
        const transactionsTable = document.querySelector('.transactions-table tbody');
        if (transactionsTable && stats.recent_transactions) {
            if (stats.recent_transactions.length === 0) {
                transactionsTable.innerHTML = '<tr><td colspan="6" style="text-align: center;">No transactions today</td></tr>';
            } else {
                transactionsTable.innerHTML = stats.recent_transactions.map(tx => {
                    const time = new Date(tx.order_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
                    return `
                        <tr>
                            <td>${time}</td>
                            <td>SO-${String(tx.order_id).padStart(5, '0')}</td>
                            <td>${tx.customer_name}</td>
                            <td>${tx.item_count}</td>
                            <td>£${tx.total_amount.toFixed(2)}</td>
                            <td><span class="status-badge completed">✅</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
        
        // Update weekly stats
        const weeklyStats = document.querySelector('.weekly-stats');
        if (weeklyStats) {
            const weekTotal = stats.this_week.sales;
            const weekOrders = stats.this_week.orders;
            const avgOrder = weekOrders > 0 ? weekTotal / weekOrders : 0;
            const target = 15000;
            const completion = Math.min(100, (weekTotal / target) * 100);
            const remaining = Math.max(0, target - weekTotal);
            
            weeklyStats.innerHTML = `
                <p><strong>Sales:</strong> £${weekTotal.toFixed(0).toLocaleString()} | <strong>Orders:</strong> ${weekOrders} | <strong>Avg Order:</strong> £${avgOrder.toFixed(0)}</p>
                <p><strong>Target:</strong> £${target.toLocaleString()} | <strong>Completion:</strong> ${completion.toFixed(0)}% | 🎯 <strong>Remaining:</strong> £${remaining.toLocaleString()}</p>
            `;
        }
        
        // Update progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            const completion = Math.min(100, (stats.this_week.sales / 15000) * 100);
            progressFill.style.width = `${completion}%`;
            progressFill.textContent = `${completion.toFixed(0)}%`;
        }
    }
}

// =====================================================
// Customer Selection
// =====================================================
async function selectCustomer() {
    const select = document.getElementById('customer-select');
    const value = select.value;
    const customerInfo = document.getElementById('customer-info');
    
    if (value && value !== 'new') {
        // Fetch customer details from API
        const response = await apiRequest(`/sales.php?action=customer_details&customer_id=${value}`);
        
        if (response.success) {
            currentCustomer = response.data;
            const emoji = getTierEmoji(currentCustomer.membership_type);
            
            customerInfo.innerHTML = `
                <p><strong>${currentCustomer.name}</strong> ${emoji} ${currentCustomer.membership_type} Member</p>
                <p>Points: ${currentCustomer.points.toLocaleString()} | Discount: ${currentCustomer.discount_rate}%</p>
            `;
            customerInfo.style.display = 'block';
        }
    } else if (value === 'new') {
        showNewCustomerModal();
        select.value = '';
        currentCustomer = null;
        customerInfo.style.display = 'none';
    } else {
        currentCustomer = null;
        customerInfo.style.display = 'none';
    }
    
    updateOrderSummary();
}

async function showNewCustomerModal() {
    const firstName = prompt('Enter customer first name:');
    if (!firstName) return;
    
    const lastName = prompt('Enter customer last name:');
    if (!lastName) return;
    
    const email = prompt('Enter customer email (optional):') || '';
    const phone = prompt('Enter customer phone (optional):') || '';
    
    // Register via API
    const response = await apiRequest('/sales.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'register_customer',
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone
        })
    });
    
    if (response.success) {
        currentCustomer = response.data;
        
        // Update customer dropdown
        const customerSelect = document.getElementById('customer-select');
        const option = document.createElement('option');
        option.value = currentCustomer.customer_id;
        option.textContent = `${currentCustomer.name} (🥉 Bronze - 100 pts)`;
        customerSelect.insertBefore(option, customerSelect.lastElementChild);
        customerSelect.value = currentCustomer.customer_id;
        
        // Update customer info display
        const customerInfo = document.getElementById('customer-info');
        customerInfo.innerHTML = `
            <p><strong>${currentCustomer.name}</strong> 🥉 Bronze Member (New!)</p>
            <p>Points: 100 (Welcome Bonus) | Discount: 5%</p>
        `;
        customerInfo.style.display = 'block';
        
        showNotification(`✅ ${response.message}`, 'success');
        updateOrderSummary();
    } else {
        alert('Failed to register customer: ' + (response.error || 'Unknown error'));
    }
}

// =====================================================
// Shopping Cart
// =====================================================
function addToCart(productId, name, price) {
    const product = products.find(p => p.product_id === productId);
    if (!product || product.stock === 0) {
        alert('Product out of stock!');
        return;
    }
    
    const existingItem = cart.find(item => item.product_id === productId);
    
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            alert(`Only ${product.stock} items available in stock!`);
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({
            product_id: productId,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    updateOrderSummary();
    showNotification(`Added: ${name}`, 'success');
}

function removeFromCart(productId) {
    const item = cart.find(i => i.product_id === productId);
    cart = cart.filter(item => item.product_id !== productId);
    updateCartDisplay();
    updateOrderSummary();
    if (item) showNotification(`Removed: ${item.name}`, 'info');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.product_id === productId);
    const product = products.find(p => p.product_id === productId);
    
    if (item) {
        const newQty = item.quantity + change;
        
        if (newQty <= 0) {
            removeFromCart(productId);
        } else if (product && newQty > product.stock) {
            alert(`Only ${product.stock} items available!`);
        } else {
            item.quantity = newQty;
            updateCartDisplay();
            updateOrderSummary();
        }
    }
}

function clearCart() {
    if (cart.length === 0) {
        alert('Cart is already empty');
        return;
    }
    
    if (confirm('Clear all items from cart?')) {
        cart = [];
        updateCartDisplay();
        updateOrderSummary();
        showNotification('Cart cleared', 'info');
    }
}

function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Cart is empty - add products to begin</p>';
        return;
    }
    
    cartItems.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">£${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity(${item.product_id}, -1)">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${item.product_id}, 1)">+</button>
                </div>
                <div class="cart-item-total">£${itemTotal.toFixed(2)}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.product_id})">🗑️</button>
            </div>
        `;
    }).join('');
}

function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount_rate : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const pointsToEarn = Math.floor(total);
    
    const subtotalEl = document.getElementById('subtotal');
    const discountPercentEl = document.getElementById('discount-percent');
    const discountAmountEl = document.getElementById('discount-amount');
    const totalEl = document.getElementById('total');
    const pointsEarnEl = document.getElementById('points-earn');
    
    if (subtotalEl) subtotalEl.textContent = `£${subtotal.toFixed(2)}`;
    if (discountPercentEl) discountPercentEl.textContent = discountPercent;
    if (discountAmountEl) discountAmountEl.textContent = `-£${discountAmount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `£${total.toFixed(2)}`;
    if (pointsEarnEl) pointsEarnEl.textContent = `+${pointsToEarn}`;
}

// =====================================================
// Checkout
// =====================================================
function checkout() {
    if (cart.length === 0) {
        alert('Cart is empty!');
        return;
    }
    
    if (!currentCustomer) {
        if (!confirm('No customer selected. Continue as walk-in customer?')) {
            return;
        }
    }
    
    showCheckoutModal();
}

function showCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('active');
    
    // Fill customer info
    const customerInfoDiv = document.getElementById('checkout-customer-info');
    if (currentCustomer) {
        const emoji = getTierEmoji(currentCustomer.membership_type);
        customerInfoDiv.innerHTML = `
            <p><strong>Customer:</strong> ${currentCustomer.name}</p>
            <p><strong>Membership:</strong> ${emoji} ${currentCustomer.membership_type}</p>
            <p><strong>Available Points:</strong> ${currentCustomer.points.toLocaleString()}</p>
        `;
    } else {
        customerInfoDiv.innerHTML = `<p>Walk-in Customer (Not Registered)</p>`;
    }
    
    // Fill order summary
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount_rate : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const pointsToEarn = Math.floor(total);
    
    document.getElementById('checkout-items').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('checkout-subtotal').textContent = `£${subtotal.toFixed(2)}`;
    document.getElementById('checkout-discount').textContent = `-£${discountAmount.toFixed(2)} (${discountPercent}%)`;
    document.getElementById('checkout-total').textContent = `£${total.toFixed(2)}`;
    document.getElementById('checkout-points').textContent = `+${pointsToEarn}`;
}

function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('active');
}

function setupPaymentMethods() {
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

async function completeSale() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount_rate : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const finalTotal = subtotal - discountAmount;
    
    // Get payment method
    const selectedPayment = document.querySelector('.payment-btn.active');
    const paymentMethod = selectedPayment ? selectedPayment.getAttribute('data-method') : 'Cash';
    const paymentNames = { 'cash': 'Cash', 'card': 'Card', 'mobile': 'Mobile Pay' };
    
    // Confirm sale
    const confirmMessage = `Confirm Sale?
    
Customer: ${currentCustomer ? currentCustomer.name : 'Walk-in'}
Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}
Total: £${finalTotal.toFixed(2)}
Payment: ${paymentNames[paymentMethod] || paymentMethod}
Staff: ${currentStaff.name}`;
    
    if (!confirm(confirmMessage)) return;
    
    // Send to API
    const response = await apiRequest('/sales.php', {
        method: 'POST',
        body: JSON.stringify({
            action: 'create_sale',
            customer_id: currentCustomer ? currentCustomer.customer_id : null,
            employee_id: currentStaff.employee_id,
            branch_id: currentStaff.branch_id || currentStaff.branchId || 1,
            items: cart,
            payment_method: paymentNames[paymentMethod] || 'Cash',
            discount_percent: discountPercent
        })
    });
    
    if (response.success) {
        const data = response.data;
        
        showNotification(`✅ Sale Complete! Order #${data.order_number}`, 'success');
        
        alert(`✅ Sale Complete!\n\nOrder #: ${data.order_number}\nTotal: £${data.total_amount.toFixed(2)}\nPoints Earned: +${data.points_earned}`);
        
        // Reset cart
        cart = [];
        currentCustomer = null;
        const customerSelect = document.getElementById('customer-select');
        if (customerSelect) customerSelect.value = '';
        const customerInfo = document.getElementById('customer-info');
        if (customerInfo) customerInfo.style.display = 'none';
        
        // Update display
        updateCartDisplay();
        updateOrderSummary();
        closeCheckout();
        
        // Refresh products to get updated stock
        await loadInitialData();
        
        // Refresh stats
        loadEmployeeStats();
        
        // Ask to print receipt
        if (confirm('Print receipt?')) {
            printReceipt(data.order_number, data.total_amount);
        }
    } else {
        alert('Failed to complete sale: ' + (response.error || 'Unknown error'));
    }
}

function printReceipt(orderNumber, total) {
    const receiptContent = `
========================================
       SUMMIT GEAR & ADVENTURES
========================================
Branch: ${currentStaff.branch_name || currentStaff.branchName}
Date: ${new Date().toLocaleString('en-GB')}
Order #: ${orderNumber}
Staff: ${currentStaff.name}
----------------------------------------
${cart.map(item => `${item.name}
  ${item.quantity} x £${item.price.toFixed(2)} = £${(item.price * item.quantity).toFixed(2)}`).join('\n')}
----------------------------------------
TOTAL: £${total.toFixed(2)}
----------------------------------------
Customer: ${currentCustomer ? currentCustomer.name : 'Walk-in'}
${currentCustomer ? `Points Earned: +${Math.floor(total)}` : ''}
========================================
      Thank you for shopping!
========================================
    `;
    
    console.log(receiptContent);
    alert('Receipt printed to console (in production, this would print to receipt printer)');
}

// =====================================================
// Time Display
// =====================================================
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
    
    const dateElement = document.querySelector('.datetime');
    if (dateElement) {
        const dateStr = now.toLocaleDateString('en-GB', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        dateElement.innerHTML = `📅 ${dateStr} | 🕐 <span id="current-time">${hours}:${minutes}</span>`;
    }
}

// =====================================================
// Notifications
// =====================================================
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10B981',
        info: '#3B82F6',
        warning: '#F59E0B',
        error: '#EF4444'
    };
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    if (!document.getElementById('staffNotificationStyles')) {
        const style = document.createElement('style');
        style.id = 'staffNotificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// =====================================================
// Returns Processing
// =====================================================
let allReturns = [];
let currentReturnFilter = 'Pending';

async function loadReturns() {
    const branchId = currentStaff?.branch_id;
    if (!branchId) return;
    
    try {
        const res = await fetch(`${API_BASE}/returns.php?branch_id=${branchId}`);
        const data = await res.json();
        
        if (data.success) {
            allReturns = data.data || [];
            updateReturnStats();
            renderReturns();
        }
    } catch (e) {
        console.error('Failed to load returns:', e);
    }
}

function updateReturnStats() {
    const today = new Date().toISOString().split('T')[0];
    
    const pending = allReturns.filter(r => r.status === 'Pending').length;
    const approvedToday = allReturns.filter(r => 
        r.status === 'Approved' && r.processed_at && r.processed_at.startsWith(today)
    ).length;
    const rejectedToday = allReturns.filter(r => 
        r.status === 'Rejected' && r.processed_at && r.processed_at.startsWith(today)
    ).length;
    
    document.getElementById('returns-pending').textContent = pending;
    document.getElementById('returns-approved').textContent = approvedToday;
    document.getElementById('returns-rejected').textContent = rejectedToday;
}

function filterReturns(status) {
    currentReturnFilter = status;
    
    // Update button styles
    document.querySelectorAll('.return-filter-btn').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-secondary');
    });
    event.target.classList.remove('btn-secondary');
    event.target.classList.add('active', 'btn-primary');
    
    renderReturns();
}

function renderReturns() {
    const container = document.getElementById('returns-list');
    
    let filtered = allReturns;
    if (currentReturnFilter !== 'all') {
        filtered = allReturns.filter(r => r.status === currentReturnFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:2rem; color:#6b7280;">
                <div style="font-size:3rem; margin-bottom:0.5rem;">📭</div>
                <p>No ${currentReturnFilter === 'all' ? '' : currentReturnFilter.toLowerCase()} return requests</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(r => {
        const statusColors = {
            'Pending': '#f59e0b',
            'Approved': '#10b981',
            'Rejected': '#ef4444'
        };
        const statusEmoji = {
            'Pending': '⏳',
            'Approved': '✅',
            'Rejected': '❌'
        };
        
        return `
            <div style="border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; margin-bottom: 1rem; background: white;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                        <h4 style="margin:0; font-size:1.1rem;">Return #${r.return_id}</h4>
                        <p style="color:#6b7280; font-size:0.9rem; margin:0.25rem 0;">Order: ${r.order_number} | ${formatDate(r.requested_at)}</p>
                    </div>
                    <span style="background: ${statusColors[r.status]}; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.8rem;">
                        ${statusEmoji[r.status]} ${r.status}
                    </span>
                </div>
                <div style="background:#f9fafb; padding:0.75rem; border-radius:0.5rem; margin-bottom:0.75rem;">
                    <p style="margin:0;"><strong>Customer:</strong> ${r.customer_name} (${r.customer_email})</p>
                    <p style="margin:0.25rem 0;"><strong>Reason:</strong> ${r.reason}</p>
                    ${r.description ? `<p style="margin:0; color:#6b7280;"><strong>Details:</strong> ${r.description}</p>` : ''}
                    <p style="margin:0.5rem 0 0;"><strong>Order Amount:</strong> £${parseFloat(r.order_amount).toFixed(2)}</p>
                </div>
                ${r.status === 'Pending' ? `
                    <div style="display:flex; gap:0.5rem; justify-content:flex-end;">
                        <button class="btn btn-danger" onclick="processReturn(${r.return_id}, 'Rejected')" style="background:#ef4444;color:white;padding:0.5rem 1rem;border:none;border-radius:0.5rem;cursor:pointer;">
                            ❌ Reject
                        </button>
                        <button class="btn btn-success" onclick="processReturn(${r.return_id}, 'Approved', ${r.order_amount})" style="background:#10b981;color:white;padding:0.5rem 1rem;border:none;border-radius:0.5rem;cursor:pointer;">
                            ✅ Approve & Refund
                        </button>
                    </div>
                ` : `
                    ${r.status === 'Approved' ? `
                        <p style="color:#10b981; margin:0;"><strong>Refunded:</strong> £${parseFloat(r.refund_amount || r.order_amount).toFixed(2)} | Processed by: ${r.processed_by_name || 'Staff'}</p>
                    ` : `
                        <p style="color:#ef4444; margin:0;">Rejected by: ${r.processed_by_name || 'Staff'}</p>
                    `}
                `}
            </div>
        `;
    }).join('');
}

async function processReturn(returnId, status, refundAmount = 0) {
    const action = status === 'Approved' ? 'approve' : 'reject';
    const confirmMsg = status === 'Approved' 
        ? `Approve this return and refund £${refundAmount.toFixed(2)}?\n\nThis will:\n• Restore stock to inventory\n• Refund customer points\n• Update sales records`
        : 'Reject this return request?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const res = await fetch(`${API_BASE}/returns.php`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                return_id: returnId,
                status: status,
                processed_by: currentStaff?.employee_id,
                refund_amount: refundAmount
            })
        });
        
        const result = await res.json();
        
        if (result.success) {
            showNotification(`Return ${status.toLowerCase()} successfully!`, 'success');
            await loadReturns();
        } else {
            showNotification('Failed: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (e) {
        console.error('Process return error:', e);
        showNotification('Error processing return', 'error');
    }
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// =====================================================
// Global Exports
// =====================================================
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateQuantity = updateQuantity;
window.clearCart = clearCart;
window.checkout = checkout;
window.closeCheckout = closeCheckout;
window.completeSale = completeSale;
window.selectCustomer = selectCustomer;
window.filterReturns = filterReturns;
window.processReturn = processReturn;

console.log('✅ Staff Portal JS loaded');
