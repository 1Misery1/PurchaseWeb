// =====================================================
// Inventory Management JavaScript - Database Integration
// =====================================================

const API_BASE = '/summit-gear/api';
let allStock = [];
let currentBranchId = 1;

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Inventory Management Loading...');
    
    // Check login
    const isLoggedIn = localStorage.getItem('staffLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Get branch ID
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff') || '{}');
    currentBranchId = currentStaff.branch_id || 1;
    
    // Update staff display
    updateStaffDisplay();
    
    // Load inventory stats
    await loadInventoryStats();
    
    // Load inventory list
    await loadInventory();
    
    // Setup search
    setupSearch();
    
    console.log('✅ Inventory Management loaded');
});

function updateStaffDisplay() {
    const currentStaff = JSON.parse(localStorage.getItem('currentStaff') || '{}');
    
    const staffNameEl = document.querySelector('.staff-name');
    if (staffNameEl && currentStaff.name) {
        staffNameEl.textContent = `👤 ${currentStaff.name} (Staff)`;
    }
    
    const branchInfoEl = document.querySelector('.branch-info');
    if (branchInfoEl && currentStaff.branch_name) {
        branchInfoEl.textContent = `📍 ${currentStaff.branch_name}`;
    }
    
    // Update time
    updateTime();
    setInterval(updateTime, 1000);
}

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }
}

// Load inventory statistics
async function loadInventoryStats() {
    try {
        const response = await fetch(`${API_BASE}/stock.php?action=stats&branch_id=${currentBranchId}`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.data;
            const statCards = document.querySelectorAll('.stat-card .stat-value');
            
            if (statCards.length >= 4) {
                statCards[0].textContent = stats.good_stock;
                statCards[0].className = 'stat-value good';
                
                statCards[1].textContent = stats.low_stock;
                statCards[1].className = 'stat-value warning';
                
                statCards[2].textContent = stats.out_of_stock;
                statCards[2].className = 'stat-value danger';
                
                const totalValue = stats.total_value >= 1000 
                    ? `£${(stats.total_value / 1000).toFixed(0)}K` 
                    : `£${stats.total_value.toFixed(0)}`;
                statCards[3].textContent = totalValue;
            }
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load inventory from API
async function loadInventory(category = '', status = '', search = '') {
    try {
        let url = `${API_BASE}/stock.php?action=list&branch_id=${currentBranchId}`;
        if (category) url += `&category=${encodeURIComponent(category)}`;
        if (status) url += `&status=${status}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            allStock = data.data;
            renderInventoryTable(allStock);
        } else {
            showError('Failed to load inventory');
        }
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Connection error. Please check if database is running.');
    }
}

// Render inventory table
function renderInventoryTable(items) {
    const tbody = document.getElementById('inventoryTableBody');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: #666; padding: 2rem;">No inventory items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => {
        const statusBadge = item.stock_status === 'good' 
            ? '<span class="stock-badge good">✅ In Stock</span>'
            : item.stock_status === 'low'
            ? '<span class="stock-badge low">⚠️ Low Stock</span>'
            : '<span class="stock-badge out">❌ Out of Stock</span>';
        
        const rowClass = item.stock_status === 'out' 
            ? 'out-of-stock-row' 
            : item.stock_status === 'low' 
            ? 'low-stock-row' 
            : '';
        
        const actionBtn = item.stock_status === 'out'
            ? `<button class="btn btn-small btn-danger" onclick="requestRestock(${item.product_id}, '${item.product_name.replace(/'/g, "\\'")}')">Request Restock</button>`
            : `<button class="btn btn-small btn-primary" onclick="adjustStock(${item.product_id}, '${item.product_name.replace(/'/g, "\\'")}', ${item.current_stock})">Adjust</button>`;
        
        return `
            <tr class="${rowClass}">
                <td>P${String(item.product_id).padStart(3, '0')}</td>
                <td>${item.product_name}</td>
                <td>${item.category}</td>
                <td><strong>${item.current_stock}</strong></td>
                <td>${item.reorder_level}</td>
                <td>${statusBadge}</td>
                <td>£${item.unit_price.toFixed(2)}</td>
                <td><button class="btn btn-small" onclick="checkOtherStores(${item.product_id}, '${item.product_name.replace(/'/g, "\\'")}')">View</button></td>
                <td class="actions-cell">${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInventory');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(applyFilters, 300);
        });
    }
}

// Apply filters
async function applyFilters() {
    const search = document.getElementById('searchInventory')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('stockFilter')?.value || '';
    
    await loadInventory(category, status, search);
}

// Reset filters
async function resetFilters() {
    const searchInput = document.getElementById('searchInventory');
    const categoryFilter = document.getElementById('categoryFilter');
    const stockFilter = document.getElementById('stockFilter');
    
    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (stockFilter) stockFilter.value = '';
    
    await loadInventory();
}

// Adjust stock
let currentAdjustment = null;

function adjustStock(productId, productName, currentStock) {
    currentAdjustment = { productId, productName, currentStock };
    
    document.getElementById('productName').value = `P${String(productId).padStart(3, '0')} - ${productName}`;
    document.getElementById('currentStock').value = currentStock;
    document.getElementById('adjustment').value = '';
    document.getElementById('reason').value = '';
    
    document.getElementById('adjustModal').classList.add('active');
}

async function confirmAdjustment() {
    if (!currentAdjustment) return;
    
    const adjustment = parseInt(document.getElementById('adjustment').value) || 0;
    const reason = document.getElementById('reason').value;
    
    if (!reason) {
        alert('Please enter a reason for adjustment');
        return;
    }
    
    if (adjustment === 0) {
        alert('Please enter an adjustment quantity');
        return;
    }
    
    const newStock = currentAdjustment.currentStock + adjustment;
    
    if (newStock < 0) {
        alert('Stock cannot be negative!');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/stock.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'adjust',
                product_id: currentAdjustment.productId,
                branch_id: currentBranchId,
                adjustment: adjustment,
                reason: reason
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`✅ Stock adjusted: ${adjustment > 0 ? '+' : ''}${adjustment} units`, 'success');
            closeModal();
            await loadInventoryStats();
            await loadInventory();
        } else {
            alert('Failed to adjust stock: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adjusting stock:', error);
        alert('Failed to adjust stock');
    }
}

function closeModal() {
    document.getElementById('adjustModal').classList.remove('active');
    currentAdjustment = null;
}

// Check other stores
async function checkOtherStores(productId, productName) {
    try {
        const response = await fetch(`${API_BASE}/stock.php?action=other_branches&product_id=${productId}&current_branch=${currentBranchId}`);
        const data = await response.json();
        
        if (data.success) {
            let message = `Stock at Other Branches for:\n${productName}\n\n`;
            
            if (data.data.length === 0) {
                message += 'No other branches found.';
            } else {
                data.data.forEach(branch => {
                    const status = branch.stock > 10 ? '✅' : branch.stock > 0 ? '⚠️' : '❌';
                    message += `${status} ${branch.branch_name} (${branch.city}): ${branch.stock} units\n`;
                });
                message += '\nYou can request a stock transfer if needed.';
            }
            
            alert(message);
        }
    } catch (error) {
        console.error('Error checking other stores:', error);
        alert('Failed to check other stores');
    }
}

// Request restock
function requestRestock(productId, productName) {
    const quantity = prompt(`Product: ${productName}\n\nThis item is out of stock.\nEnter quantity to request:`);
    
    if (quantity && parseInt(quantity) > 0) {
        alert(`✅ Restock Request Submitted!\n\nProduct: ${productName}\nQuantity: ${quantity}\n\nThe purchasing team will process this request.`);
    }
}

// Request stock transfer
function requestStockTransfer() {
    alert('🔄 Stock Transfer Request\n\nTo request a stock transfer from another branch:\n1. Find the product you need\n2. Click "View" to see other branch stock\n3. Contact the branch manager directly\n\nFor automated transfers, please contact your area manager.');
}

// Notification system
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
        top: 80px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-weight: 600;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function showError(message) {
    const tbody = document.getElementById('inventoryTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #EF4444; padding: 2rem;">❌ ${message}</td></tr>`;
    }
}

// Logout handler
document.addEventListener('DOMContentLoaded', function() {
    const logoutBtn = document.querySelector('.btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('staffLoggedIn');
                localStorage.removeItem('currentStaff');
                window.location.href = '../index.html';
            }
        });
    }
});

console.log('✅ Inventory management script loaded');
