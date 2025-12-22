// =====================================================
// Summit Gear & Adventures - Admin Dashboard JavaScript
// =====================================================

// 页面导航功能
document.addEventListener('DOMContentLoaded', function() {
    // 侧边栏菜单点击事件
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有活动状态
            menuItems.forEach(mi => mi.classList.remove('active'));
            contentSections.forEach(cs => cs.classList.remove('active'));
            
            // 添加活动状态
            this.classList.add('active');
            
            // 获取目标section
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                targetSection.classList.add('active');
                // 滚动到顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
    
    // 通知按钮点击
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', function() {
            alert('📬 通知功能：\n\n' +
                  '1. 库存警告：23个商品低于补货点\n' +
                  '2. 采购订单：PO-2025-0045交货逾期\n' +
                  '3. 员工绩效：5位员工需要评估');
        });
    }
    
    // 退出登录
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                alert('退出成功！将返回登录页面...');
                // 实际应用中跳转到登录页
                // window.location.href = 'login.html';
            }
        });
    }
    
    // 初始化示例数据和交互功能
    initializeDashboard();
    initializeSalesReport();
    initializeInventory();
    initializeCustomerManagement();
    initializeEmployeeManagement();
});

// 初始化Dashboard功能
function initializeDashboard() {
    // 刷新数据按钮
    const refreshBtn = document.querySelector('#dashboard .btn-secondary');
    if (refreshBtn && refreshBtn.textContent.includes('刷新')) {
        refreshBtn.addEventListener('click', function() {
            this.textContent = '🔄 正在刷新...';
            this.disabled = true;
            
            setTimeout(() => {
                this.textContent = '🔄 刷新数据';
                this.disabled = false;
                showNotification('数据已更新！', 'success');
            }, 1500);
        });
    }
    
    // 图表柱状动画
    const chartBars = document.querySelectorAll('.chart-bar');
    chartBars.forEach(bar => {
        bar.addEventListener('mouseenter', function() {
            const height = this.style.height;
            const value = Math.round(parseFloat(height) * 200);
            this.setAttribute('data-tooltip', `销售额: £${value}`);
        });
    });
    
    // 分店详情按钮
    const branchDetailBtns = document.querySelectorAll('#dashboard .data-table .btn-small');
    branchDetailBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const branch = row.cells[0].textContent;
            showBranchDetails(branch);
        });
    });
    
    // 警告处理按钮
    const alertBtns = document.querySelectorAll('.alert-item .btn-small');
    alertBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const alertContent = this.previousElementSibling.querySelector('strong').textContent;
            alert(`处理警告：\n\n${alertContent}\n\n实际应用中会跳转到相应管理页面。`);
        });
    });
}

// 初始化销售报表功能
function initializeSalesReport() {
    const applyFilterBtn = document.querySelector('#sales .filters-bar .btn-primary');
    if (applyFilterBtn && applyFilterBtn.textContent.includes('应用')) {
        applyFilterBtn.addEventListener('click', function() {
            const dateRange = document.querySelector('#sales .filters-bar select:nth-child(1)').value;
            const branch = document.querySelector('#sales .filters-bar select:nth-child(2)').value;
            const category = document.querySelector('#sales .filters-bar select:nth-child(3)').value;
            
            showNotification(`正在筛选：${dateRange} - ${branch} - ${category}`, 'info');
        });
    }
}

// 初始化库存管理功能
function initializeInventory() {
    // 搜索功能
    const searchBtn = document.querySelector('#inventory .btn-primary');
    if (searchBtn && searchBtn.textContent.includes('搜索')) {
        searchBtn.addEventListener('click', function() {
            const searchInput = document.querySelector('#inventory .search-input');
            const searchTerm = searchInput.value;
            
            if (searchTerm) {
                showNotification(`搜索商品：${searchTerm}`, 'info');
            } else {
                alert('请输入搜索关键词');
            }
        });
    }
    
    // 补货按钮
    const reorderBtns = document.querySelectorAll('#inventory .btn-primary');
    reorderBtns.forEach(btn => {
        if (btn.textContent.includes('补货')) {
            btn.addEventListener('click', function() {
                const row = this.closest('tr');
                const product = row.cells[1].textContent;
                const qty = row.cells[3].textContent;
                
                if (confirm(`确认为 "${product}" 创建补货订单？\n当前库存：${qty}`)) {
                    showNotification(`已创建补货订单：${product}`, 'success');
                }
            });
        }
    });
}

// 初始化客户管理功能
function initializeCustomerManagement() {
    const customerBtns = document.querySelectorAll('#customers .data-table .btn-small');
    customerBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const customerName = row.cells[1].textContent;
            const action = this.textContent;
            
            if (action.includes('查看')) {
                showCustomerProfile(customerName);
            } else if (action.includes('编辑')) {
                alert(`编辑客户：${customerName}\n\n实际应用中会打开编辑表单。`);
            }
        });
    });
}

// 初始化员工管理功能
function initializeEmployeeManagement() {
    const addEmployeeBtn = document.querySelector('#employees .btn-primary');
    if (addEmployeeBtn && addEmployeeBtn.textContent.includes('添加')) {
        addEmployeeBtn.addEventListener('click', function() {
            alert('打开添加员工表单...\n\n实际应用中会显示员工信息输入表单。');
        });
    }
    
    const employeeBtns = document.querySelectorAll('#employees .data-table .btn-small');
    employeeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const employeeName = row.cells[1].textContent;
            const action = this.textContent;
            
            if (action.includes('查看')) {
                showEmployeeProfile(employeeName);
            } else if (action.includes('编辑')) {
                alert(`编辑员工：${employeeName}\n\n实际应用中会打开编辑表单。`);
            }
        });
    });
}

// 显示分店详情
function showBranchDetails(branch) {
    alert(`📍 ${branch} 分店详情\n\n` +
          `销售额：查看详细销售报表\n` +
          `库存：查看库存明细\n` +
          `员工：查看员工列表\n\n` +
          `实际应用中会打开详细页面。`);
}

// 显示客户档案
function showCustomerProfile(customerName) {
    alert(`👤 客户档案：${customerName}\n\n` +
          `基本信息\n` +
          `购买历史\n` +
          `积分记录\n` +
          `会员等级变更\n\n` +
          `实际应用中会显示完整的客户档案页面。`);
}

// 显示员工档案
function showEmployeeProfile(employeeName) {
    alert(`👔 员工档案：${employeeName}\n\n` +
          `基本信息\n` +
          `入职日期\n` +
          `绩效记录\n` +
          `权限设置\n\n` +
          `实际应用中会显示完整的员工档案页面。`);
}

// 通知系统
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        info: '#3B82F6'
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
    const style = document.createElement('style');
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
    
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 导出报表功能（示例）
function exportReport(format = 'excel') {
    showNotification(`正在导出${format.toUpperCase()}报表...`, 'info');
    
    setTimeout(() => {
        showNotification(`报表导出成功！`, 'success');
    }, 2000);
}

// 数据统计功能
function calculateStatistics(data) {
    // 实际应用中处理真实数据
    return {
        total: data.length,
        average: 0,
        max: 0,
        min: 0
    };
}

// 实时更新时间
function updateCurrentTime() {
    const dateDisplay = document.querySelector('.date-display');
    if (dateDisplay) {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
        };
        dateDisplay.textContent = '📅 ' + now.toLocaleDateString('zh-CN', options);
    }
}

// 每分钟更新一次时间
setInterval(updateCurrentTime, 60000);
updateCurrentTime();

console.log('✅ Admin Dashboard已加载完成');

// =====================================================
// 图表增强功能
// =====================================================

// 模拟图表数据生成
function generateChartData() {
    const data = {
        sales: [],
        labels: []
    };
    
    // 生成最近30天的数据
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        data.labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
        data.sales.push(Math.floor(Math.random() * 5000) + 3000);
    }
    
    return data;
}

// 初始化图表（实际应用中使用Chart.js或ApexCharts）
function initCharts() {
    console.log('📊 图表数据已准备:', generateChartData());
    
    // 实际应用中会在这里初始化真实图表
    // 例如使用 Chart.js:
    /*
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: '销售趋势' }
            }
        }
    });
    */
}

// 数据导出功能增强
function exportAnalyticsData(type = 'excel') {
    const formats = {
        excel: { ext: 'xlsx', icon: '📊' },
        pdf: { ext: 'pdf', icon: '📄' },
        csv: { ext: 'csv', icon: '📋' }
    };
    
    const format = formats[type] || formats.excel;
    
    showNotification(`${format.icon} 正在生成${type.toUpperCase()}文件...`, 'info');
    
    setTimeout(() => {
        showNotification(`✅ ${type.toUpperCase()}文件已导出成功！`, 'success');
        // 实际应用中会触发文件下载
        // downloadFile(`sales-report-${new Date().toISOString()}.${format.ext}`);
    }, 2000);
}

// 初始化页面时加载图表
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
} else {
    initCharts();
}

