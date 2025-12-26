// =====================================================
// Products Management JavaScript - Database Connected
// =====================================================

const API_BASE = '/summit-gear/api';
let allProducts = [];
let filteredProducts = [];
let currentSupplier = null;

// =====================================================
// Initialization
// =====================================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Products page loading...');
    
    // Check authentication
    const supplierData = localStorage.getItem('currentSupplier');
    if (!supplierData) {
        window.location.href = 'login.html';
        return;
    }
    currentSupplier = JSON.parse(supplierData);
    
    // Update supplier info in nav
    updateNavSupplierInfo();
    
    // Load products from database
    await loadProducts();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('Products page ready!');
});

function updateNavSupplierInfo() {
    const companyName = document.querySelector('.company-name');
    const contactPerson = document.querySelector('.contact-person');
    
    if (companyName && currentSupplier) {
        companyName.textContent = '🏢 ' + currentSupplier.name;
    }
    if (contactPerson && currentSupplier) {
        contactPerson.textContent = 'Contact: ' + currentSupplier.contact_person;
    }
    
    // Logout button
    document.querySelector('.btn-logout')?.addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentSupplier');
            localStorage.removeItem('supplierId');
            window.location.href = '../index.html';
        }
    });
}

// =====================================================
// Load Products from Database
// =====================================================
async function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    try {
        const response = await fetch(`${API_BASE}/products.php?supplier_id=${currentSupplier.supplier_id}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            allProducts = result.data;
            filteredProducts = [...allProducts];
            
            // Update stats
            updateProductStats();
            
            // Populate category filter
            populateCategoryFilter();
    
            // Render products
            renderProducts();
            
            console.log(`✅ Loaded ${allProducts.length} products from database`);
        } else {
            productsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <p style="font-size: 3rem;">📦</p>
                    <p>No products found for your supplier account.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading products:', error);
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p style="font-size: 3rem;">❌</p>
                <p>Error loading products. Please check database connection.</p>
            </div>
        `;
    }
}

// =====================================================
// Update Statistics
// =====================================================
function updateProductStats() {
    const totalProducts = allProducts.length;
    const inStock = allProducts.filter(p => p.stock_status === 'In Stock').length;
    const lowStock = allProducts.filter(p => p.stock_status === 'Low Stock' || p.stock_status === 'Out of Stock').length;
    const totalValue = allProducts.reduce((sum, p) => sum + (parseFloat(p.cost_price) * (p.stock_quantity || 0)), 0);
    
    document.getElementById('totalProductsCount').textContent = totalProducts;
    document.getElementById('inStockCount').textContent = inStock;
    document.getElementById('lowStockCount').textContent = lowStock;
    document.getElementById('totalStockValue').textContent = '£' + totalValue.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// =====================================================
// Populate Category Filter
// =====================================================
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(allProducts.map(p => p.category))].sort();
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// =====================================================
// Render Products
// =====================================================
function renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    
    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <p style="font-size: 3rem;">🔍</p>
                <p>No products found matching your filters.</p>
                <button class="btn btn-primary" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
    productsGrid.innerHTML = filteredProducts.map(product => {
        const stockClass = product.stock_status === 'In Stock' ? 'high' : 
                          product.stock_status === 'Low Stock' ? 'medium' : 'low';
        const emoji = getProductEmoji(product);
        
        return `
            <div class="product-card" data-category="${product.category}" data-stock="${stockClass}">
                <div class="product-image">${emoji}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-sku">SKU: ${product.sku}</div>
                <div class="product-price">
                    <span style="color: #6b7280; font-size: 0.9rem;">Cost:</span> £${parseFloat(product.cost_price).toFixed(2)}
                    <br>
                    <span style="color: #6b7280; font-size: 0.9rem;">Retail:</span> £${parseFloat(product.retail_price).toFixed(2)}
                </div>
                <div class="product-stock">
                    <span class="stock-indicator ${stockClass}">${product.stock_status} (${product.stock_quantity || 0})</span>
                </div>
                <div class="product-actions">
                    <button class="btn btn-small btn-secondary" onclick="viewProduct(${product.product_id})">👁️ View Details</button>
                </div>
            </div>
        `;
    }).join('');
}

// =====================================================
// Product Emoji Helper
// =====================================================
function getProductEmoji(product) {
    const name = product.name.toLowerCase();
    const category = product.category;
    
    if (name.includes('tent')) return '⛺';
    if (name.includes('sleeping bag')) return '🛏️';
    if (name.includes('mat')) return '🛋️';
    if (name.includes('cooler')) return '🧊';
    if (name.includes('chair')) return '🪑';
    if (name.includes('bottle')) return '🥤';
    if (name.includes('cookware') || name.includes('stove')) return '🍳';
    if (name.includes('rope')) return '🪢';
    if (name.includes('harness')) return '🦺';
    if (name.includes('helmet')) return '🪖';
    if (name.includes('carabiner')) return '🔗';
    if (name.includes('glove')) return '🧤';
    if (name.includes('jacket')) return '🧥';
    if (name.includes('vest')) return '🦺';
    if (name.includes('pants')) return '👖';
    if (name.includes('shirt') || name.includes('layer')) return '👕';
    if (name.includes('boot')) return '🥾';
    if (name.includes('shoe')) return '👟';
    if (name.includes('sock')) return '🧦';
    if (name.includes('gps')) return '📍';
    if (name.includes('watch')) return '⌚';
    if (name.includes('compass')) return '🧭';
    if (name.includes('radio')) return '📻';
    if (name.includes('power bank') || name.includes('solar')) return '🔋';
    if (name.includes('backpack') || name.includes('pack')) return '🎒';
    if (name.includes('headlamp') || name.includes('lamp')) return '🔦';
    if (name.includes('lantern')) return '🏮';
    if (name.includes('tool') || name.includes('knife')) return '🔧';
    if (name.includes('filter')) return '💧';
    if (name.includes('first aid')) return '🩹';
    
    const categoryEmojis = {
        'Camping': '🏕️',
        'Climbing': '🧗',
        'Clothing': '🧥',
        'Backpacks': '🎒',
        'Electronics': '📱',
        'Footwear': '🥾',
        'Lighting': '🔦',
        'Tools': '🔧'
    };
    
    return categoryEmojis[category] || '📦';
}

// =====================================================
// Filter Products
// =====================================================
function filterProducts() {
    const searchTerm = document.getElementById('searchProducts').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const stockFilter = document.getElementById('stockFilter').value;
        
    filteredProducts = allProducts.filter(product => {
        // Search filter
        if (searchTerm && !product.name.toLowerCase().includes(searchTerm) && 
            !product.sku.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Category filter
        if (categoryFilter && product.category !== categoryFilter) {
            return false;
        }
        
        // Stock filter
        if (stockFilter && product.stock_status !== stockFilter) {
            return false;
        }
        
        return true;
    });
    
    renderProducts();
}

function resetFilters() {
    document.getElementById('searchProducts').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stockFilter').value = '';
    
    filteredProducts = [...allProducts];
    renderProducts();
}

// =====================================================
// View Product Details
// =====================================================
function viewProduct(productId) {
    const product = allProducts.find(p => p.product_id == productId);
    if (!product) return;
            
    const margin = parseFloat(product.retail_price) - parseFloat(product.cost_price);
    const marginPercent = (margin / parseFloat(product.retail_price) * 100).toFixed(1);
    
    alert(`
Product Details: ${product.name}
========================================
SKU: ${product.sku}
Category: ${product.category}
Brand: ${product.brand}

Pricing:
• Cost Price: £${parseFloat(product.cost_price).toFixed(2)}
• Retail Price: £${parseFloat(product.retail_price).toFixed(2)}
• Margin: £${margin.toFixed(2)} (${marginPercent}%)

Inventory:
• Current Stock: ${product.stock_quantity || 0} units
• Status: ${product.stock_status}

Description:
${product.description || 'No description available.'}
    `);
}

// =====================================================
// Setup Event Listeners
// =====================================================
function setupEventListeners() {
    // Real-time search
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    // Filter change events
    document.getElementById('categoryFilter')?.addEventListener('change', filterProducts);
    document.getElementById('stockFilter')?.addEventListener('change', filterProducts);
    }

console.log('✅ Products.js loaded - Database Connected');
