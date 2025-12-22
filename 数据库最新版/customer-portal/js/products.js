// =====================================================
// Products Page JavaScript - 增强搜索和筛选功能
// =====================================================

// 产品数据库（模拟完整数据）
const allProducts = [
    { id: 1, name: 'North Face 帐篷', price: 450.00, category: 'camping', brand: 'The North Face', rating: 5, inStock: true, image: '🏕️' },
    { id: 2, name: 'Climbing Rope Pro', price: 65.00, category: 'climbing', brand: 'Black Diamond', rating: 5, inStock: true, image: '🧗' },
    { id: 3, name: 'Sleeping Bag Pro', price: 280.00, category: 'camping', brand: 'MSR', rating: 4.5, inStock: true, image: '🛏️' },
    { id: 4, name: 'LED Headlamp', price: 45.00, category: 'lighting', brand: 'The North Face', rating: 5, inStock: true, image: '🔦' },
    { id: 5, name: 'Elite Backpack', price: 180.00, category: 'backpacks', brand: 'The North Face', rating: 5, inStock: true, image: '🎒' },
    { id: 6, name: 'Camping Stove', price: 125.00, category: 'camping', brand: 'MSR', rating: 4.5, inStock: false, image: '🍳' },
    { id: 7, name: 'GPS Garmin', price: 299.00, category: 'electronics', brand: 'Garmin', rating: 5, inStock: true, image: '📱' },
    { id: 8, name: 'Hiking Boots Pro', price: 180.00, category: 'footwear', brand: 'The North Face', rating: 4.5, inStock: true, image: '🥾' },
    { id: 9, name: 'Waterproof Jacket', price: 250.00, category: 'clothing', brand: 'Patagonia', rating: 5, inStock: true, image: '🧥' },
    { id: 10, name: 'Trekking Poles', price: 75.00, category: 'tools', brand: 'Black Diamond', rating: 4.5, inStock: true, image: '🥢' },
    { id: 11, name: 'Water Filter', price: 95.00, category: 'tools', brand: 'MSR', rating: 5, inStock: true, image: '💧' },
    { id: 12, name: 'Portable Hammock', price: 65.00, category: 'camping', brand: 'The North Face', rating: 4, inStock: true, image: '🏖️' },
];

let filteredProducts = [...allProducts];
let currentFilters = {
    categories: [],
    brands: [],
    priceMin: 0,
    priceMax: 1000,
    inStockOnly: false,
    searchQuery: ''
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeFilters();
    displayProducts(allProducts);
    setupEventListeners();
});

// 初始化筛选器
function initializeFilters() {
    // 从URL参数获取初始筛选条件
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    
    if (category) {
        currentFilters.categories = [category];
        // 更新复选框状态
        const checkbox = document.querySelector(`input[value="${category}"]`);
        if (checkbox) checkbox.checked = true;
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索按钮
    const searchBtn = document.querySelector('.search-box .btn');
    const searchInput = document.getElementById('searchInput');
    
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') performSearch();
        });
    }
    
    // 排序选择
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            sortProducts(this.value);
        });
    }
    
    // 类别筛选
    const categoryCheckboxes = document.querySelectorAll('.filter-section input[type="checkbox"]');
    categoryCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', applyFilters);
    });
    
    // 价格筛选
    const priceMin = document.querySelector('.price-inputs input:first-child');
    const priceMax = document.querySelector('.price-inputs input:last-child');
    const applyPriceBtn = document.querySelector('.price-inputs + .btn');
    
    if (applyPriceBtn) {
        applyPriceBtn.addEventListener('click', function() {
            currentFilters.priceMin = parseFloat(priceMin.value) || 0;
            currentFilters.priceMax = parseFloat(priceMax.value) || 1000;
            applyFilters();
        });
    }
    
    // 库存筛选
    const inStockCheckbox = document.querySelector('input[value="in-stock"]');
    if (inStockCheckbox) {
        inStockCheckbox.addEventListener('change', function() {
            currentFilters.inStockOnly = this.checked;
            applyFilters();
        });
    }
}

// 执行搜索
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    currentFilters.searchQuery = searchInput.value.toLowerCase().trim();
    applyFilters();
}

// 应用所有筛选条件
function applyFilters() {
    filteredProducts = allProducts.filter(product => {
        // 搜索查询
        if (currentFilters.searchQuery) {
            const matchesSearch = product.name.toLowerCase().includes(currentFilters.searchQuery);
            if (!matchesSearch) return false;
        }
        
        // 类别筛选
        if (currentFilters.categories.length > 0) {
            if (!currentFilters.categories.includes(product.category)) return false;
        }
        
        // 品牌筛选
        if (currentFilters.brands.length > 0) {
            if (!currentFilters.brands.includes(product.brand)) return false;
        }
        
        // 价格筛选
        if (product.price < currentFilters.priceMin || product.price > currentFilters.priceMax) {
            return false;
        }
        
        // 库存筛选
        if (currentFilters.inStockOnly && !product.inStock) {
            return false;
        }
        
        return true;
    });
    
    displayProducts(filteredProducts);
    updateResultCount();
}

// 排序产品
function sortProducts(sortType) {
    let sortedProducts = [...filteredProducts];
    
    switch(sortType) {
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            sortedProducts.sort((a, b) => b.rating - a.rating);
            break;
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'best-selling':
        default:
            // 保持原始顺序
            break;
    }
    
    displayProducts(sortedProducts);
}

// 显示产品
function displayProducts(products) {
    const productGrid = document.querySelector('.products-grid');
    
    if (!productGrid) return;
    
    if (products.length === 0) {
        productGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h2>😔 没有找到匹配的产品</h2>
                <p>请尝试调整筛选条件</p>
                <button class="btn btn-primary" onclick="resetFilters()">重置筛选</button>
            </div>
        `;
        return;
    }
    
    let html = '';
    products.forEach(product => {
        const memberPrice = (product.price * 0.85).toFixed(2); // 15% 折扣
        const stars = '⭐'.repeat(Math.floor(product.rating)) + (product.rating % 1 >= 0.5 ? '½' : '');
        
        html += `
            <div class="product-card">
                <div class="product-image">${product.image}</div>
                <h3>${product.name}</h3>
                <div class="price-info">
                    <span class="original-price">£${product.price.toFixed(2)}</span>
                    <span class="discounted-price">£${memberPrice}</span>
                </div>
                <div class="discount-badge">节省 15% (金卡)</div>
                <div class="rating">${stars}</div>
                <div class="stock-status ${product.inStock ? 'in-stock' : 'out-of-stock'}">
                    ${product.inStock ? '✅ 有货' : '❌ 缺货'}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-block" onclick="addToCart(${product.id})" ${!product.inStock ? 'disabled' : ''}>
                        🛒 加入购物车
                    </button>
                    <a href="product-detail.html?id=${product.id}" class="btn btn-secondary btn-block">
                        👁️ 查看详情
                    </a>
                </div>
            </div>
        `;
    });
    
    productGrid.innerHTML = html;
}

// 更新结果数量
function updateResultCount() {
    const pageHeader = document.querySelector('.page-header h1');
    if (pageHeader) {
        const baseText = pageHeader.textContent.split('(')[0].trim();
        pageHeader.textContent = `${baseText} (${filteredProducts.length} 件商品)`;
    }
}

// 重置筛选
function resetFilters() {
    // 重置所有复选框
    document.querySelectorAll('.filter-section input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    // 重置价格输入
    document.querySelector('.price-inputs input:first-child').value = '0';
    document.querySelector('.price-inputs input:last-child').value = '1000';
    
    // 重置搜索框
    document.getElementById('searchInput').value = '';
    
    // 重置筛选条件
    currentFilters = {
        categories: [],
        brands: [],
        priceMin: 0,
        priceMax: 1000,
        inStockOnly: false,
        searchQuery: ''
    };
    
    filteredProducts = [...allProducts];
    displayProducts(filteredProducts);
    updateResultCount();
}

// 快速添加到购物车
function quickAddToCart(productId) {
    addToCart(productId);
}

console.log('✅ Products页面增强功能已加载');







