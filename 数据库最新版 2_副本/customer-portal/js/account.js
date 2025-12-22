// 账户页面导航
document.addEventListener('DOMContentLoaded', function() {
    // 处理侧边栏菜单点击
    const menuLinks = document.querySelectorAll('.account-menu a');
    const contentSections = document.querySelectorAll('.content-section');
    
    // 从URL hash加载对应section
    function loadSectionFromHash() {
        const hash = window.location.hash.substring(1) || 'overview';
        showSection(hash);
    }
    
    function showSection(sectionId) {
        // 隐藏所有section
        contentSections.forEach(section => {
            section.classList.remove('active');
        });
        
        // 移除所有菜单active状态
        menuLinks.forEach(link => {
            link.classList.remove('active');
        });
        
        // 显示目标section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // 激活对应菜单项
        const targetLink = document.querySelector(`.account-menu a[href="#${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }
    
    // 菜单点击事件
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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


