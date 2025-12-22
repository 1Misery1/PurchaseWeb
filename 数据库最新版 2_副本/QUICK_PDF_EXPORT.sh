#!/bin/bash

# 快速PDF导出脚本
# 此脚本会在浏览器中打开所有HTML文件，您可以逐个按 Cmd+P 导出为PDF

echo "🚀 正在打开所有管理员界面..."
echo ""
echo "📋 导出步骤："
echo "1. 浏览器会自动打开每个页面"
echo "2. 按 Cmd+P (Mac) 或 Ctrl+P (Windows)"
echo "3. 勾选 '背景图形' ✓"
echo "4. 选择 '另存为PDF'"
echo "5. 保存文件"
echo ""
echo "按 Enter 继续..."
read

# 管理员门户
echo "📄 1/7 - 打开业务管理员界面..."
open admin-portal/business-dashboard.html
sleep 2

echo "📄 2/7 - 打开人员管理员界面..."
open admin-portal/hr-dashboard.html
sleep 2

echo "📄 3/7 - 打开资源管理员界面..."
open admin-portal/resource-dashboard.html
sleep 2

# 其他门户
echo "📄 4/7 - 打开客户门户..."
open customer-portal/index.html
sleep 2

echo "📄 5/7 - 打开供应商门户..."
open supplier-portal/index.html
sleep 2

echo "📄 6/7 - 打开员工门户..."
open staff-portal/index.html
sleep 2

echo "📄 7/7 - 打开主导航页..."
open index.html

echo ""
echo "✅ 所有页面已打开！"
echo "📋 现在请在每个浏览器标签页中按 Cmd+P 导出为PDF"
echo "⚠️  记得勾选 '背景图形' 选项！"




