// =====================================================
// Summit Gear & Adventures - Shared JavaScript
// Database Connected Version
// Version 4.0 - 2024-12-23
// =====================================================

console.log('✅ Shared.js v4.0 loaded - Database Connected');

const API_BASE = '/summit-gear/api';

// Global state
let currentCustomer = null;
let cart = [];
let allProducts = [];

// =====================================================
// Initialization
// =====================================================
document.addEventListener('DOMContentLoaded', async function() {
    // Load customer from localStorage (session)
    loadCustomerSession();
    
    // Initialize navigation
    initNavigation();
    
    // Load cart from localStorage
    loadCartFromStorage();
    
    // Update cart count
    updateCartCount();
    
    // Load products from database
    await loadProducts();
});

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
// Customer Session Management
// =====================================================
function loadCustomerSession() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const customerData = localStorage.getItem('currentCustomer');
    
    if (isLoggedIn && customerData) {
        currentCustomer = JSON.parse(customerData);
    } else {
        currentCustomer = null;
    }
}

function getCurrentCustomer() {
    return currentCustomer;
}

function getCurrentUserId() {
    return currentCustomer ? currentCustomer.customer_id : 'guest';
}

function isLoggedIn() {
    return localStorage.getItem('isLoggedIn') === 'true' && currentCustomer !== null;
}

// Save customer session after login
function saveCustomerSession(customer) {
    currentCustomer = customer;
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentCustomer', JSON.stringify(customer));
}

// Clear customer session on logout
function clearCustomerSession() {
    currentCustomer = null;
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentCustomer');
}

// Refresh customer data from database
async function refreshCustomerData() {
    if (!currentCustomer) return;
    
    const response = await apiRequest(`/customers.php?id=${currentCustomer.customer_id}`);
    if (response.success && response.data) {
        currentCustomer = response.data;
        localStorage.setItem('currentCustomer', JSON.stringify(currentCustomer));
    }
}

// =====================================================
// Navigation & UI
// =====================================================
function initNavigation() {
    updateNavUserInfo();
    updateWelcomeSection();
}

function updateNavUserInfo() {
    const userInfoDiv = document.querySelector('.user-info');
    if (!userInfoDiv) return;
    
    if (isLoggedIn() && currentCustomer) {
        const tierEmoji = getMembershipEmoji(currentCustomer.membership_type);
        
        userInfoDiv.innerHTML = `
            <div class="user-profile">
                <span class="user-name">👤 ${currentCustomer.name}</span>
                <span class="membership-badge ${(currentCustomer.membership_type || 'Bronze').toLowerCase()}">${tierEmoji} ${currentCustomer.membership_type || 'Bronze'}</span>
                <span class="points">Points: ${(currentCustomer.total_points || 0).toLocaleString()}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">Logout</button>
        `;
    } else {
        userInfoDiv.innerHTML = `
            <div class="user-profile logged-out">
                <a href="register.html" class="btn btn-primary" style="margin-right: 0.5rem;">📝 Register</a>
                <a href="login.html" class="btn btn-secondary">🔑 Login</a>
            </div>
        `;
    }
}

function updateWelcomeSection() {
    const welcomeSection = document.getElementById('welcomeSection');
    const guestSection = document.getElementById('guestSection');
    
    if (welcomeSection && guestSection) {
        if (isLoggedIn() && currentCustomer) {
            welcomeSection.style.display = 'block';
            guestSection.style.display = 'none';
            
            const welcomeMessage = document.getElementById('welcomeMessage');
            const pointsMessage = document.getElementById('pointsMessage');
            
            if (welcomeMessage) {
                const tierEmoji = getMembershipEmoji(currentCustomer.membership_type);
                welcomeMessage.textContent = `Welcome back, ${currentCustomer.name}! ${tierEmoji} You are a ${currentCustomer.membership_type || 'Bronze'} Member`;
            }
            if (pointsMessage) {
                const pointValue = ((currentCustomer.total_points || 0) / 100).toFixed(2);
                pointsMessage.textContent = `You have ${(currentCustomer.total_points || 0).toLocaleString()} points (≈ £${pointValue})`;
            }
        } else {
            welcomeSection.style.display = 'none';
            guestSection.style.display = 'block';
        }
    }
}

function getMembershipEmoji(type) {
    const emojis = { 'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Platinum': '💎' };
    return emojis[type] || '🥉';
}

function getMembershipDiscount(type) {
    const discounts = { 'Bronze': 0, 'Silver': 5, 'Gold': 10, 'Platinum': 15 };
    return discounts[type] || 0;
}

// =====================================================
// Products - From Database
// =====================================================
async function loadProducts() {
    const response = await apiRequest('/products.php');
    if (response.success) {
        allProducts = response.data;
        console.log(`Loaded ${allProducts.length} products from database`);
    }
    return allProducts;
}

function getProductById(productId) {
    return allProducts.find(p => p.product_id == productId);
}

function getProductsByCategory(category) {
    if (!category || category === 'all') return allProducts;
    return allProducts.filter(p => p.category === category);
}

function getProductsByBrand(brand) {
    if (!brand || brand === 'all') return allProducts;
    return allProducts.filter(p => p.brand === brand);
}

function searchProducts(query) {
    if (!query) return allProducts;
    const lowerQuery = query.toLowerCase();
    return allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
    );
}

// =====================================================
// Shopping Cart - Local Storage (until checkout)
// =====================================================
function getCartStorageKey() {
    return `summitGearCart_${getCurrentUserId()}`;
}

function loadCartFromStorage() {
    const cartData = localStorage.getItem(getCartStorageKey());
    cart = cartData ? JSON.parse(cartData) : [];
}

function saveCartToStorage() {
    localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
    updateCartCount();
}

function getCart() {
    return cart;
}

function addToCart(productId, quantity = 1) {
    const product = getProductById(productId);
    if (!product) {
        showNotification('Product not found', 'error');
        return false;
    }
    
    const existingItem = cart.find(item => item.product_id == productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product_id: product.product_id,
            name: product.name,
            brand: product.brand,
            price: parseFloat(product.retail_price),
            quantity: quantity,
            image: product.image || `images/products/${product.category.toLowerCase()}.jpg`
        });
    }
    
    saveCartToStorage();
    showNotification(`Added ${product.name} to cart`, 'success');
    return true;
}

function removeFromCart(productId) {
    const index = cart.findIndex(item => item.product_id == productId);
    if (index > -1) {
        const item = cart[index];
        cart.splice(index, 1);
        saveCartToStorage();
        showNotification(`Removed ${item.name} from cart`, 'info');
    }
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.product_id == productId);
    if (item) {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = quantity;
            saveCartToStorage();
        }
    }
}

function clearCart() {
    cart = [];
    saveCartToStorage();
}

function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function updateCartCount() {
    const cartCountElements = document.querySelectorAll('.cart-count, #cartCount');
    const count = getCartItemCount();
    
    cartCountElements.forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'inline-block' : 'none';
    });
}

// =====================================================
// Orders - Database Integration
// =====================================================
async function createOrder(options = {}) {
    if (!isLoggedIn()) {
        showNotification('Please login to place an order', 'warning');
        return null;
    }
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'warning');
        return null;
    }
    
    // Prepare order items
    const items = cart.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity
    }));
    
    // Build order data (Note: Points redemption feature removed - points are only earned)
    const orderData = {
        customer_id: currentCustomer.customer_id,
        items: items,
        payment_method: options.payment_method || 'Card',
        branch_id: options.branch_id || 1,
        delivery_fee: options.delivery_fee || 0,
        promotion_discount: options.promotion_discount || 0,  // Add promotion discount
        applied_promotions: options.applied_promotions || '',  // Names of applied promotions
        notes: options.notes || ''
    };
    
    // Create order via API
    const response = await apiRequest('/orders.php', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });
    
    if (response.success) {
        // Clear cart after successful order
        clearCart();
        
        // Refresh customer data to get updated points
        await refreshCustomerData();
        
        showNotification(`Order ${response.data.order_number} placed successfully!`, 'success');
        return response.data;
    } else {
        showNotification('Failed to place order: ' + (response.message || 'Unknown error'), 'error');
        return null;
    }
}

async function getCustomerOrders() {
    if (!isLoggedIn()) return [];
    
    const response = await apiRequest(`/orders.php?customer_id=${currentCustomer.customer_id}`);
    if (response.success) {
        return response.data;
    }
    return [];
}

async function getOrderDetails(orderId) {
    const response = await apiRequest(`/orders.php?id=${orderId}`);
    if (response.success) {
        return response.data;
    }
    return null;
}

// =====================================================
// Authentication
// =====================================================
async function handleLogin(email, password) {
    const response = await apiRequest('/customers.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    
    if (response.success) {
        saveCustomerSession(response.data);
        return { success: true, customer: response.data };
    } else {
        return { success: false, error: response.message || 'Login failed' };
    }
}

async function handleRegister(userData) {
    const response = await apiRequest('/customers.php?action=register', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (response.success) {
        return { success: true, customerId: response.data.customer_id };
    } else {
        return { success: false, error: response.message || 'Registration failed' };
    }
}

function handleLogout() {
    clearCustomerSession();
    clearCart();
    showNotification('You have been logged out', 'info');
    window.location.href = 'index.html';
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
    
    // Remove existing notifications
    document.querySelectorAll('.notification-toast').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    // Add animation styles if not exists
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
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
// Utility Functions
// =====================================================
function formatPrice(price) {
    return '£' + parseFloat(price).toFixed(2);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// =====================================================
// Global Exports
// =====================================================
window.getCurrentCustomer = getCurrentCustomer;
window.getCurrentUserId = getCurrentUserId;
window.isLoggedIn = isLoggedIn;
window.saveCustomerSession = saveCustomerSession;
window.clearCustomerSession = clearCustomerSession;
window.refreshCustomerData = refreshCustomerData;
window.loadProducts = loadProducts;
window.getProductById = getProductById;
window.getProductsByCategory = getProductsByCategory;
window.getProductsByBrand = getProductsByBrand;
window.searchProducts = searchProducts;
window.allProducts = allProducts;
window.getCart = getCart;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartQuantity = updateCartQuantity;
window.clearCart = clearCart;
window.getCartTotal = getCartTotal;
window.getCartItemCount = getCartItemCount;
window.updateCartCount = updateCartCount;
window.createOrder = createOrder;
window.getCustomerOrders = getCustomerOrders;
window.getOrderDetails = getOrderDetails;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleLogout = handleLogout;
window.showNotification = showNotification;
window.formatPrice = formatPrice;
window.formatDate = formatDate;
window.getMembershipEmoji = getMembershipEmoji;
window.getMembershipDiscount = getMembershipDiscount;
window.apiRequest = apiRequest;
