// =====================================================
// Customer Management JavaScript - Database Integration
// =====================================================

const API_BASE = '/summit-gear/api';
let allCustomers = [];

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Customer Management Loading...');
    
    // Check login
    const isLoggedIn = localStorage.getItem('staffLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update staff display
    updateStaffDisplay();
    
    // Load customers
    await loadCustomers();
    
    // Setup search
    setupSearch();
    
    console.log('✅ Customer Management loaded');
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

// Load customers from API
async function loadCustomers() {
    try {
        const response = await fetch(`${API_BASE}/sales.php?action=customers`);
        const data = await response.json();
        
        if (data.success) {
            allCustomers = data.data;
            renderCustomerList(allCustomers);
        } else {
            showError('Failed to load customers');
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showError('Connection error. Please check if database is running.');
    }
}

// Render customer list
function renderCustomerList(customers) {
    const listContainer = document.getElementById('customerList');
    if (!listContainer) return;
    
    if (customers.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No customers found</p>';
        return;
    }
    
    listContainer.innerHTML = customers.map(customer => {
        const tierEmoji = getTierEmoji(customer.membership_type);
        const tierClass = customer.membership_type.toLowerCase();
        const pointsValue = (customer.points / 100).toFixed(2);
        
        return `
            <div class="customer-card">
                <div class="customer-header">
                    <div class="customer-info">
                        <h3>👤 ${customer.name}</h3>
                        <span class="membership-badge ${tierClass}">${tierEmoji} ${customer.membership_type} Member</span>
                        <span style="color: var(--text-secondary);">ID: ${customer.customer_id}</span>
                    </div>
                    <div class="points-section" style="text-align: center; min-width: 150px;">
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Current Points</div>
                        <div class="points-value">${customer.points.toLocaleString()}</div>
                        <div style="font-size: 0.875rem; color: var(--success-color);">≈ £${pointsValue}</div>
                    </div>
                </div>
                
                <div class="customer-details">
                    <div class="detail-item">
                        <div class="detail-label">Phone</div>
                        <div class="detail-value">${customer.phone || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Email</div>
                        <div class="detail-value">${customer.email || 'Not provided'}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Discount Rate</div>
                        <div class="detail-value">${customer.discount_rate}%</div>
                    </div>
                </div>
                
                <div class="customer-actions-row">
                    <button class="btn btn-primary btn-small" onclick="viewPurchaseHistory(${customer.customer_id})">📊 Purchase History</button>
                    <button class="btn btn-secondary btn-small" onclick="adjustPoints(${customer.customer_id}, '${customer.name}', ${customer.points})">💎 Adjust Points</button>
                    <button class="btn btn-secondary btn-small" onclick="editCustomer(${customer.customer_id})">✏️ Edit Info</button>
                    <button class="btn btn-secondary btn-small" onclick="sendEmail('${customer.email}')">📧 Send Email</button>
                </div>
            </div>
        `;
    }).join('');
}

function getTierEmoji(tier) {
    const emojis = { 'Bronze': '🥉', 'Silver': '🥈', 'Gold': '🥇', 'Platinum': '💎' };
    return emojis[tier] || '🎖️';
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('customerSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchCustomer();
            }
        });
        
        searchInput.addEventListener('input', function() {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                const query = this.value.toLowerCase();
                if (query.length === 0) {
                    renderCustomerList(allCustomers);
                } else if (query.length >= 2) {
                    const filtered = allCustomers.filter(c => 
                        c.name.toLowerCase().includes(query) ||
                        (c.email && c.email.toLowerCase().includes(query)) ||
                        (c.phone && c.phone.includes(query))
                    );
                    renderCustomerList(filtered);
                }
            }, 300);
        });
    }
}

// Search customer
function searchCustomer() {
    const query = document.getElementById('customerSearch').value.toLowerCase();
    
    if (!query) {
        renderCustomerList(allCustomers);
        return;
    }
    
    const filtered = allCustomers.filter(c => 
        c.name.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
    );
    
    renderCustomerList(filtered);
    
    if (filtered.length === 0) {
        showNotification('No customers found matching your search', 'info');
    }
}

// Clear search
function clearSearch() {
    document.getElementById('customerSearch').value = '';
    renderCustomerList(allCustomers);
}

// View purchase history
async function viewPurchaseHistory(customerId) {
    try {
        const response = await fetch(`${API_BASE}/orders.php?customer_id=${customerId}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            let message = `Purchase History (Last 10 Orders):\n\n`;
            data.data.slice(0, 10).forEach(order => {
                const date = new Date(order.order_date).toLocaleDateString('en-GB');
                message += `Order #${order.order_id} - ${date}\n`;
                message += `  Total: £${parseFloat(order.total_amount).toFixed(2)} - Status: ${order.status}\n\n`;
            });
            alert(message);
        } else {
            alert('No purchase history found for this customer.');
        }
    } catch (error) {
        console.error('Error fetching purchase history:', error);
        alert('Failed to load purchase history');
    }
}

// Adjust points
async function adjustPoints(customerId, customerName, currentPoints) {
    const adjustment = prompt(`Adjust Points for ${customerName}\n\nCurrent Points: ${currentPoints.toLocaleString()}\n\nEnter adjustment (positive to add, negative to deduct):`);
    
    if (adjustment === null) return;
    
    const points = parseInt(adjustment);
    if (isNaN(points)) {
        alert('Please enter a valid number');
        return;
    }
    
    const reason = prompt('Enter reason for adjustment:');
    if (!reason) {
        alert('Reason is required');
        return;
    }
    
    // In a real implementation, this would call an API to adjust points
    const newTotal = currentPoints + points;
    alert(`✅ Points Adjustment Recorded!\n\nCustomer: ${customerName}\nAdjustment: ${points > 0 ? '+' : ''}${points} points\nNew Total: ${newTotal.toLocaleString()} points\nReason: ${reason}\n\n(Note: Full implementation requires points adjustment API)`);
    
    // Refresh customer list
    await loadCustomers();
}

// Edit customer
function editCustomer(customerId) {
    const customer = allCustomers.find(c => c.customer_id === customerId);
    if (!customer) return;
    
    alert(`✏️ Edit Customer\n\nCustomer: ${customer.name}\nID: ${customerId}\n\n(Note: Full edit form requires additional UI implementation)`);
}

// Send email
function sendEmail(email) {
    if (!email) {
        alert('No email address on file for this customer');
        return;
    }
    
    // Open default email client
    window.location.href = `mailto:${email}?subject=Summit Gear & Adventures`;
}

// Scan member card
function scanMemberCard() {
    alert('📱 Opening Scanner...\n\nIn production, this would activate the barcode/QR scanner to read customer membership cards.');
}

// Register Modal Functions
function openRegisterModal() {
    document.getElementById('registerModal').classList.add('active');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.remove('active');
    document.getElementById('registerForm').reset();
}

// Handle registration form submit
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerForm');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const firstName = form.querySelector('input[type="text"]').value;
            const phone = form.querySelector('input[type="tel"]').value;
            const email = form.querySelector('input[type="email"]').value;
            
            // Split name into first and last
            const nameParts = firstName.trim().split(' ');
            const first = nameParts[0] || '';
            const last = nameParts.slice(1).join(' ') || 'Customer';
            
            try {
                const response = await fetch(`${API_BASE}/sales.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        action: 'register_customer',
                        first_name: first,
                        last_name: last,
                        email: email,
                        phone: phone
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showNotification(`✅ Customer registered! ID: ${data.data.customer_id}`, 'success');
                    closeRegisterModal();
                    await loadCustomers();
                } else {
                    alert('Failed to register: ' + (data.error || 'Unknown error'));
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Failed to register customer');
            }
        });
    }
});

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
    const listContainer = document.getElementById('customerList');
    if (listContainer) {
        listContainer.innerHTML = `<p style="text-align: center; color: #EF4444; padding: 2rem;">❌ ${message}</p>`;
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

console.log('✅ Customers management script loaded');
