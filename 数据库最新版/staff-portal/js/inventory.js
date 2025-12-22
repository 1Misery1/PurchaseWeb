// =====================================================
// Inventory Management JavaScript
// =====================================================

let currentProduct = null;

// 调整库存
function adjustStock(sku) {
    // 模拟产品数据
    const products = {
        'TNT001': { name: 'North Face 帐篷', stock: 15 },
        'CLR002': { name: 'Climbing Rope Pro', stock: 5 },
        'GPS003': { name: 'GPS Garmin', stock: 0 },
        'SLP004': { name: 'Sleeping Bag Pro', stock: 22 },
        'BKP005': { name: 'Elite Backpack', stock: 7 }
    };
    
    if (products[sku]) {
        currentProduct = { sku, ...products[sku] };
        document.getElementById('productName').value = `${sku} - ${currentProduct.name}`;
        document.getElementById('currentStock').value = currentProduct.stock;
        document.getElementById('adjustment').value = '';
        document.getElementById('reason').value = '';
        document.getElementById('adjustModal').classList.add('active');
    }
}

// 确认调整
function confirmAdjustment() {
    const adjustment = parseInt(document.getElementById('adjustment').value) || 0;
    const reason = document.getElementById('reason').value;
    
    if (!reason) {
        alert('请输入调整原因');
        return;
    }
    
    if (adjustment === 0) {
        alert('请输入调整数量');
        return;
    }
    
    const newStock = currentProduct.stock + adjustment;
    
    if (newStock < 0) {
        alert('调整后库存不能为负数！');
        return;
    }
    
    alert(`✅ 库存调整成功！\n\n产品: ${currentProduct.name}\n调整: ${adjustment > 0 ? '+' : ''}${adjustment}\n新库存: ${newStock}\n原因: ${reason}`);
    
    closeModal();
    // 实际应用中会提交到服务器并刷新表格
}

// 关闭模态窗口
function closeModal() {
    document.getElementById('adjustModal').classList.remove('active');
}

// 查看其他分店库存
function checkOtherStores(sku) {
    // 模拟其他分店库存数据
    const otherStores = {
        'Glasgow': Math.floor(Math.random() * 20),
        'Aberdeen': Math.floor(Math.random() * 15),
        'Inverness': Math.floor(Math.random() * 12),
        'Dundee': Math.floor(Math.random() * 10)
    };
    
    let message = `其他分店库存情况 (${sku})：\n\n`;
    for (const [store, stock] of Object.entries(otherStores)) {
        message += `${store}: ${stock}件\n`;
    }
    message += `\n可以申请跨店调拨`;
    
    alert(message);
}

// 申请补货
function requestRestock(sku) {
    const quantity = prompt(`产品 ${sku} 已缺货。\n请输入需要补货的数量：`);
    
    if (quantity && parseInt(quantity) > 0) {
        alert(`✅ 补货申请已提交！\n\n产品: ${sku}\n数量: ${quantity}\n\n管理员会尽快处理您的申请。`);
    }
}

// 申请库存调拨
function requestStockTransfer() {
    alert('打开库存调拨申请表单...\n\n您可以从其他分店调拨库存到本店。\n实际应用中会显示调拨表单。');
}

// 应用筛选
function applyFilters() {
    const search = document.getElementById('searchInventory').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const stock = document.getElementById('stockFilter').value;
    
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    
    rows.forEach(row => {
        const sku = row.cells[0].textContent.toLowerCase();
        const name = row.cells[1].textContent.toLowerCase();
        const cat = row.cells[2].textContent;
        const statusBadge = row.querySelector('.stock-badge');
        
        let show = true;
        
        // 搜索筛选
        if (search && !sku.includes(search) && !name.includes(search)) {
            show = false;
        }
        
        // 类别筛选
        if (category && !cat.includes(category)) {
            show = false;
        }
        
        // 库存状态筛选
        if (stock) {
            const hasClass = statusBadge.classList.contains(stock);
            if (!hasClass) show = false;
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// 重置筛选
function resetFilters() {
    document.getElementById('searchInventory').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('stockFilter').value = '';
    
    const rows = document.querySelectorAll('#inventoryTableBody tr');
    rows.forEach(row => {
        row.style.display = '';
    });
}

// 实时搜索
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInventory');
    if (searchInput) {
        searchInput.addEventListener('input', applyFilters);
    }
});

console.log('✅ Inventory管理脚本已加载');







