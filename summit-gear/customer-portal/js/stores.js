// =====================================================
// Summit Gear & Adventures - Stores Page JavaScript
// 门店搜索和过滤功能
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    initStoreSearch();
    initStoreActions();
});

// 门店数据（用于增强搜索）
const storesData = [
    { 
        name: 'London Store', 
        city: 'London', 
        postcode: 'W1D 2HG',
        address: '123 Oxford Street',
        country: 'England',
        keywords: ['london', 'oxford', 'w1d', 'england', 'central']
    },
    { 
        name: 'Manchester Store', 
        city: 'Manchester', 
        postcode: 'M1 1WR',
        address: '45 Market Street',
        country: 'England',
        keywords: ['manchester', 'market', 'm1', 'england', 'north']
    },
    { 
        name: 'Edinburgh Store', 
        city: 'Edinburgh', 
        postcode: 'EH1 1AB',
        address: '78 Princes Street',
        country: 'Scotland',
        keywords: ['edinburgh', 'princes', 'eh1', 'scotland']
    },
    { 
        name: 'Birmingham Store', 
        city: 'Birmingham', 
        postcode: 'B2 4QA',
        address: '12 New Street',
        country: 'England',
        keywords: ['birmingham', 'new street', 'b2', 'england', 'midlands']
    },
    { 
        name: 'Cardiff Store', 
        city: 'Cardiff', 
        postcode: 'CF10 1AA',
        address: '34 Queen Street',
        country: 'Wales',
        keywords: ['cardiff', 'queen', 'cf10', 'wales']
    }
];

// 初始化搜索功能
function initStoreSearch() {
    const searchInput = document.getElementById('storeSearch');
    const searchBtn = document.querySelector('.search-box-large .btn');
    
    if (!searchInput) return;
    
    // 搜索按钮点击
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            performStoreSearch();
        });
    }
    
    // 回车键搜索
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            performStoreSearch();
        }
    });
    
    // 实时搜索（输入时）
    searchInput.addEventListener('input', function() {
        // 延迟搜索，避免频繁触发
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            performStoreSearch();
        }, 300);
    });
}

// 执行搜索
function performStoreSearch() {
    const searchInput = document.getElementById('storeSearch');
    const searchTerm = searchInput.value.toLowerCase().trim();
    const storeCards = document.querySelectorAll('.store-card');
    
    let visibleCount = 0;
    
    storeCards.forEach((card, index) => {
        const storeName = card.querySelector('h2')?.textContent.toLowerCase() || '';
        const storeInfo = card.querySelector('.store-info')?.textContent.toLowerCase() || '';
        
        // 从 storesData 获取额外关键词
        const storeData = storesData[index];
        const keywords = storeData ? storeData.keywords.join(' ') : '';
        
        // 搜索匹配
        const allText = `${storeName} ${storeInfo} ${keywords}`;
        const matches = searchTerm === '' || allText.includes(searchTerm);
        
        if (matches) {
            card.style.display = '';
            card.style.animation = 'fadeIn 0.3s ease-out';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // 显示搜索结果信息
    updateSearchResults(visibleCount, storeCards.length, searchTerm);
}

// 更新搜索结果提示
function updateSearchResults(visible, total, searchTerm) {
    let resultsDiv = document.getElementById('searchResults');
    
    // 如果不存在，创建结果提示区域
    if (!resultsDiv) {
        resultsDiv = document.createElement('div');
        resultsDiv.id = 'searchResults';
        resultsDiv.style.cssText = `
            text-align: center;
            padding: 1rem;
            margin-bottom: 1rem;
            border-radius: 0.5rem;
            font-weight: 500;
        `;
        const storesList = document.querySelector('.stores-list');
        if (storesList) {
            storesList.parentNode.insertBefore(resultsDiv, storesList);
        }
    }
    
    if (searchTerm === '') {
        resultsDiv.style.display = 'none';
    } else if (visible === 0) {
        resultsDiv.style.display = 'block';
        resultsDiv.style.background = '#FEE2E2';
        resultsDiv.style.color = '#991B1B';
        resultsDiv.innerHTML = `
            😕 No stores found for "<strong>${searchTerm}</strong>"
            <br><small>Try searching for: London, Manchester, Edinburgh, Birmingham, Cardiff</small>
        `;
    } else {
        resultsDiv.style.display = 'block';
        resultsDiv.style.background = '#D1FAE5';
        resultsDiv.style.color = '#065F46';
        resultsDiv.innerHTML = `
            ✅ Found <strong>${visible}</strong> store${visible > 1 ? 's' : ''} matching "<strong>${searchTerm}</strong>"
            ${visible < total ? `<button onclick="clearStoreSearch()" style="margin-left: 1rem; padding: 0.25rem 0.75rem; background: #065F46; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">Show All</button>` : ''}
        `;
    }
}

// 清除搜索
function clearStoreSearch() {
    const searchInput = document.getElementById('storeSearch');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // 显示所有门店
    document.querySelectorAll('.store-card').forEach(card => {
        card.style.display = '';
    });
    
    // 隐藏搜索结果提示
    const resultsDiv = document.getElementById('searchResults');
    if (resultsDiv) {
        resultsDiv.style.display = 'none';
    }
    
    showNotification('Search cleared - showing all stores', 'info');
}

// 初始化门店操作按钮
function initStoreActions() {
    // 获取方向按钮
    document.querySelectorAll('.store-actions .btn-primary').forEach((btn, index) => {
        if (btn.textContent.includes('Directions')) {
            btn.addEventListener('click', function() {
                const store = storesData[index];
                if (store) {
                    const address = encodeURIComponent(`${store.address}, ${store.city}, ${store.postcode}`);
                    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
                    window.open(mapsUrl, '_blank');
                    showNotification(`Opening directions to ${store.name}...`, 'info');
                }
            });
        }
    });
    
    // 电话按钮
    document.querySelectorAll('.store-actions .btn-secondary').forEach(btn => {
        if (btn.textContent.includes('Call')) {
            btn.addEventListener('click', function() {
                const card = btn.closest('.store-card');
                const phoneText = card.querySelector('.store-info')?.textContent || '';
                const phoneMatch = phoneText.match(/📞\s*([\d\s]+)/);
                if (phoneMatch) {
                    const phone = phoneMatch[1].replace(/\s/g, '');
                    window.location.href = `tel:${phone}`;
                    showNotification(`Calling ${phone}...`, 'info');
                }
            });
        }
        
        // 邮件按钮
        if (btn.textContent.includes('Email')) {
            btn.addEventListener('click', function() {
                const card = btn.closest('.store-card');
                const emailText = card.querySelector('.store-info')?.textContent || '';
                const emailMatch = emailText.match(/📧\s*(\S+@\S+)/);
                if (emailMatch) {
                    window.location.href = `mailto:${emailMatch[1]}`;
                    showNotification(`Opening email to ${emailMatch[1]}...`, 'info');
                }
            });
        }
    });
}

// 添加动画样式
if (!document.getElementById('storeAnimationStyles')) {
    const style = document.createElement('style');
    style.id = 'storeAnimationStyles';
    style.textContent = `
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .store-card {
            transition: all 0.3s ease;
        }
        
        .store-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }
    `;
    document.head.appendChild(style);
}

console.log('✅ Stores.js loaded successfully');

