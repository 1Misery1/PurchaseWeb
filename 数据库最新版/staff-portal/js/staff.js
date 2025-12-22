// =====================================================
// Summit Gear & Adventures - Staff Portal JavaScript
// =====================================================

// 购物车数据
let cart = [];
let currentCustomer = null;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Staff Portal POS System Loaded');
    
    // 标签页切换
    setupTabs();
    
    // 更新时间
    updateTime();
    setInterval(updateTime, 1000);
    
    // 支付方式切换
    setupPaymentMethods();
});

// 标签页切换功能
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // 移除所有active类
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            // 添加active类到当前标签
            this.classList.add('active');
            const targetContent = document.getElementById(targetTab);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

// 更新时间显示
function updateTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = `${hours}:${minutes}`;
    }
}

// 选择客户
function selectCustomer() {
    const select = document.getElementById('customer-select');
    const value = select.value;
    const customerInfo = document.getElementById('customer-info');
    
    if (value === 'john') {
        currentCustomer = {
            name: 'John Doe',
            membership: 'Gold',
            discount: 15,
            points: 2450
        };
        customerInfo.innerHTML = `
            <p><strong>${currentCustomer.name}</strong> 🥇 金卡会员</p>
            <p>积分: ${currentCustomer.points} | 折扣: ${currentCustomer.discount}%</p>
        `;
        customerInfo.style.display = 'block';
    } else if (value === 'jane') {
        currentCustomer = {
            name: 'Jane Smith',
            membership: 'Silver',
            discount: 10,
            points: 850
        };
        customerInfo.innerHTML = `
            <p><strong>${currentCustomer.name}</strong> 🥈 银卡会员</p>
            <p>积分: ${currentCustomer.points} | 折扣: ${currentCustomer.discount}%</p>
        `;
        customerInfo.style.display = 'block';
    } else if (value === 'bob') {
        currentCustomer = {
            name: 'Bob Wilson',
            membership: 'Regular',
            discount: 5,
            points: 125
        };
        customerInfo.innerHTML = `
            <p><strong>${currentCustomer.name}</strong> 普通会员</p>
            <p>积分: ${currentCustomer.points} | 折扣: ${currentCustomer.discount}%</p>
        `;
        customerInfo.style.display = 'block';
    } else if (value === 'new') {
        alert('新客户注册功能（待开发）');
        select.value = '';
        customerInfo.style.display = 'none';
    } else {
        currentCustomer = null;
        customerInfo.style.display = 'none';
    }
    
    updateOrderSummary();
}

// 添加商品到购物车
function addToCart(sku, name, price) {
    const existingItem = cart.find(item => item.sku === sku);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            sku: sku,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    updateOrderSummary();
    
    // 显示反馈
    console.log(`已添加: ${name}`);
}

// 从购物车移除商品
function removeFromCart(sku) {
    cart = cart.filter(item => item.sku !== sku);
    updateCartDisplay();
    updateOrderSummary();
}

// 更新商品数量
function updateQuantity(sku, change) {
    const item = cart.find(item => item.sku === sku);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(sku);
        } else {
            updateCartDisplay();
            updateOrderSummary();
        }
    }
}

// 清空购物车
function clearCart() {
    if (cart.length === 0) {
        alert('购物车已经是空的');
        return;
    }
    
    if (confirm('确定要清空购物车吗？')) {
        cart = [];
        updateCartDisplay();
        updateOrderSummary();
    }
}

// 更新购物车显示
function updateCartDisplay() {
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">购物车为空，请添加商品</p>';
        return;
    }
    
    let html = '';
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">£${item.price.toFixed(2)} × ${item.quantity}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="updateQuantity('${item.sku}', -1)">-</button>
                    <span class="qty-value">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.sku}', 1)">+</button>
                </div>
                <div class="cart-item-total">£${itemTotal.toFixed(2)}</div>
                <button class="cart-item-remove" onclick="removeFromCart('${item.sku}')">🗑️</button>
            </div>
        `;
    });
    
    cartItems.innerHTML = html;
}

// 更新订单汇总
function updateOrderSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const pointsToEarn = Math.floor(total);
    
    document.getElementById('subtotal').textContent = `£${subtotal.toFixed(2)}`;
    document.getElementById('discount-percent').textContent = discountPercent;
    document.getElementById('discount-amount').textContent = `-£${discountAmount.toFixed(2)}`;
    document.getElementById('total').textContent = `£${total.toFixed(2)}`;
    document.getElementById('points-earn').textContent = `+${pointsToEarn}`;
}

// 结账
function checkout() {
    if (cart.length === 0) {
        alert('购物车为空，无法结账');
        return;
    }
    
    if (!currentCustomer) {
        if (confirm('未选择客户，是否继续？')) {
            // 可以继续，作为临时客户
        } else {
            return;
        }
    }
    
    // 显示结账模态框
    showCheckoutModal();
}

// 显示结账模态框
function showCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('active');
    
    // 填充客户信息
    const customerInfoDiv = document.getElementById('checkout-customer-info');
    if (currentCustomer) {
        customerInfoDiv.innerHTML = `
            <p><strong>客户:</strong> ${currentCustomer.name}</p>
            <p><strong>会员等级:</strong> ${currentCustomer.membership}</p>
            <p><strong>可用积分:</strong> ${currentCustomer.points}</p>
        `;
    } else {
        customerInfoDiv.innerHTML = `<p>临时客户（未登记）</p>`;
    }
    
    // 填充订单汇总
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;
    const pointsToEarn = Math.floor(total);
    
    document.getElementById('checkout-items').textContent = cart.length;
    document.getElementById('checkout-subtotal').textContent = `£${subtotal.toFixed(2)}`;
    document.getElementById('checkout-discount').textContent = `-£${discountAmount.toFixed(2)} (${discountPercent}%)`;
    document.getElementById('checkout-total').textContent = `£${total.toFixed(2)}`;
    document.getElementById('checkout-points').textContent = `+${pointsToEarn}`;
}

// 关闭结账模态框
function closeCheckout() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('active');
}

// 支付方式选择
function setupPaymentMethods() {
    const paymentBtns = document.querySelectorAll('.payment-btn');
    paymentBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            paymentBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// 完成销售
function completeSale() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountPercent = currentCustomer ? currentCustomer.discount : 0;
    const discountAmount = total * (discountPercent / 100);
    const finalTotal = total - discountAmount;
    
    // 获取选择的支付方式
    const selectedPayment = document.querySelector('.payment-btn.active');
    const paymentMethod = selectedPayment ? selectedPayment.getAttribute('data-method') : 'cash';
    
    // 生成订单号
    const orderNumber = 'SO-' + Date.now().toString().slice(-6);
    
    // 确认销售
    const confirmMessage = `
        确认完成销售？
        
        订单号: ${orderNumber}
        客户: ${currentCustomer ? currentCustomer.name : '临时客户'}
        商品数量: ${cart.length}
        最终金额: £${finalTotal.toFixed(2)}
        支付方式: ${paymentMethod === 'cash' ? '现金' : paymentMethod === 'card' ? '银行卡' : '移动支付'}
    `;
    
    if (confirm(confirmMessage)) {
        // 模拟保存订单
        console.log('订单已完成:', {
            orderNumber,
            customer: currentCustomer,
            items: cart,
            total: finalTotal,
            paymentMethod
        });
        
        alert(`✅ 销售完成！\n订单号: ${orderNumber}\n金额: £${finalTotal.toFixed(2)}`);
        
        // 清空购物车
        cart = [];
        currentCustomer = null;
        document.getElementById('customer-select').value = '';
        document.getElementById('customer-info').style.display = 'none';
        
        // 更新显示
        updateCartDisplay();
        updateOrderSummary();
        closeCheckout();
        
        // 可选：打印收据
        if (confirm('是否打印收据？')) {
            printReceipt(orderNumber, finalTotal);
        }
    }
}

// 打印收据
function printReceipt(orderNumber, total) {
    console.log(`打印收据: ${orderNumber}, £${total.toFixed(2)}`);
    alert(`收据打印功能（待实现）\n订单号: ${orderNumber}`);
    // 这里可以集成实际的打印功能
}

// 工具函数
function formatPrice(price) {
    return `£${price.toFixed(2)}`;
}

function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('zh-CN');
}

function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}







