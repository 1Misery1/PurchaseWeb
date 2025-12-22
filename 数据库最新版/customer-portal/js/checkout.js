// =====================================================
// Checkout Page JavaScript
// =====================================================

let deliveryMethod = 'pickup';
let deliveryFee = 0;
let paymentMethod = 'card';
let pointsUsed = 0;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    loadOrderSummary();
    updateTotals();
});

// 加载订单摘要
function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('summitGearCart')) || [];
    const summaryItemsContainer = document.getElementById('summaryItems');
    
    if (cart.length === 0) {
        summaryItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">购物车为空</p>';
        return;
    }
    
    let html = '';
    cart.forEach(item => {
        html += `
            <div class="summary-item">
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-qty">x${item.quantity}</div>
                <div class="summary-item-price">£${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `;
    });
    
    summaryItemsContainer.innerHTML = html;
}

// 选择配送方式
function selectDelivery(method) {
    // 移除所有选中状态
    document.querySelectorAll('.delivery-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('input[type="radio"]').checked = false;
    });
    
    // 添加选中状态
    event.currentTarget.classList.add('selected');
    event.currentTarget.querySelector('input[type="radio"]').checked = true;
    
    deliveryMethod = method;
    
    // 更新配送费用
    switch(method) {
        case 'pickup':
            deliveryFee = 0;
            break;
        case 'standard':
            deliveryFee = 0; // 满£50免费
            break;
        case 'express':
            deliveryFee = 9.99;
            break;
        case 'nextday':
            deliveryFee = 14.99;
            break;
    }
    
    updateTotals();
}

// 选择支付方式
function selectPayment(method) {
    // 移除所有选中状态
    document.querySelectorAll('.payment-method').forEach(option => {
        option.classList.remove('selected');
    });
    
    // 添加选中状态
    event.currentTarget.classList.add('selected');
    paymentMethod = method;
    
    // 显示/隐藏信用卡详情
    const cardDetails = document.getElementById('cardDetails');
    if (method === 'card') {
        cardDetails.style.display = 'block';
    } else {
        cardDetails.style.display = 'none';
    }
}

// 应用优惠码
function applyPromoCode() {
    const promoCode = document.getElementById('promoCode').value.trim().toUpperCase();
    
    if (!promoCode) {
        alert('请输入优惠码');
        return;
    }
    
    // 示例优惠码
    const validCodes = {
        'SAVE10': { type: 'percentage', value: 10, description: '全场9折' },
        'SAVE20': { type: 'percentage', value: 20, description: '全场8折' },
        'FREE': { type: 'freeShipping', value: 0, description: '免费配送' }
    };
    
    if (validCodes[promoCode]) {
        const discount = validCodes[promoCode];
        alert(`✅ 优惠码已应用！${discount.description}`);
        // 这里可以添加优惠码逻辑
        updateTotals();
    } else {
        alert('❌ 无效的优惠码');
    }
}

// 更新积分抵扣
function updatePointsDiscount() {
    const pointsInput = document.getElementById('pointsToUse');
    pointsUsed = parseInt(pointsInput.value) || 0;
    
    // 验证积分数量
    if (pointsUsed > 2450) {
        alert('积分不足！您只有2,450积分');
        pointsInput.value = 2450;
        pointsUsed = 2450;
    }
    
    if (pointsUsed < 0) {
        pointsInput.value = 0;
        pointsUsed = 0;
    }
    
    updateTotals();
}

// 更新总计
function updateTotals() {
    const cart = JSON.parse(localStorage.getItem('summitGearCart')) || [];
    
    // 计算商品小计
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 会员折扣（15%）
    const memberDiscount = subtotal * 0.15;
    
    // 积分抵扣（100积分 = £1）
    const pointsDiscount = pointsUsed / 100;
    
    // 计算最终总额
    let finalTotal = subtotal - memberDiscount - pointsDiscount + deliveryFee;
    
    // 更新显示
    document.getElementById('subtotal').textContent = `£${subtotal.toFixed(2)}`;
    document.getElementById('memberDiscount').textContent = `-£${memberDiscount.toFixed(2)}`;
    
    // 显示/隐藏积分抵扣行
    if (pointsUsed > 0) {
        document.getElementById('pointsDiscountRow').style.display = 'flex';
        document.getElementById('pointsDiscount').textContent = `-£${pointsDiscount.toFixed(2)}`;
    } else {
        document.getElementById('pointsDiscountRow').style.display = 'none';
    }
    
    // 配送费用
    if (deliveryFee === 0) {
        document.getElementById('deliveryFee').textContent = '免费';
    } else {
        document.getElementById('deliveryFee').textContent = `£${deliveryFee.toFixed(2)}`;
    }
    
    document.getElementById('finalTotal').textContent = `£${finalTotal.toFixed(2)}`;
    
    // 计算可获得积分（每£1获得1积分）
    const earnPoints = Math.floor(finalTotal);
    document.getElementById('earnPoints').textContent = earnPoints;
}

// 下单
function placeOrder() {
    // 验证表单
    const fullName = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    
    if (!fullName || !phone || !email) {
        alert('❌ 请填写所有必填项！');
        return;
    }
    
    // 如果是配送，需要地址
    if (deliveryMethod !== 'pickup') {
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const postcode = document.getElementById('postcode').value;
        
        if (!address || !city || !postcode) {
            alert('❌ 请填写完整的配送地址！');
            return;
        }
    }
    
    // 信用卡支付验证
    if (paymentMethod === 'card') {
        // 这里应该验证信用卡信息
        // 简化处理
    }
    
    // 创建订单
    const cart = JSON.parse(localStorage.getItem('summitGearCart')) || [];
    const finalTotal = document.getElementById('finalTotal').textContent;
    
    const order = {
        orderNumber: 'SO-' + Date.now(),
        date: new Date().toISOString(),
        customer: {
            name: fullName,
            phone: phone,
            email: email
        },
        items: cart,
        deliveryMethod: deliveryMethod,
        paymentMethod: paymentMethod,
        pointsUsed: pointsUsed,
        total: finalTotal,
        status: 'processing'
    };
    
    // 保存订单到本地存储（实际应该发送到服务器）
    let orders = JSON.parse(localStorage.getItem('summitGearOrders')) || [];
    orders.push(order);
    localStorage.setItem('summitGearOrders', JSON.stringify(orders));
    
    // 扣除使用的积分
    if (pointsUsed > 0) {
        // 更新积分（实际应该通过API）
        console.log(`使用了 ${pointsUsed} 积分`);
    }
    
    // 清空购物车
    localStorage.removeItem('summitGearCart');
    
    // 跳转到订单成功页面
    window.location.href = `order-success.html?order=${order.orderNumber}`;
}

// 格式化信用卡号输入
document.addEventListener('DOMContentLoaded', function() {
    const cardInput = document.querySelector('input[placeholder="1234 5678 9012 3456"]');
    if (cardInput) {
        cardInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\s/g, '');
            let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
            e.target.value = formattedValue;
        });
    }
    
    const expiryInput = document.querySelector('input[placeholder="MM/YY"]');
    if (expiryInput) {
        expiryInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = value.slice(0, 2) + '/' + value.slice(2, 4);
            }
            e.target.value = value;
        });
    }
});

console.log('✅ Checkout页面已加载');







