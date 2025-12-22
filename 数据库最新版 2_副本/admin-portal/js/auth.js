// =====================================================
// Summit Gear & Adventures - 权限管理系统
// =====================================================

class PermissionManager {
    constructor() {
        this.user = this.getCurrentUser();
        this.rolePermissions = this.initializeRolePermissions();
    }
    
    /**
     * 初始化角色权限配置
     */
    initializeRolePermissions() {
        return {
            // 超级管理员 - 所有权限
            'super_admin': {
                pages: ['*'],  // 所有页面
                dashboardSections: ['*'],  // Dashboard所有部分
                operations: ['*']  // 所有操作
            },
            
            // 业务管理员 - 销售、库存、采购
            'business_admin': {
                pages: [
                    'index.html',
                    'sales-analytics.html'
                ],
                dashboardSections: [
                    'sales-metrics',      // 销售指标
                    'inventory-alerts',   // 库存警告
                    'purchase-orders',    // 采购订单
                    'sales-chart',        // 销售图表
                    'hot-products',       // 热门产品
                    'branch-performance'  // 分店业绩
                ],
                operations: [
                    'view-sales',
                    'export-sales',
                    'view-inventory',
                    'approve-purchase',
                    'view-customers'
                ]
            },
            
            // 人员管理员 - 员工、绩效、工资
            'hr_admin': {
                pages: [
                    'index.html',
                    'employee-performance.html'
                ],
                dashboardSections: [
                    'employee-stats',     // 员工统计
                    'performance-alerts', // 绩效提醒
                    'payroll-summary'     // 工资汇总
                ],
                operations: [
                    'view-employees',
                    'edit-employees',
                    'view-performance',
                    'edit-performance',
                    'view-payroll',
                    'edit-payroll'
                ]
            },
            
            // 资源管理员 - 系统、分店、权限
            'resource_admin': {
                pages: [
                    'index.html',
                    'settings.html'
                ],
                dashboardSections: [
                    'system-status',      // 系统状态
                    'backup-status',      // 备份状态
                    'user-activity'       // 用户活动
                ],
                operations: [
                    'view-settings',
                    'edit-settings',
                    'manage-branches',
                    'manage-users',
                    'view-logs',
                    'backup-restore'
                ]
            }
        };
    }
    
    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        const userStr = sessionStorage.getItem('adminUser');
        if (!userStr) {
            return null;
        }
        return JSON.parse(userStr);
    }
    
    /**
     * 设置当前用户（登录时调用）
     */
    setCurrentUser(userData) {
        sessionStorage.setItem('adminUser', JSON.stringify(userData));
        this.user = userData;
    }
    
    /**
     * 用户登出
     */
    logout() {
        sessionStorage.removeItem('adminUser');
        window.location.href = '../index.html';
    }
    
    /**
     * 检查是否有访问某个页面的权限
     */
    hasPageAccess(pageName) {
        if (!this.user) {
            return false;
        }
        
        const userType = this.user.user_type;
        const allowedPages = this.rolePermissions[userType]?.pages || [];
        
        // 超级管理员有所有权限
        if (allowedPages.includes('*')) {
            return true;
        }
        
        return allowedPages.includes(pageName);
    }
    
    /**
     * 检查是否有查看某个Dashboard部分的权限
     */
    hasDashboardSectionAccess(sectionName) {
        if (!this.user) {
            return false;
        }
        
        const userType = this.user.user_type;
        const allowedSections = this.rolePermissions[userType]?.dashboardSections || [];
        
        if (allowedSections.includes('*')) {
            return true;
        }
        
        return allowedSections.includes(sectionName);
    }
    
    /**
     * 检查是否有执行某个操作的权限
     */
    hasOperationPermission(operation) {
        if (!this.user) {
            return false;
        }
        
        const userType = this.user.user_type;
        const allowedOperations = this.rolePermissions[userType]?.operations || [];
        
        if (allowedOperations.includes('*')) {
            return true;
        }
        
        return allowedOperations.includes(operation);
    }
    
    /**
     * 检查当前页面访问权限
     */
    checkPageAccess() {
        if (!this.user) {
            alert('请先登录');
            window.location.href = '../index.html';
            return false;
        }
        
        const currentPage = window.location.pathname.split('/').pop();
        
        if (!this.hasPageAccess(currentPage)) {
            alert('您没有权限访问此页面');
            window.location.href = 'index.html';
            return false;
        }
        
        return true;
    }
    
    /**
     * 过滤导航菜单（隐藏无权限的菜单项）
     */
    filterNavigation() {
        if (!this.user) return;
        
        const userType = this.user.user_type;
        
        // 隐藏无权限的菜单部分
        document.querySelectorAll('[data-role-required]').forEach(element => {
            const requiredRoles = element.dataset.roleRequired.split(',');
            
            if (!requiredRoles.includes(userType) && userType !== 'super_admin') {
                element.style.display = 'none';
            }
        });
        
        // 隐藏无权限的单个菜单项
        document.querySelectorAll('[data-permission-required]').forEach(element => {
            const requiredPermission = element.dataset.permissionRequired;
            
            if (!this.hasOperationPermission(requiredPermission)) {
                element.style.display = 'none';
            }
        });
    }
    
    /**
     * 过滤Dashboard内容
     */
    filterDashboard() {
        if (!this.user) return;
        
        document.querySelectorAll('[data-dashboard-section]').forEach(section => {
            const sectionName = section.dataset.dashboardSection;
            
            if (!this.hasDashboardSectionAccess(sectionName)) {
                section.style.display = 'none';
            }
        });
    }
    
    /**
     * 获取用户角色的中文名称
     */
    getRoleName() {
        if (!this.user) return '未登录';
        
        const roleNames = {
            'super_admin': '超级管理员',
            'business_admin': '业务管理员',
            'hr_admin': '人员管理员',
            'resource_admin': '资源管理员'
        };
        
        return roleNames[this.user.user_type] || '未知角色';
    }
    
    /**
     * 显示用户信息
     */
    displayUserInfo() {
        if (!this.user) return;
        
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
            userNameElement.innerHTML = `
                👤 ${this.user.name} 
                <span style="color: #10B981; font-size: 0.85em;">(${this.getRoleName()})</span>
            `;
        }
    }
    
    /**
     * 记录访问日志（实际应用中发送到服务器）
     */
    logAccess(action, resource) {
        const logEntry = {
            employee_id: this.user?.employee_id,
            user_type: this.user?.user_type,
            action: action,
            resource: resource,
            timestamp: new Date().toISOString(),
            ip_address: 'client-side',  // 实际应用中从服务器获取
            user_agent: navigator.userAgent
        };
        
        console.log('访问日志:', logEntry);
        
        // 实际应用中发送到服务器
        // fetch('/api/admin/log-access', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(logEntry)
        // });
    }
}

// 创建全局权限管理器实例
const permissionManager = new PermissionManager();

// 页面加载时自动检查权限（已禁用 - 直接打开页面，不需要登录）
// document.addEventListener('DOMContentLoaded', function() {
//     // 检查页面访问权限
//     if (permissionManager.checkPageAccess()) {
//         // 过滤导航菜单
//         permissionManager.filterNavigation();
//         
//         // 过滤Dashboard内容
//         permissionManager.filterDashboard();
//         
//         // 显示用户信息
//         permissionManager.displayUserInfo();
//         
//         // 记录页面访问
//         const currentPage = window.location.pathname.split('/').pop();
//         permissionManager.logAccess('page_view', currentPage);
//     }
// });

// 登出功能
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('确定要退出登录吗？')) {
                permissionManager.logAccess('logout', 'admin-portal');
                permissionManager.logout();
            }
        });
    }
});

// 导出权限管理器供其他模块使用
window.permissionManager = permissionManager;

console.log('✅ 权限管理系统已加载');

