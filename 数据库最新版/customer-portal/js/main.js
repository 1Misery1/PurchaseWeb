// =====================================================
// Summit Gear & Adventures - Main JavaScript
// =====================================================

// 购物车数据 (模拟)
let cart = [
    { id: 1, name: 'North Face 帐篷', price: 382.50, quantity: 1 },
    { id: 4, name: 'LED Headlamp', price: 38.25, quantity: 1 }
];

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Summit Gear & Adventures Customer Portal Loaded');
    updateCartCount();
});

// 添加到购物车
function addToCart(productId) {
    // 模拟产品数据
    const products = {
        1: { id: 1, name: 'North Face 帐篷', price: 382.50 },
        2: { id: 2, name: 'Climbing Rope Pro', price: 55.25 },
        3: { id: 3, name: 'Sleeping Bag Pro', price: 238.00 },
        4: { id: 4, name: 'LED Headlamp', price: 38.25 },
        5: { id: 5, name: 'Elite Backpack', price: 180.00 },
        6: { id: 6, name: 'Camping Stove', price: 125.00 },
        7: { id: 7, name: 'GPS Garmin', price: 299.00 }
    };
    
    const product = products[productId];
    
    if (!product) {
        alert('产品未找到');
        return;
    }
    
    // 检查购物车中是否已有该产品
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
        alert(`已将 ${product.name} 的数量增加到 ${existingItem.quantity}`);
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
        alert(`${product.name} 已添加到购物车！`);
    }
    
    updateCartCount();
    saveCart();
}

// 更新购物车数量显示
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

// 保存购物车到本地存储
function saveCart() {
    localStorage.setItem('summitGearCart', JSON.stringify(cart));
}

// 从本地存储加载购物车
function loadCart() {
    const savedCart = localStorage.getItem('summitGearCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// 从购物车移除商品
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartCount();
    saveCart();
}

// 更新购物车商品数量
function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            updateCartCount();
            saveCart();
        }
    }
}

// 计算购物车总价
function getCartTotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
}

// 获取购物车商品总数
function getCartItemCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// 清空购物车
function clearCart() {
    if (confirm('确定要清空购物车吗？')) {
        cart = [];
        updateCartCount();
        saveCart();
        alert('购物车已清空');
    }
}

// 页面加载时加载购物车
loadCart();

// 产品筛选功能
function filterProducts(category) {
    console.log('筛选类别:', category);
    // 这里可以添加产品筛选逻辑
}

// 搜索功能
function searchProducts(query) {
    console.log('搜索:', query);
    // 这里可以添加搜索逻辑
}

// 会员积分计算
function calculatePoints(amount) {
    // 每消费£1获得1积分
    return Math.floor(amount);
}

// 积分兑换计算
function calculatePointsDiscount(points) {
    // 100积分 = £1折扣
    return points / 100;
}

// 格式化价格
function formatPrice(price) {
    return '£' + price.toFixed(2);
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('zh-CN', options);
}

// =====================================================
// 增强功能
// =====================================================

// 通知系统
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
    `;
    notification.textContent = message;
    
    // 添加动画样式
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
        style.textContent = `
            @keyframes slideIn {
                from {
                    transform: translateX(400px);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 愿望清单功能
function addToWishlist(productId, productName, productPrice) {
    // 获取当前愿望清单
    let wishlist = JSON.parse(localStorage.getItem('summitGearWishlist')) || [];
    
    // 检查是否已在愿望清单中
    if (wishlist.some(item => item.id === productId)) {
        showNotification('该产品已在您的愿望清单中', 'info');
        return;
    }
    
    // 添加到愿望清单
    wishlist.push({
        id: productId,
        name: productName,
        price: productPrice,
        addedDate: new Date().toISOString()
    });
    
    localStorage.setItem('summitGearWishlist', JSON.stringify(wishlist));
    showNotification(`${productName} 已添加到愿望清单！`, 'success');
}

// 产品比较功能
let comparisonList = [];

function addToComparison(productId, productName) {
    if (comparisonList.includes(productId)) {
        showNotification('该产品已在比较列表中', 'info');
        return;
    }
    
    if (comparisonList.length >= 4) {
        showNotification('最多只能比较4个产品', 'warning');
        return;
    }
    
    comparisonList.push(productId);
    showNotification(`${productName} 已添加到比较列表（${comparisonList.length}/4）`, 'success');
    updateComparisonBadge();
}

function updateComparisonBadge() {
    // 如果有比较徽章，更新它
    let badge = document.getElementById('comparisonBadge');
    if (!badge && comparisonList.length > 0) {
        // 创建比较按钮
        const compareBtn = document.createElement('button');
        compareBtn.id = 'comparisonBadge';
        compareBtn.className = 'btn btn-secondary';
        compareBtn.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
            padding: 1rem 1.5rem;
        `;
        compareBtn.innerHTML = `⚖️ 比较产品 (${comparisonList.length})`;
        compareBtn.onclick = showComparison;
        document.body.appendChild(compareBtn);
    } else if (badge) {
        badge.innerHTML = `⚖️ 比较产品 (${comparisonList.length})`;
        if (comparisonList.length === 0) {
            badge.remove();
        }
    }
}

function showComparison() {
    if (comparisonList.length === 0) {
        alert('比较列表是空的');
        return;
    }
    
    alert(`当前比较列表中有 ${comparisonList.length} 个产品\n\n实际应用中会显示产品对比表格。`);
}

// 快速预览功能
function quickView(productId) {
    // 实际应用中会显示模态窗口
    alert(`快速预览产品 ${productId}\n\n实际应用中会显示产品快速预览弹窗。`);
}

// 库存提醒
function notifyWhenAvailable(productId, productName) {
    const email = prompt(`当 ${productName} 有货时，我们会通过邮箱通知您。\n\n请输入您的邮箱地址：`);
    
    if (email) {
        // 实际应用中会保存到服务器
        showNotification('库存提醒已设置！商品有货时我们会通知您。', 'success');
    }
}

// 产品评分
function rateProduct(productId, rating) {
    // 实际应用中会提交到服务器
    showNotification(`您给产品打了 ${rating} 星！`, 'success');
}

// 分享产品
function shareProduct(productName, productId) {
    const shareText = `查看这个产品：${productName}\nwww.summitgear.co.uk/products/${productId}`;
    
    if (navigator.share) {
        navigator.share({
            title: productName,
            text: shareText,
            url: window.location.href
        }).then(() => {
            showNotification('分享成功！', 'success');
        }).catch(err => {
            console.log('分享失败:', err);
            copyToClipboard(shareText);
        });
    } else {
        copyToClipboard(shareText);
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showNotification('链接已复制到剪贴板！', 'success');
    } catch (err) {
        alert('复制失败');
    }
    
    document.body.removeChild(textarea);
}

// 实时库存查询
function checkStockInStores(productId) {
    // 模拟库存数据
    const stockData = {
        'Edinburgh': 15,
        'Glasgow': 8,
        'Aberdeen': 3,
        'Inverness': 12,
        'Dundee': 6
    };
    
    let stockInfo = '各分店库存情况：\n\n';
    for (const [store, stock] of Object.entries(stockData)) {
        stockInfo += `${store}: ${stock > 0 ? stock + ' 件' : '缺货'}\n`;
    }
    
    alert(stockInfo);
}

// 应用优惠券
function applyCoupon(code) {
    const validCoupons = {
        'WELCOME10': { discount: 10, description: '新用户10%折扣' },
        'SAVE20': { discount: 20, description: '限时20%折扣' },
        'GOLD15': { discount: 15, description: '金卡会员专属' }
    };
    
    if (validCoupons[code.toUpperCase()]) {
        const coupon = validCoupons[code.toUpperCase()];
        showNotification(`优惠券已应用：${coupon.description}`, 'success');
        return coupon.discount;
    } else {
        showNotification('无效的优惠券代码', 'error');
        return 0;
    }
}

// 退出登录
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                showNotification('正在退出...', 'info');
                setTimeout(() => {
                    // 实际应用中跳转到登录页
                    window.location.href = 'index.html';
                }, 1000);
            }
        });
    }
});

// 滚动到顶部按钮
window.addEventListener('scroll', function() {
    let scrollBtn = document.getElementById('scrollToTop');
    
    if (window.pageYOffset > 300) {
        if (!scrollBtn) {
            scrollBtn = document.createElement('button');
            scrollBtn.id = 'scrollToTop';
            scrollBtn.innerHTML = '↑';
            scrollBtn.className = 'btn btn-primary';
            scrollBtn.style.cssText = `
                position: fixed;
                bottom: 2rem;
                left: 2rem;
                z-index: 1000;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                font-size: 1.5rem;
            `;
            scrollBtn.onclick = () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            document.body.appendChild(scrollBtn);
        }
    } else if (scrollBtn) {
        scrollBtn.remove();
    }
});

console.log('✅ 增强功能已加载');

