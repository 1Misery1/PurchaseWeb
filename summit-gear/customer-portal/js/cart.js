// =====================================================
// Summit Gear & Adventures - Cart Page JavaScript
// Database Connected Version (With Promotions Support)
// =====================================================

console.log('✅ Cart.js v4.0 loaded - With Promotions Support');

// Global promotions cache
let activePromotions = [];

document.addEventListener('DOMContentLoaded', async function() {
    // Load promotions first
    await loadActivePromotions();
    renderCartPage();
    setupDeliveryOptions();
    setupCheckoutButton();
    await loadRecommendations();
    await loadBranchesForDelivery();
});

// Load active promotions from database
async function loadActivePromotions() {
    try {
        const res = await fetch('/summit-gear/api/promotions.php?type=promotions&active=true');
        const data = await res.json();
        if (data.success) {
            activePromotions = data.data || [];
            console.log('✅ Loaded', activePromotions.length, 'active promotions');
        }
    } catch (e) {
        console.error('Failed to load promotions:', e);
        activePromotions = [];
    }
}

// Calculate promotion discount for cart items
// Only applies promotions from the selected branch
function calculatePromotionDiscount(cartItems, subtotal, selectedBranchId = null) {
    if (activePromotions.length === 0) return { amount: 0, applied: [] };
    
    // Get selected branch ID if not provided
    if (!selectedBranchId) {
        selectedBranchId = getSelectedBranchId();
    }
    
    let totalDiscount = 0;
    let appliedPromotions = [];
    
    for (const promo of activePromotions) {
        // Only apply promotions from the selected branch
        if (selectedBranchId && promo.branch_id && promo.branch_id != selectedBranchId) {
            continue;
        }
        
        // Simple store-wide percentage discount
        const discountPercent = parseFloat(promo.discount_value) || 0;
        if (discountPercent <= 0) continue;
        
        const discountAmount = subtotal * (discountPercent / 100);
        
        if (discountAmount > 0) {
            totalDiscount += discountAmount;
            appliedPromotions.push({
                title: promo.title,
                discount: discountAmount,
                percent: discountPercent,
                branch_name: promo.branch_name || 'Store'
            });
        }
    }
    
    return { amount: totalDiscount, applied: appliedPromotions };
}

// 渲染购物车页面
function renderCartPage() {
    const cartItemsContainer = document.querySelector('.cart-items');
    const orderSummary = document.querySelector('.order-summary');
    
    if (!cartItemsContainer) return;
    
    // Get cart from shared.js
    const cart = getCart();
    
    // Get customer info for discount calculation
    const customer = getCurrentCustomer();
    const discountPercent = customer ? getMembershipDiscount(customer.membership_type) : 0;
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message" style="text-align: center; padding: 3rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
                <h3>Your cart is empty</h3>
                <p style="color: #6B7280; margin-bottom: 1.5rem;">Start shopping to add items to your cart!</p>
                <a href="products.html" class="btn btn-primary">Browse Products</a>
            </div>
        `;
        
        // Update page title
        const pageHeader = document.querySelector('.page-header p');
        if (pageHeader) pageHeader.textContent = 'Your cart is empty';
        
        // Hide order summary
        if (orderSummary) orderSummary.style.display = 'none';
        
        return;
    }
    
    // Show order summary
    if (orderSummary) orderSummary.style.display = 'block';
    
    // Product-specific emoji function
    function getProductEmoji(item) {
        const name = (item.name || '').toLowerCase();
        
        if (name.includes('tent')) return '⛺';
        if (name.includes('sleeping bag')) return '🛏️';
        if (name.includes('mat')) return '🛋️';
        if (name.includes('cooler')) return '🧊';
        if (name.includes('chair')) return '🪑';
        if (name.includes('bottle')) return '🥤';
        if (name.includes('cookware')) return '🍳';
        if (name.includes('stove')) return '🔥';
        if (name.includes('rope')) return '🪢';
        if (name.includes('harness')) return '🦺';
        if (name.includes('helmet')) return '🪖';
        if (name.includes('carabiner')) return '🔗';
        if (name.includes('glove')) return '🧤';
        if (name.includes('jacket')) return '🧥';
        if (name.includes('vest')) return '🦺';
        if (name.includes('pants')) return '👖';
        if (name.includes('layer') || name.includes('shirt')) return '👕';
        if (name.includes('boot')) return '🥾';
        if (name.includes('shoe')) return '👟';
        if (name.includes('sock')) return '🧦';
        if (name.includes('gps')) return '📍';
        if (name.includes('watch')) return '⌚';
        if (name.includes('compass')) return '🧭';
        if (name.includes('radio')) return '📻';
        if (name.includes('power bank')) return '🔋';
        if (name.includes('backpack') || name.includes('pack')) return '🎒';
        if (name.includes('headlamp') || name.includes('lamp')) return '🔦';
        if (name.includes('lantern')) return '🏮';
        if (name.includes('tool')) return '🔧';
        if (name.includes('hatchet')) return '🪓';
        if (name.includes('filter')) return '💧';
        if (name.includes('fire')) return '🔥';
        if (name.includes('first aid')) return '🩹';
        if (name.includes('pole')) return '🏔️';
        
        return '📦';
    }
    
    // Render cart items
    let cartHTML = '';
    cart.forEach(item => {
        const originalPrice = item.price;
        const discountedPrice = originalPrice * (1 - discountPercent / 100);
        const itemTotal = discountedPrice * item.quantity;
        const emoji = getProductEmoji(item);
        
        cartHTML += `
            <div class="cart-item" data-id="${item.product_id}">
                <div class="item-image">${emoji}</div>
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p class="item-sku">${item.brand || ''}</p>
                </div>
                <div class="item-price">
                    ${discountPercent > 0 ? `<span class="original" style="text-decoration: line-through; color: #9ca3af;">£${originalPrice.toFixed(2)}</span>` : ''}
                    <span class="discounted" style="color: #10B981; font-weight: bold;">£${discountedPrice.toFixed(2)}</span>
                </div>
                <div class="item-quantity">
                    <label>Qty:</label>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="updateItemQty(${item.product_id}, ${item.quantity - 1})">-</button>
                        <span class="qty-value">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateItemQty(${item.product_id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                ${discountPercent > 0 ? `<div class="item-discount"><span style="color: #10B981; font-weight: bold;">-${discountPercent}%</span></div>` : ''}
                <div class="item-subtotal">
                    <strong>£${itemTotal.toFixed(2)}</strong>
                </div>
                <div class="item-actions">
                    <button class="btn-icon" title="Remove" onclick="removeItemFromCart(${item.product_id})">🗑️</button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    
    // Update page title
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const pageHeader = document.querySelector('.page-header p');
    if (pageHeader) pageHeader.textContent = `You have ${totalItems} item${totalItems > 1 ? 's' : ''} in your cart`;
    
    // Update member notice
    updateMemberNotice(customer, discountPercent);
    
    // Update order summary
    updateOrderSummary(cart, discountPercent, customer);
}

// Update member notice
function updateMemberNotice(customer, discountPercent) {
    const noticeDiv = document.querySelector('.cart-member-notice');
    if (!noticeDiv) return;
    
    if (customer && discountPercent > 0) {
        const emoji = getMembershipEmoji(customer.membership_type);
        noticeDiv.innerHTML = `<span class="badge ${(customer.membership_type || '').toLowerCase()}" style="background: linear-gradient(135deg, #10B981, #059669); color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-block;">${emoji} ${customer.membership_type} Member Discount: ${discountPercent}% OFF</span>`;
        noticeDiv.style.display = 'block';
    } else if (!customer) {
        noticeDiv.innerHTML = `<span class="badge" style="background: #6B7280; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; display: inline-block;">👤 <a href="login.html" style="color: white;">Login</a> to get member discounts!</span>`;
        noticeDiv.style.display = 'block';
    } else {
        noticeDiv.style.display = 'none';
    }
}

// Update order summary (No points redemption)
function updateOrderSummary(cartItems, discountPercent, customer) {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const memberDiscount = subtotal * (discountPercent / 100);
    
    // Calculate promotion discounts
    const promoResult = calculatePromotionDiscount(cartItems, subtotal);
    const promoDiscount = promoResult.amount;
    const totalDiscount = memberDiscount + promoDiscount;
    
    // Check delivery method
    const deliveryOption = document.querySelector('input[name="delivery"]:checked');
    const deliveryFee = (deliveryOption && deliveryOption.value === 'delivery') ? 5.99 : 0;
    
    const total = Math.max(0, subtotal - totalDiscount + deliveryFee);
    const pointRate = customer ? parseFloat(customer.point_rate || 1) : 1;
    const pointsToEarn = Math.floor(total * pointRate);
    
    // Get or create the summary container
    const summaryContainer = document.querySelector('.order-summary .summary-details');
    if (summaryContainer) {
        const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        
        let summaryHTML = `
            <div class="summary-line">
                <span>Subtotal (${itemCount} items):</span>
                <span>£${subtotal.toFixed(2)}</span>
            </div>
        `;
        
        // Member discount
        if (memberDiscount > 0) {
            summaryHTML += `
                <div class="summary-line discount" style="color: #10B981;">
                    <span>🎖️ Member Discount (${discountPercent}%):</span>
                    <span>-£${memberDiscount.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Promotion discounts (store-wide)
        if (promoResult.applied.length > 0) {
            promoResult.applied.forEach(promo => {
                summaryHTML += `
                    <div class="summary-line discount" style="color: #7c3aed;">
                        <span>🎉 ${promo.title} (${promo.percent}% off - ${promo.branch_name}):</span>
                        <span>-£${promo.discount.toFixed(2)}</span>
                    </div>
                `;
            });
        }
        
        // Delivery fee
        if (deliveryFee > 0) {
            summaryHTML += `
                <div class="summary-line">
                    <span>🚚 Delivery Fee:</span>
                    <span>+£${deliveryFee.toFixed(2)}</span>
                </div>
            `;
        }
        
        // Total
        summaryHTML += `
            <div class="summary-line total" style="font-size: 1.25rem; font-weight: bold; border-top: 2px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
                <span>Total:</span>
                <span style="color: #059669;">£${total.toFixed(2)}</span>
            </div>
        `;
        
        // Points to earn
        if (customer) {
            const currentPoints = customer.total_points || 0;
            summaryHTML += `
                <div class="points-earn" style="background: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem; text-align: center;">
                    <span>💰 You will earn: <strong style="color: #d97706;">+${pointsToEarn} Points</strong></span>
                    <br><small style="color: #6b7280;">Current Balance: ${currentPoints.toLocaleString()} Points</small>
                </div>
            `;
        }
        
        // Show applied promotions info
        if (promoResult.applied.length > 0) {
            summaryHTML += `
                <div style="background: #ede9fe; padding: 0.75rem; border-radius: 0.5rem; margin-top: 0.75rem; font-size: 0.85rem;">
                    <strong>🎉 ${promoResult.applied.length} Promotion(s) Applied!</strong>
                    <div style="color: #5b21b6; margin-top: 0.25rem;">
                        Total Savings: £${totalDiscount.toFixed(2)}
                    </div>
                </div>
            `;
        }
        
        summaryContainer.innerHTML = summaryHTML;
    }
    
    // Store promotion info for checkout
    window.appliedPromotions = promoResult;
    window.totalPromoDiscount = promoDiscount;
}

// Setup delivery options
function setupDeliveryOptions() {
    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    
    deliveryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            const cart = getCart();
            const customer = getCurrentCustomer();
            const discountPercent = customer ? getMembershipDiscount(customer.membership_type) : 0;
            updateOrderSummary(cart, discountPercent, customer);
        });
    });
}

// Setup checkout button (No points redemption)
function setupCheckoutButton() {
    const checkoutBtn = document.querySelector('.btn-checkout');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            
            if (!isLoggedIn()) {
                if (confirm('Please login to checkout. Go to login page?')) {
                    window.location.href = 'login.html';
                }
                return;
            }
            
            const cart = getCart();
            
            if (cart.length === 0) {
                showNotification('Your cart is empty!', 'warning');
                return;
            }
            
            const customer = getCurrentCustomer();
            const discountPercent = getMembershipDiscount(customer.membership_type);
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const memberDiscount = subtotal * (discountPercent / 100);
            
            // Calculate promotion discounts
            const promoResult = calculatePromotionDiscount(cart, subtotal);
            const promoDiscount = promoResult.amount;
            const totalDiscount = memberDiscount + promoDiscount;
            
            // Check delivery method
            const deliveryOption = document.querySelector('input[name="delivery"]:checked');
            const deliveryFee = (deliveryOption && deliveryOption.value === 'delivery') ? 5.99 : 0;
            
            const total = Math.max(0, subtotal - totalDiscount + deliveryFee);
            const pointRate = parseFloat(customer.point_rate || 1);
            const pointsEarned = Math.floor(total * pointRate);
            
            // Get branch selection
            const branchId = getSelectedBranchId();
            const branchName = getSelectedBranchName();
            const isHomeDelivery = (deliveryOption && deliveryOption.value === 'delivery');
            
            const deliveryInfo = isHomeDelivery 
                ? `🚚 Home Delivery from ${branchName}` 
                : `📦 Collect at ${branchName}`;
            
            // Build confirmation message
            let confirmMsg = `Confirm your order?\n\nStore: ${branchName}\nItems: ${cart.length} product(s)\nSubtotal: £${subtotal.toFixed(2)}`;
            if (memberDiscount > 0) {
                confirmMsg += `\n🎖️ Member Discount: -£${memberDiscount.toFixed(2)}`;
            }
            if (promoResult.applied.length > 0) {
                promoResult.applied.forEach(p => {
                    confirmMsg += `\n🎉 ${p.title} (${p.percent}%): -£${p.discount.toFixed(2)}`;
                });
            }
            if (deliveryFee > 0) {
                confirmMsg += `\n🚚 Delivery Fee: +£${deliveryFee.toFixed(2)}`;
            }
            confirmMsg += `\n\nTotal: £${total.toFixed(2)}\nPoints Earned: +${pointsEarned}\n${deliveryInfo}`;
            
            if (confirm(confirmMsg)) {
                // Show loading
                checkoutBtn.disabled = true;
                checkoutBtn.textContent = '⏳ Processing...';
                
                try {
                    // Create order via API with promotion discount
                    const order = await createOrder({
                        branch_id: branchId,
                        payment_method: 'Card',
                        delivery_fee: deliveryFee,
                        promotion_discount: promoDiscount,  // Pass promotion discount
                        applied_promotions: promoResult.applied.map(p => p.title).join(', '),
                        notes: isHomeDelivery ? `Home Delivery from ${branchName}` : `Store Pickup: ${branchName}`
                    });
                    
                    if (order) {
                        showNotification(`Order ${order.order_number} placed successfully!`, 'success');
                        
                        setTimeout(() => {
                            let successMsg = `✅ Order placed successfully!\n\nOrder Number: ${order.order_number}\nTotal: £${parseFloat(order.final_amount).toFixed(2)}\nPoints Earned: +${order.points_earned}`;
                            if (promoResult.applied.length > 0) {
                                successMsg += `\n\n🎉 Promotions Applied: ${promoResult.applied.map(p => p.title).join(', ')}`;
                            }
                            successMsg += `\n\nThank you for shopping with Summit Gear!`;
                            
                            alert(successMsg);
                            
                            // Redirect to account page
                            window.location.href = 'account.html#orders';
                        }, 500);
                    } else {
                        checkoutBtn.disabled = false;
                        checkoutBtn.textContent = '💳 Proceed to Checkout';
                    }
                } catch (error) {
                    console.error('Checkout error:', error);
                    showNotification('Error processing order. Please try again.', 'error');
                    checkoutBtn.disabled = false;
                    checkoutBtn.textContent = '💳 Proceed to Checkout';
                }
            }
        });
    }
}

// Update item quantity
function updateItemQty(productId, newQty) {
    if (newQty <= 0) {
        removeFromCart(productId);
    } else {
        updateCartQuantity(productId, newQty);
    }
    renderCartPage();
}

// Remove item from cart
function removeItemFromCart(productId) {
    removeFromCart(productId);
    renderCartPage();
}

// =====================================================
// Load Branches for Delivery Selection
// =====================================================
async function loadBranchesForDelivery() {
    const branchSelect = document.getElementById('branch-select');
    if (!branchSelect) return;
    
    try {
        const response = await fetch('/summit-gear/api/branches.php');
        const branches = await response.json();
        
        if (Array.isArray(branches) && branches.length > 0) {
            branchSelect.innerHTML = branches.map(branch => 
                `<option value="${branch.branch_id}">${branch.branch_name}</option>`
            ).join('');
            
            // Recalculate order summary when branch changes (different stores may have different promotions)
            branchSelect.addEventListener('change', function() {
                const cart = getCart();
                const customer = getCurrentCustomer();
                const discountPercent = customer ? getMembershipDiscount(customer.membership_type) : 0;
                updateOrderSummary(cart, discountPercent, customer);
            });
            
            // Initial calculation with first branch
            const cart = getCart();
            const customer = getCurrentCustomer();
            const discountPercent = customer ? getMembershipDiscount(customer.membership_type) : 0;
            updateOrderSummary(cart, discountPercent, customer);
        }
    } catch (error) {
        console.error('Error loading branches:', error);
    }
}

// Get selected branch ID
function getSelectedBranchId() {
    const branchSelect = document.getElementById('branch-select');
    return branchSelect ? parseInt(branchSelect.value) : 1;
}

// Get selected branch name
function getSelectedBranchName() {
    const branchSelect = document.getElementById('branch-select');
    return branchSelect ? branchSelect.options[branchSelect.selectedIndex].text : 'Store';
}

// =====================================================
// Load Recommendations from Database
// =====================================================
async function loadRecommendations() {
    const grid = document.getElementById('recommendationsGrid');
    if (!grid) return;
    
    try {
        const response = await fetch('/summit-gear/api/products.php');
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            // Get random 4 products for recommendations
            const shuffled = result.data.sort(() => 0.5 - Math.random());
            const recommendations = shuffled.slice(0, 4);
            
            grid.innerHTML = recommendations.map(product => {
                const price = parseFloat(product.retail_price);
                const emoji = getProductEmoji({ name: product.name });
                
                return `
                    <div class="product-card-small">
                        <div class="product-image-small">${emoji}</div>
                        <h4>${product.name}</h4>
                        <p class="price">£${price.toFixed(2)}</p>
                        <button class="btn btn-small btn-primary" onclick="addToCart(${product.product_id}); renderCartPage();">Add to Cart</button>
                    </div>
                `;
            }).join('');
        } else {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No recommendations available</p>';
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">Unable to load recommendations</p>';
    }
}
