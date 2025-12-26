// =====================================================
// Product Detail Page JavaScript
// 数据库连接版本 - 从API动态加载产品数据和评价
// =====================================================

console.log('✅ Product Detail JS v3.0 loaded - Database Connected with Reviews');

// 当前产品数据
let currentProduct = null;

// 存储当前显示的评论数量
let currentReviewsShown = 3;
let allProductReviews = [];

// 当前选择的评分
let selectedRating = 0;

// 产品图标映射
function getProductEmoji(product) {
    const name = product.name.toLowerCase();
    const category = product.category;
    
    if (name.includes('tent')) return '⛺';
    if (name.includes('sleeping bag')) return '🛏️';
    if (name.includes('mat') || name.includes('mattress')) return '🛋️';
    if (name.includes('cooler') || name.includes('cool box')) return '🧊';
    if (name.includes('chair')) return '🪑';
    if (name.includes('water bottle') || name.includes('bottle')) return '🥤';
    if (name.includes('cookware') || name.includes('cooking')) return '🍳';
    if (name.includes('stove') || name.includes('pocket')) return '🔥';
    if (name.includes('rope')) return '🪢';
    if (name.includes('harness')) return '🦺';
    if (name.includes('helmet')) return '🪖';
    if (name.includes('carabiner')) return '🔗';
    if (name.includes('glove')) return '🧤';
    if (name.includes('jacket')) return '🧥';
    if (name.includes('vest')) return '🦺';
    if (name.includes('pants') || name.includes('trouser')) return '👖';
    if (name.includes('base layer') || name.includes('shirt')) return '👕';
    if (name.includes('fleece')) return '🧣';
    if (name.includes('boot')) return '🥾';
    if (name.includes('shoe') || name.includes('running')) return '👟';
    if (name.includes('sock')) return '🧦';
    if (name.includes('gps') || name.includes('gpsmap')) return '📍';
    if (name.includes('watch')) return '⌚';
    if (name.includes('compass')) return '🧭';
    if (name.includes('radio')) return '📻';
    if (name.includes('power bank') || name.includes('solar')) return '🔋';
    if (name.includes('backpack') || name.includes('pack')) return '🎒';
    if (name.includes('daypack')) return '💼';
    if (name.includes('headlamp') || name.includes('lamp')) return '🔦';
    if (name.includes('lantern')) return '🏮';
    if (name.includes('multi-tool') || name.includes('tool')) return '🔧';
    if (name.includes('knife')) return '🔪';
    if (name.includes('hatchet') || name.includes('axe')) return '🪓';
    if (name.includes('filter')) return '💧';
    if (name.includes('fire starter') || name.includes('fire')) return '🔥';
    if (name.includes('first aid')) return '🩹';
    if (name.includes('pole') || name.includes('trekking')) return '🏔️';
    if (name.includes('tape') || name.includes('repair')) return '🧵';
    
    const categoryEmojis = {
        'Camping': '🏕️',
        'Climbing': '🧗',
        'Clothing': '🧥',
        'Backpacks': '🎒',
        'Electronics': '📱',
        'Footwear': '🥾',
        'Lighting': '🔦',
        'Tools': '🔧'
    };
    return categoryEmojis[category] || '📦';
}

// 生成产品特性
function generateFeatures(product) {
    const categoryFeatures = {
        'Camping': ['Weather resistant', 'Easy setup', 'Durable materials', 'Compact storage', 'Multi-season use'],
        'Climbing': ['UIAA certified', 'Reinforced construction', 'Lightweight design', 'Safety tested', 'Professional grade'],
        'Clothing': ['Breathable fabric', 'Quick-dry technology', 'UV protection', 'Moisture wicking', 'Durable construction'],
        'Footwear': ['Waterproof membrane', 'Vibram sole', 'Ankle support', 'Cushioned insole', 'Grip technology'],
        'Electronics': ['Long battery life', 'Water resistant', 'GPS accuracy', 'Easy interface', 'Rechargeable'],
        'Backpacks': ['Ergonomic design', 'Multiple compartments', 'Padded straps', 'Rain cover included', 'Hydration compatible'],
        'Lighting': ['High lumens output', 'Multiple modes', 'USB rechargeable', 'Water resistant', 'Compact size'],
        'Tools': ['Stainless steel', 'Multi-function', 'Compact design', 'Corrosion resistant', 'Lifetime warranty']
    };
    return categoryFeatures[product.category] || ['High quality', 'Durable', 'Professional grade'];
}

// =====================================================
// 页面初始化
// =====================================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Product detail page initializing...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    
    console.log('Product ID from URL:', productId);
    
    if (productId && productId > 0) {
        await loadProductFromDB(productId);
    } else {
        showProductNotFound(0);
    }
});

// =====================================================
// 从数据库加载产品
// =====================================================
async function loadProductFromDB(productId) {
    try {
        console.log('Loading product from database:', productId);
        
        const response = await fetch(`/summit-gear/api/products.php?id=${productId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            currentProduct = result.data;
            console.log('Product loaded:', currentProduct.name);
            updatePageContent(currentProduct);
        } else {
            console.error('Product not found in database');
            showProductNotFound(productId);
        }
    } catch (error) {
        console.error('Error loading product:', error);
        showProductNotFound(productId);
    }
}

// =====================================================
// 更新页面内容
// =====================================================
function updatePageContent(product) {
    // 更新页面标题
    document.title = `${product.name} - Summit Gear`;
    
    // 更新面包屑
    const breadcrumbCategory = document.getElementById('breadcrumb-category');
    const breadcrumbProduct = document.getElementById('breadcrumb-product');
    
    if (breadcrumbCategory) {
        const cat = product.category || 'Products';
        const catUrl = cat.toLowerCase();
        breadcrumbCategory.innerHTML = `<a href="products.html?category=${catUrl}">${cat}</a>`;
    }
    if (breadcrumbProduct) {
        breadcrumbProduct.textContent = product.name;
    }
    
    // 更新主图片
    const emoji = getProductEmoji(product);
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.textContent = emoji;
    }
    
    // 更新缩略图
    const thumbGallery = document.querySelector('.thumbnail-gallery');
    if (thumbGallery) {
        thumbGallery.innerHTML = `<div class="thumbnail active">${emoji}</div>`;
    }
    
    // 更新产品名称
    const productName = document.getElementById('productName');
    if (productName) {
        productName.textContent = product.name;
    }
    
    // 更新评分区域 - 评论数将在生成评论后动态更新
    const ratingLine = document.querySelector('.product-rating-line');
    if (ratingLine) {
        ratingLine.innerHTML = `
            <div class="rating-stars">⭐⭐⭐⭐⭐</div>
            <span class="rating-count" id="reviewCountDisplay">(0 Reviews)</span>
            <span style="color: var(--text-secondary)">SKU: ${product.sku}</span>
        `;
    }
    
    // 计算会员折扣
    const price = parseFloat(product.retail_price);
    let discount = 0;
    let membershipType = '';
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    
    if (customer) {
        membershipType = customer.membership_type || 'Bronze';
        discount = typeof getMembershipDiscount === 'function' ? getMembershipDiscount(membershipType) : 0;
    }
    
    const discountedPrice = price * (1 - discount / 100);
    const savings = price - discountedPrice;
    
    // 更新价格区域
    const priceSection = document.querySelector('.price-section');
    if (priceSection) {
        const emoji = membershipType === 'Platinum' ? '💎' :
                      membershipType === 'Gold' ? '🥇' :
                      membershipType === 'Silver' ? '🥈' :
                      membershipType === 'Bronze' ? '🥉' : '';
        
        if (discount > 0) {
            priceSection.innerHTML = `
                <div class="current-price" id="currentPrice">£${discountedPrice.toFixed(2)}</div>
                <div class="original-price-line">Original: £${price.toFixed(2)}</div>
                <div class="discount-info">${emoji} ${membershipType} Member: ${discount}% OFF! Save £${savings.toFixed(2)}</div>
            `;
        } else {
            priceSection.innerHTML = `
                <div class="current-price" id="currentPrice">£${price.toFixed(2)}</div>
                <div class="discount-info">🔑 <a href="login.html">Login</a> to get member discounts!</div>
            `;
        }
    }
    
    // 更新库存状态
    const stockInfo = document.querySelector('.stock-info');
    if (stockInfo) {
        const stockQty = product.stock_quantity || 0;
        if (stockQty > 10) {
            stockInfo.className = 'stock-info in-stock';
            stockInfo.innerHTML = `✅ In Stock - ${stockQty} units available`;
        } else if (stockQty > 0) {
            stockInfo.className = 'stock-info low-stock';
            stockInfo.innerHTML = `⚠️ Low Stock - Only ${stockQty} left!`;
        } else {
            stockInfo.className = 'stock-info out-of-stock';
            stockInfo.innerHTML = `❌ Out of Stock`;
        }
    }
    
    // 更新数量选择器
    const qtyInput = document.getElementById('quantity');
    if (qtyInput) {
        qtyInput.max = product.stock_quantity || 1;
        qtyInput.value = 1;
    }
    
    // 生成并更新产品特性
    const features = generateFeatures(product);
    const featuresSection = document.querySelector('.product-features');
    if (featuresSection) {
        featuresSection.innerHTML = `
            <h3>✨ Product Features</h3>
            <ul class="feature-list">
                ${features.map(f => `<li>✅ ${f}</li>`).join('')}
            </ul>
        `;
    }
    
    // 更新描述标签
    const descTab = document.getElementById('description');
    if (descTab) {
        descTab.innerHTML = `
            <div class="description-section">
                <h3>About ${product.name}</h3>
                <p>${product.description || `High-quality ${product.category.toLowerCase()} equipment from ${product.brand}. Perfect for your outdoor adventures.`}</p>
                <h4 style="margin-top: 1.5rem;">Features:</h4>
                <ul>${features.map(f => `<li>${f}</li>`).join('')}</ul>
                <h4 style="margin-top: 1.5rem;">Brand Information</h4>
                <p><strong>${product.brand}</strong> is a trusted name in outdoor equipment, known for quality and durability.</p>
            </div>
        `;
    }
    
    // 更新规格标签
    const specsTab = document.getElementById('specs');
    if (specsTab) {
        specsTab.innerHTML = `
            <h2>Specifications</h2>
            <table class="specs-table">
                <tr><td>Brand</td><td>${product.brand}</td></tr>
                <tr><td>SKU</td><td>${product.sku}</td></tr>
                <tr><td>Category</td><td>${product.category}</td></tr>
                <tr><td>Price</td><td>£${price.toFixed(2)}</td></tr>
                <tr><td>Stock Status</td><td>${product.stock_status || 'In Stock'}</td></tr>
                <tr><td>Warranty</td><td>2 Years</td></tr>
            </table>
        `;
    }
    
    // 存储产品 ID 供添加购物车使用
    window.currentProductId = product.product_id;
    window.currentProductPrice = price;
    
    // 生成产品评论
    generateReviews(product);
    
    // 加载相关产品
    loadRelatedProducts(product);
    
    console.log('Page updated successfully for:', product.name);
}

// =====================================================
// 评价系统 - 从数据库API加载
// =====================================================

async function loadReviewsFromDB(productId) {
    try {
        console.log('Loading reviews from database for product:', productId);
        
        const response = await fetch(`/summit-gear/api/reviews.php?product_id=${productId}`);
        const result = await response.json();
        
        if (result.success) {
            allProductReviews = result.data.map(r => ({
                review_id: r.review_id,
                name: r.customer_name,
        rating: r.rating,
        title: r.title,
                text: r.content,
                date: r.created_at.split(' ')[0],
                isVerified: r.is_verified_purchase == 1,
                helpful_count: r.helpful_count || 0,
                customer_id: r.customer_id
            }));
            
            // 更新统计数据
            updateReviewStats(result.average_rating, result.count);
            
            console.log(`Loaded ${result.count} reviews from database`);
        } else {
            console.error('Failed to load reviews:', result.message);
            allProductReviews = [];
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
        allProductReviews = [];
    }
    
    return allProductReviews;
}

function updateReviewStats(avgRating, totalCount) {
    const reviewsTitle = document.getElementById('reviewsTitle');
    const reviewCountDisplay = document.getElementById('reviewCountDisplay');
    const reviewStats = document.getElementById('reviewStats');
    const avgRatingEl = document.getElementById('avgRating');
    const avgStarsEl = document.getElementById('avgStars');
    const totalReviewCountEl = document.getElementById('totalReviewCount');
    
    if (reviewsTitle) {
        reviewsTitle.textContent = `Customer Reviews (${totalCount})`;
    }
    
    if (reviewCountDisplay) {
        reviewCountDisplay.textContent = `(${totalCount} Reviews)`;
    }
    
    if (totalCount > 0 && reviewStats) {
        reviewStats.style.display = 'block';
        
        if (avgRatingEl) avgRatingEl.textContent = avgRating || '0';
        if (avgStarsEl) {
            const fullStars = Math.floor(avgRating || 0);
            const halfStar = (avgRating % 1) >= 0.5 ? '½' : '';
            avgStarsEl.textContent = '★'.repeat(fullStars) + halfStar + '☆'.repeat(5 - fullStars - (halfStar ? 1 : 0));
        }
        if (totalReviewCountEl) totalReviewCountEl.textContent = `${totalCount} reviews`;
    } else if (reviewStats) {
        reviewStats.style.display = 'none';
    }
}

async function generateReviews(product) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    
    // 显示加载状态
    reviewsContainer.innerHTML = '<p style="text-align: center; padding: 2rem;">⏳ Loading reviews...</p>';
    
    currentReviewsShown = 3;
    
    // 从数据库加载评价
    await loadReviewsFromDB(product.product_id);
    
    // 初始化评价表单
    initReviewForm(product.product_id);
    
    // 渲染评价
    renderReviews();
}

function renderReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;
    
    // 如果没有评论，显示空状态
    if (allProductReviews.length === 0) {
        reviewsContainer.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: #f9fafb; border-radius: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
                <h3>No Reviews Yet</h3>
                <p style="color: #6B7280; margin: 1rem 0;">Be the first to review this product!</p>
                <p style="color: #9CA3AF; font-size: 0.9rem;">Share your experience with other customers.</p>
            </div>
        `;
        updateViewMoreButton();
        return;
    }
    
    const reviewsToShow = allProductReviews.slice(0, currentReviewsShown);
    
    // 获取当前登录用户
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    const currentCustomerId = customer ? customer.customer_id : null;
    
    let reviewsHTML = '';
    reviewsToShow.forEach(review => {
        const stars = '⭐'.repeat(Math.floor(review.rating));
        const halfStar = review.rating % 1 >= 0.5 ? '½' : '';
        const verifiedBadge = review.isVerified ? '<span class="verified-badge">✅ Verified Purchase</span>' : '';
        const reviewClass = review.isVerified ? 'review-item user-review' : 'review-item';
        
        // 检查是否是当前用户的评价
        const isOwnReview = currentCustomerId && review.customer_id == currentCustomerId;
        const deleteBtn = isOwnReview ? `<button class="btn-delete-review" onclick="deleteReview(${review.review_id})" title="Delete your review">🗑️</button>` : '';
        
        reviewsHTML += `
            <div class="${reviewClass}" data-review-id="${review.review_id}">
                <div class="review-header">
                    <div>
                        <div class="reviewer-name">${review.name} ${verifiedBadge} ${isOwnReview ? '<span style="color: var(--primary-color); font-size: 0.8rem;">(You)</span>' : ''}</div>
                        <div class="rating-stars">${stars}${halfStar}</div>
                    </div>
                    <div class="review-date">
                        ${review.date}
                        ${deleteBtn}
                    </div>
                </div>
                <div class="review-text">
                    <strong>${review.title}</strong><br>
                    ${review.text}
                </div>
            </div>
        `;
    });
    
    reviewsContainer.innerHTML = reviewsHTML;
    updateViewMoreButton();
}

function updateViewMoreButton() {
    const btn = document.getElementById('viewMoreReviewsBtn');
    if (btn) {
        if (allProductReviews.length === 0) {
            btn.style.display = 'none';
        } else if (currentReviewsShown >= allProductReviews.length) {
            btn.style.display = 'block';
            btn.textContent = 'No More Reviews';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            btn.style.display = 'block';
            btn.textContent = `View More Reviews (${allProductReviews.length - currentReviewsShown} more)`;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }
}

function loadMoreReviews() {
    if (currentReviewsShown < allProductReviews.length) {
        currentReviewsShown = Math.min(currentReviewsShown + 3, allProductReviews.length);
        renderReviews();
    }
}

// =====================================================
// 评价表单功能
// =====================================================

function initReviewForm(productId) {
    // 设置星级评分选择
    const starRating = document.getElementById('starRating');
    if (starRating) {
        const stars = starRating.querySelectorAll('.star');
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                selectedRating = parseInt(this.dataset.rating);
                document.getElementById('reviewRating').value = selectedRating;
                updateStarDisplay(selectedRating);
            });
            
            star.addEventListener('mouseenter', function() {
                const hoverRating = parseInt(this.dataset.rating);
                updateStarDisplay(hoverRating, true);
            });
            
            star.addEventListener('mouseleave', function() {
                updateStarDisplay(selectedRating);
            });
        });
    }
    
    // 字数统计
    const reviewContent = document.getElementById('reviewContent');
    const charCount = document.getElementById('charCount');
    if (reviewContent && charCount) {
        reviewContent.addEventListener('input', function() {
            charCount.textContent = this.value.length;
        });
    }
    
    // 表单提交
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitReview(productId);
        });
    }
    
    // 检查用户是否已经评价过此产品
    checkUserReviewStatus(productId);
}

function updateStarDisplay(rating, isHover = false) {
    const stars = document.querySelectorAll('#starRating .star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add(isHover ? 'hover' : 'selected');
            if (!isHover) star.classList.remove('hover');
        } else {
            star.textContent = '☆';
            star.classList.remove('selected', 'hover');
        }
    });
}

function toggleReviewForm() {
    const formContainer = document.getElementById('reviewFormContainer');
    const writeBtn = document.getElementById('writeReviewBtn');
    
    if (!formContainer) return;
    
    // 检查是否登录
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    if (!customer) {
        if (confirm('Please login to write a review. Go to login page?')) {
            window.location.href = 'login.html';
        }
        return;
    }
    
    // 检查是否已经评价过
    const hasReviewed = allProductReviews.some(r => r.customer_id == customer.customer_id);
    if (hasReviewed) {
        if (typeof showNotification === 'function') {
            showNotification('You have already reviewed this product!', 'warning');
        } else {
            alert('You have already reviewed this product!');
        }
        return;
    }
    
    if (formContainer.style.display === 'none') {
        formContainer.style.display = 'block';
        writeBtn.style.display = 'none';
    } else {
        formContainer.style.display = 'none';
        writeBtn.style.display = 'inline-block';
        resetReviewForm();
    }
}

function resetReviewForm() {
    const form = document.getElementById('reviewForm');
    if (form) form.reset();
    selectedRating = 0;
    updateStarDisplay(0);
    const charCount = document.getElementById('charCount');
    if (charCount) charCount.textContent = '0';
}

function checkUserReviewStatus(productId) {
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    const writeBtn = document.getElementById('writeReviewBtn');
    
    if (!writeBtn) return;
    
    if (!customer) {
        writeBtn.innerHTML = '🔒 Login to Write Review';
    } else {
        const hasReviewed = allProductReviews.some(r => r.customer_id == customer.customer_id);
        if (hasReviewed) {
            writeBtn.innerHTML = '✅ You\'ve Reviewed This Product';
            writeBtn.disabled = true;
            writeBtn.style.opacity = '0.6';
        } else {
            writeBtn.innerHTML = '✍️ Write a Review';
            writeBtn.disabled = false;
            writeBtn.style.opacity = '1';
        }
    }
}

async function submitReview(productId) {
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    if (!customer) {
        alert('Please login to submit a review');
        return;
    }
    
    const rating = parseInt(document.getElementById('reviewRating').value);
    const title = document.getElementById('reviewTitle').value.trim();
    const content = document.getElementById('reviewContent').value.trim();
    
    // 验证
    if (rating < 1 || rating > 5) {
        if (typeof showNotification === 'function') {
            showNotification('Please select a rating (1-5 stars)', 'error');
        } else {
            alert('Please select a rating');
        }
        return;
    }
    
    if (!title || title.length < 3) {
        if (typeof showNotification === 'function') {
            showNotification('Please enter a review title (at least 3 characters)', 'error');
        } else {
            alert('Please enter a review title');
        }
        return;
    }
    
    if (!content || content.length < 20) {
        if (typeof showNotification === 'function') {
            showNotification('Please write at least 20 characters for your review', 'error');
        } else {
            alert('Please write at least 20 characters');
        }
        return;
    }
    
    // 提交评价
    const submitBtn = document.querySelector('#reviewForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Submitting...';
    }
    
    try {
        const response = await fetch('/summit-gear/api/reviews.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_id: productId,
                customer_id: customer.customer_id,
                rating: rating,
                title: title,
                content: content
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showNotification === 'function') {
                showNotification('Thank you for your review!', 'success');
            } else {
                alert('Thank you for your review!');
            }
            
            // 关闭表单
            toggleReviewForm();
            
            // 重新加载评价
            await loadReviewsFromDB(productId);
            renderReviews();
            checkUserReviewStatus(productId);
            
        } else {
            if (typeof showNotification === 'function') {
                showNotification(result.message || 'Failed to submit review', 'error');
            } else {
                alert(result.message || 'Failed to submit review');
            }
        }
    } catch (error) {
        console.error('Error submitting review:', error);
        if (typeof showNotification === 'function') {
            showNotification('Error submitting review. Please try again.', 'error');
        } else {
            alert('Error submitting review');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Review';
        }
    }
}

async function deleteReview(reviewId) {
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    if (!customer) return;
    
    if (!confirm('Are you sure you want to delete your review?')) return;
    
    try {
        const response = await fetch(`/summit-gear/api/reviews.php?id=${reviewId}&customer_id=${customer.customer_id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (typeof showNotification === 'function') {
                showNotification('Review deleted successfully', 'success');
            }
            
            // 重新加载评价
            await loadReviewsFromDB(currentProduct.product_id);
            renderReviews();
            checkUserReviewStatus(currentProduct.product_id);
        } else {
            if (typeof showNotification === 'function') {
                showNotification(result.message || 'Failed to delete review', 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting review:', error);
    }
}

// =====================================================
// 加载相关产品
// =====================================================
async function loadRelatedProducts(product) {
    try {
        const response = await fetch(`/summit-gear/api/products.php?category=${product.category}`);
        const result = await response.json();
        
        if (result.success && result.data) {
            // 过滤掉当前产品，取4个相关产品
            const relatedProducts = result.data
                .filter(p => p.product_id != product.product_id)
                .slice(0, 4);
            
            renderRelatedProducts(relatedProducts);
        }
    } catch (error) {
        console.error('Error loading related products:', error);
    }
}

function renderRelatedProducts(products) {
    const relatedSection = document.querySelector('.related-products .product-grid');
    if (!relatedSection) return;
    
    const customer = typeof getCurrentCustomer === 'function' ? getCurrentCustomer() : null;
    const discount = customer && typeof getMembershipDiscount === 'function' ? getMembershipDiscount(customer.membership_type) : 0;
    
    relatedSection.innerHTML = products.map(product => {
        const price = parseFloat(product.retail_price);
        const discountedPrice = price * (1 - discount / 100);
        const emoji = getProductEmoji(product);
        
        return `
            <div class="product-card">
                <div class="product-image">${emoji}</div>
                <h3>${product.name}</h3>
                <div class="price-info">
                    ${discount > 0 ? `
                        <span class="original-price" style="text-decoration: line-through; color: #9ca3af; margin-right: 0.5rem;">£${price.toFixed(2)}</span>
                        <span class="discounted-price">£${discountedPrice.toFixed(2)}</span>
                    ` : `
                        <span class="discounted-price">£${price.toFixed(2)}</span>
                    `}
                </div>
                <div class="product-actions">
                    <button class="btn btn-primary btn-block" onclick="addToCart(${product.product_id})">🛒 Add to Cart</button>
                    <a href="product-detail.html?id=${product.product_id}" class="btn btn-secondary btn-block">👁️ View Details</a>
                </div>
            </div>
        `;
    }).join('');
}

// =====================================================
// 产品未找到
// =====================================================
function showProductNotFound(productId) {
    const main = document.querySelector('main.container');
    if (main) {
        main.innerHTML = `
            <div style="text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 5rem; margin-bottom: 1rem;">😕</div>
                <h2>Product Not Found</h2>
                <p style="color: #666; margin: 1rem 0;">Product ID: ${productId} does not exist in our database.</p>
                <a href="products.html" class="btn btn-primary">Browse All Products</a>
            </div>
        `;
    }
}

// =====================================================
// 辅助功能函数
// =====================================================

function changeMainImage(emoji) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) mainImage.textContent = emoji;
    
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
        if (thumb.textContent === emoji) thumb.classList.add('active');
    });
}

function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    if (event && event.target) event.target.classList.add('active');
}

function increaseQuantity() {
    const input = document.getElementById('quantity');
    if (!input) return;
    const max = parseInt(input.max) || 99;
    const current = parseInt(input.value) || 1;
    if (current < max) input.value = current + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    if (!input) return;
    const current = parseInt(input.value) || 1;
    if (current > 1) input.value = current - 1;
}

function addToCartDetail() {
    const quantity = parseInt(document.getElementById('quantity')?.value) || 1;
    const productId = window.currentProductId;
    
    console.log('Adding to cart:', productId, 'quantity:', quantity);
    
    if (productId && typeof addToCart === 'function') {
        for (let i = 0; i < quantity; i++) {
            addToCart(productId);
        }
        
        setTimeout(() => {
            if (confirm('Added to cart! View cart now?')) {
                window.location.href = 'cart.html';
            }
        }, 300);
    } else {
        alert('Error adding to cart. Please try again.');
    }
}

function addToWishlist() {
    const productId = window.currentProductId;
    const productName = document.getElementById('productName')?.textContent || 'Product';
    
    if (typeof showNotification === 'function') {
        showNotification(`${productName} added to wishlist!`, 'success');
    } else {
        alert(`${productName} added to wishlist!`);
    }
    
    const btn = event?.target;
    if (btn) {
        btn.innerHTML = '❤️ In Wishlist';
        btn.style.background = '#f97316';
        btn.style.color = 'white';
    }
}

// 导出函数供全局使用
window.loadMoreReviews = loadMoreReviews;
window.showTab = showTab;
window.increaseQuantity = increaseQuantity;
window.decreaseQuantity = decreaseQuantity;
window.addToCartDetail = addToCartDetail;
window.addToWishlist = addToWishlist;
window.changeMainImage = changeMainImage;
window.toggleReviewForm = toggleReviewForm;
window.submitReview = submitReview;
window.deleteReview = deleteReview;
