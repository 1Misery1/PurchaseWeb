// =====================================================
// Products Management JavaScript
// =====================================================

// 打开添加产品模态窗口
function openAddProductModal() {
    document.getElementById('modalTitle').textContent = '添加新产品';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.add('active');
}

// 关闭产品模态窗口
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

// 编辑产品
function editProduct(productId) {
    document.getElementById('modalTitle').textContent = '编辑产品';
    document.getElementById('productModal').classList.add('active');
    
    // 实际应用中会从服务器加载产品数据
    // 这里使用模拟数据
    const mockData = {
        1: { name: 'North Face 帐篷', sku: 'TNT-001', category: 'camping', price: 450, stock: 45 },
        2: { name: 'Sleeping Bag Pro', sku: 'SLP-002', category: 'camping', price: 280, stock: 32 },
        3: { name: 'Waterproof Jacket', sku: 'JKT-003', category: 'clothing', price: 250, stock: 18 },
        4: { name: 'Hiking Boots Pro', sku: 'BTS-004', category: 'footwear', price: 180, stock: 5 },
        5: { name: 'Elite Backpack', sku: 'BKP-005', category: 'accessories', price: 180, stock: 28 },
        6: { name: 'LED Headlamp', sku: 'LMP-006', category: 'camping', price: 45, stock: 8 }
    };
    
    if (mockData[productId]) {
        const data = mockData[productId];
        document.getElementById('productName').value = data.name;
        document.getElementById('productSKU').value = data.sku;
        document.getElementById('productCategory').value = data.category;
        document.getElementById('productPrice').value = data.price;
        document.getElementById('productStock').value = data.stock;
    }
}

// 查看产品
function viewProduct(productId) {
    alert(`查看产品详情 #${productId}\n\n实际应用中会显示完整的产品信息页面。`);
}

// 应用筛选
function applyFilters() {
    const search = document.getElementById('searchProducts').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const stock = document.getElementById('stockFilter').value;
    
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        const productName = product.querySelector('.product-name').textContent.toLowerCase();
        const productSKU = product.querySelector('.product-sku').textContent.toLowerCase();
        const productCategory = product.getAttribute('data-category');
        const productStock = product.getAttribute('data-stock');
        
        let showProduct = true;
        
        // 搜索筛选
        if (search && !productName.includes(search) && !productSKU.includes(search)) {
            showProduct = false;
        }
        
        // 类别筛选
        if (category && productCategory !== category) {
            showProduct = false;
        }
        
        // 库存筛选
        if (stock && productStock !== stock) {
            showProduct = false;
        }
        
        product.style.display = showProduct ? 'block' : 'none';
    });
}

// 重置筛选
function resetFilters() {
    document.getElementById('searchProducts').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stockFilter').value = '';
    
    const products = document.querySelectorAll('.product-card');
    products.forEach(product => {
        product.style.display = 'block';
    });
}

// 表单提交
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('productName').value;
            const sku = document.getElementById('productSKU').value;
            const category = document.getElementById('productCategory').value;
            const price = document.getElementById('productPrice').value;
            const stock = document.getElementById('productStock').value;
            
            alert(`✅ 产品已保存！\n\n名称: ${name}\nSKU: ${sku}\n类别: ${category}\n价格: £${price}\n库存: ${stock}`);
            
            closeProductModal();
            
            // 实际应用中会提交到服务器
            console.log('Product saved:', { name, sku, category, price, stock });
        });
    }
    
    // 实时搜索
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});

console.log('✅ Products管理脚本已加载');







