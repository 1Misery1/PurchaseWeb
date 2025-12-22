// =====================================================
// Product Detail Page JavaScript
// =====================================================

// 切换主图片
function changeMainImage(emoji) {
    document.getElementById('mainImage').textContent = emoji;
    
    // 更新缩略图激活状态
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    event.target.classList.add('active');
}

// 切换标签页
function showTab(tabId) {
    // 隐藏所有标签内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // 移除所有标签按钮的激活状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// 增加数量
function increaseQuantity() {
    const input = document.getElementById('quantity');
    const max = parseInt(input.max);
    const current = parseInt(input.value);
    
    if (current < max) {
        input.value = current + 1;
    }
}

// 减少数量
function decreaseQuantity() {
    const input = document.getElementById('quantity');
    const min = parseInt(input.min);
    const current = parseInt(input.value);
    
    if (current > min) {
        input.value = current - 1;
    }
}

// 添加到购物车（详情页）
function addToCartDetail() {
    const productName = document.getElementById('productName').textContent;
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('currentPrice').textContent.replace('£', ''));
    
    // 获取当前购物车
    let cart = JSON.parse(localStorage.getItem('summitGearCart')) || [];
    
    // 检查产品是否已在购物车中
    const existingItem = cart.find(item => item.name === productName);
    
    if (existingItem) {
        existingItem.quantity += quantity;
        showNotification(`已将 ${productName} 的数量增加到 ${existingItem.quantity}`, 'success');
    } else {
        cart.push({
            id: Date.now(), // 使用时间戳作为临时ID
            name: productName,
            price: price,
            quantity: quantity
        });
        showNotification(`${productName} 已添加到购物车！`, 'success');
    }
    
    // 保存购物车
    localStorage.setItem('summitGearCart', JSON.stringify(cart));
    
    // 更新购物车数量显示
    updateCartCount();
    
    // 可选：询问是否前往购物车
    setTimeout(() => {
        if (confirm('产品已添加到购物车。\n是否立即前往购物车查看？')) {
            window.location.href = 'cart.html';
        }
    }, 500);
}

// 添加到愿望清单
function addToWishlist() {
    const productName = document.getElementById('productName').textContent;
    
    // 获取当前愿望清单
    let wishlist = JSON.parse(localStorage.getItem('summitGearWishlist')) || [];
    
    // 检查是否已在愿望清单中
    if (wishlist.some(item => item.name === productName)) {
        showNotification('该产品已在您的愿望清单中', 'info');
        return;
    }
    
    // 添加到愿望清单
    wishlist.push({
        id: Date.now(),
        name: productName,
        price: parseFloat(document.getElementById('currentPrice').textContent.replace('£', '')),
        addedDate: new Date().toISOString()
    });
    
    localStorage.setItem('summitGearWishlist', JSON.stringify(wishlist));
    showNotification(`${productName} 已添加到愿望清单！`, 'success');
    
    // 更改按钮样式
    event.target.innerHTML = '❤️ 已在愿望清单';
    event.target.style.background = 'var(--primary-color)';
    event.target.style.color = 'white';
}

// 更新购物车数量显示
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('summitGearCart')) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

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

// 页面加载时更新购物车数量
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // 检查是否已在愿望清单中
    const productName = document.getElementById('productName').textContent;
    const wishlist = JSON.parse(localStorage.getItem('summitGearWishlist')) || [];
    
    if (wishlist.some(item => item.name === productName)) {
        const wishlistBtn = document.querySelector('.wishlist-btn');
        if (wishlistBtn) {
            wishlistBtn.innerHTML = '❤️ 已在愿望清单';
            wishlistBtn.style.background = 'var(--primary-color)';
            wishlistBtn.style.color = 'white';
        }
    }
});

console.log('✅ Product Detail页面已加载');







