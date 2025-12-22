// =====================================================
// Customer Management JavaScript
// =====================================================

// 打开注册模态窗口
function openRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

// 关闭注册模态窗口
function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
}

// 搜索客户
function searchCustomer() {
    const query = document.getElementById('customerSearch').value.toLowerCase();
    
    if (!query) {
        alert('请输入搜索内容');
        return;
    }
    
    const cards = document.querySelectorAll('.customer-card');
    let found = 0;
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
            card.style.display = 'block';
            found++;
        } else {
            card.style.display = 'none';
        }
    });
    
    if (found === 0) {
        alert('未找到匹配的客户');
    }
}

// 清空搜索
function clearSearch() {
    document.getElementById('customerSearch').value = '';
    const cards = document.querySelectorAll('.customer-card');
    cards.forEach(card => {
        card.style.display = 'block';
    });
}

// 扫描会员卡
function scanMemberCard() {
    alert('📱 打开扫描器...\n\n实际应用中会启动摄像头或扫码设备\n扫描客户会员卡二维码');
}

// 查看购买历史
function viewPurchaseHistory(memberId) {
    alert(`📊 查看购买历史\n\n会员: ${memberId}\n\n实际应用中会显示完整的购买记录列表`);
}

// 调整积分
function adjustPoints(memberId) {
    const adjustment = prompt(`调整积分 (${memberId})\n\n输入调整数量（正数为增加，负数为减少）：`);
    
    if (adjustment) {
        const points = parseInt(adjustment);
        if (isNaN(points)) {
            alert('请输入有效的数字');
            return;
        }
        
        const reason = prompt('请输入调整原因：');
        if (reason) {
            alert(`✅ 积分调整成功！\n\n会员: ${memberId}\n调整: ${points > 0 ? '+' : ''}${points}积分\n原因: ${reason}`);
        }
    }
}

// 编辑客户信息
function editCustomer(memberId) {
    alert(`✏️ 编辑客户信息\n\n会员: ${memberId}\n\n实际应用中会打开编辑表单`);
}

// 发送邮件
function sendEmail(memberId) {
    alert(`📧 发送邮件\n\n会员: ${memberId}\n\n实际应用中会打开邮件编辑器`);
}

// 表单提交
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('✅ 新客户注册成功！\n\n会员卡号已生成并发送到客户手机。');
            closeRegisterModal();
        });
    }
    
    // 实时搜索
    const searchInput = document.getElementById('customerSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCustomer();
            }
        });
    }
});

console.log('✅ Customers管理脚本已加载');







