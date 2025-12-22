// =====================================================
// Summit Gear & Adventures - Supplier Portal JavaScript
// =====================================================

// 页面导航管理
document.addEventListener('DOMContentLoaded', function() {
    console.log('Supplier Portal Loaded');
    
    // 处理侧边栏菜单点击
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // 从URL hash加载对应section
    function loadSectionFromHash() {
        const hash = window.location.hash.substring(1) || 'dashboard';
        showSection(hash);
    }
    
    function showSection(sectionId) {
        // 隐藏所有section
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 移除所有菜单active状态
        menuItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // 显示目标section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // 激活对应菜单项
        const targetLink = document.querySelector(`.menu-item[href="#${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }
    
    // 菜单点击事件
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            window.location.hash = sectionId;
            showSection(sectionId);
        });
    });
    
    // 监听hash变化
    window.addEventListener('hashchange', loadSectionFromHash);
    
    // 初始加载
    loadSectionFromHash();
});

// 订单确认功能
function confirmOrder(orderId) {
    if (confirm(`确定要确认订单 ${orderId} 吗？`)) {
        console.log(`订单 ${orderId} 已确认`);
        alert(`订单 ${orderId} 已确认！`);
        // 这里可以调用API更新订单状态
    }
}

// 拒绝订单功能
function rejectOrder(orderId) {
    const reason = prompt(`请输入拒绝订单 ${orderId} 的原因：`);
    if (reason) {
        console.log(`订单 ${orderId} 已拒绝，原因: ${reason}`);
        alert(`订单 ${orderId} 已拒绝`);
        // 这里可以调用API更新订单状态
    }
}

// 更新发货信息
function updateShipping(orderId) {
    console.log(`更新订单 ${orderId} 的发货信息`);
    alert('发货信息更新功能（待开发）');
    // 这里可以打开一个模态框让供应商填写发货信息
}

// 追踪物流
function trackShipment(trackingNumber) {
    console.log(`追踪物流: ${trackingNumber}`);
    alert(`追踪号: ${trackingNumber}\n物流信息（待实现）`);
    // 这里可以调用物流API获取实时信息
}

// 更新产品价格
function updateProductPrice(productSku) {
    console.log(`更新产品 ${productSku} 的价格`);
    alert('产品价格更新功能（待开发）');
    // 这里可以打开价格更新表单
}

// 查看产品统计
function viewProductStats(productSku) {
    console.log(`查看产品 ${productSku} 的统计数据`);
    alert('产品统计功能（待开发）');
    // 这里可以显示销售图表和详细数据
}

// 下载发票PDF
function downloadInvoicePDF(invoiceNumber) {
    console.log(`下载发票: ${invoiceNumber}`);
    alert(`正在下载发票 ${invoiceNumber}...`);
    // 这里可以调用API生成并下载PDF
}

// 导出报告
function exportReport(format) {
    console.log(`导出报告，格式: ${format}`);
    alert(`正在导出${format}格式报告...`);
    // 这里可以生成Excel或PDF报告
}

// 格式化价格
function formatPrice(price) {
    return '£' + price.toFixed(2);
}

// 格式化日期
function formatDate(date) {
    const d = new Date(date);
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return d.toLocaleDateString('zh-CN', options);
}

// 计算距离到期日的天数
function calculateDaysUntilDue(dueDate) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}







