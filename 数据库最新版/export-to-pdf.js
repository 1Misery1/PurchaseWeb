#!/usr/bin/env node

/**
 * 自动将HTML页面导出为PDF
 * 
 * 使用方法：
 * 1. 安装依赖: npm install puppeteer
 * 2. 运行脚本: node export-to-pdf.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// 要导出的页面列表
const pages = [
    {
        name: '业务管理员界面',
        file: 'admin-portal/business-dashboard.html',
        output: 'exports/01-业务管理员控制台.pdf'
    },
    {
        name: '人员管理员界面',
        file: 'admin-portal/hr-dashboard.html',
        output: 'exports/02-人员管理员控制台.pdf'
    },
    {
        name: '资源管理员界面',
        file: 'admin-portal/resource-dashboard.html',
        output: 'exports/03-资源管理员控制台.pdf'
    },
    {
        name: '客户门户',
        file: 'customer-portal/index.html',
        output: 'exports/04-客户门户.pdf'
    },
    {
        name: '供应商门户',
        file: 'supplier-portal/index.html',
        output: 'exports/05-供应商门户.pdf'
    },
    {
        name: '员工门户',
        file: 'staff-portal/index.html',
        output: 'exports/06-员工POS系统.pdf'
    },
    {
        name: '主导航页',
        file: 'index.html',
        output: 'exports/07-主导航页.pdf'
    }
];

async function exportToPDF() {
    console.log('🚀 开始导出PDF...\n');

    // 创建导出目录
    if (!fs.existsSync('exports')) {
        fs.mkdirSync('exports');
        console.log('📁 创建导出目录: exports/\n');
    }

    // 启动浏览器
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    console.log('🌐 浏览器已启动\n');

    let successCount = 0;
    let failCount = 0;

    // 逐个导出页面
    for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const num = i + 1;
        
        try {
            console.log(`📄 [${num}/${pages.length}] 正在导出: ${page.name}`);
            
            const webPage = await browser.newPage();
            
            // 设置视口大小（模拟桌面显示）
            await webPage.setViewport({
                width: 1920,
                height: 1080,
                deviceScaleFactor: 1
            });

            // 加载HTML文件
            const filePath = path.resolve(__dirname, page.file);
            await webPage.goto(`file://${filePath}`, {
                waitUntil: 'networkidle0',
                timeout: 30000
            });

            // 等待页面完全加载
            await webPage.waitForTimeout(1000);

            // 导出为PDF
            await webPage.pdf({
                path: page.output,
                format: 'A4',
                printBackground: true, // 关键：打印背景色
                margin: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                },
                preferCSSPageSize: true
            });

            await webPage.close();
            
            console.log(`   ✅ 已保存: ${page.output}\n`);
            successCount++;
            
        } catch (error) {
            console.error(`   ❌ 导出失败: ${error.message}\n`);
            failCount++;
        }
    }

    await browser.close();

    // 输出统计
    console.log('━'.repeat(50));
    console.log('📊 导出完成！');
    console.log(`✅ 成功: ${successCount} 个`);
    if (failCount > 0) {
        console.log(`❌ 失败: ${failCount} 个`);
    }
    console.log(`📁 PDF文件保存在: exports/ 目录`);
    console.log('━'.repeat(50));
}

// 检查是否安装了puppeteer
try {
    require.resolve('puppeteer');
    exportToPDF().catch(error => {
        console.error('❌ 导出过程出错:', error);
        process.exit(1);
    });
} catch (e) {
    console.error('❌ 未找到 puppeteer 模块！');
    console.log('\n请先安装依赖：');
    console.log('  npm install puppeteer');
    console.log('\n或使用快速安装：');
    console.log('  npm install');
    process.exit(1);
}




