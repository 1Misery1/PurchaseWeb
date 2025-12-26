# Summit Gear & Adventures - 系统测试指南

## 📋 目录
1. [系统概述](#系统概述)
2. [访问地址](#访问地址)
3. [账户信息](#账户信息)
4. [门店信息](#门店信息)
5. [商品信息](#商品信息)
6. [功能测试指南](#功能测试指南)
7. [测试场景](#测试场景)

---

## 🏔️ 系统概述

Summit Gear & Adventures 是一个户外装备零售连锁店管理系统，包含以下模块：

| 模块 | 描述 |
|------|------|
| 🛒 Customer Portal | 顾客购物界面 |
| 👨‍💼 Staff Portal | 员工销售界面 |
| 📦 Supplier Portal | 供应商管理界面 |
| 🏢 Admin Portal | 管理员界面（HR/库存/商业/门店经理） |

---

## 🌐 访问地址

```
基础URL: http://localhost/summit-gear/
```

| 模块 | URL |
|------|-----|
| 顾客门户 | http://localhost/summit-gear/customer-portal/ |
| 员工门户 | http://localhost/summit-gear/staff-portal/ |
| 供应商门户 | http://localhost/summit-gear/supplier-portal/ |
| HR管理员 | http://localhost/summit-gear/admin-portal/hr-admin.html |
| 库存管理员 | http://localhost/summit-gear/admin-portal/inventory-admin.html |
| 商业管理员 | http://localhost/summit-gear/admin-portal/business-admin.html |

---

## 👥 账户信息

### 🔐 登录密码说明
- **管理员账户**: 密码为 `admin123`
- **员工账户**: 密码为 `staff123`
- **顾客账户**: 密码为 `password123`
- **供应商账户**: 密码为 `supplier123`

---

### 👨‍💼 管理员账户速查

> 完整员工列表见下方"员工账户"部分

| 门店 | Store Manager | Business Admin | Inventory Admin | HR Admin |
|------|---------------|----------------|-----------------|----------|
| Edinburgh | r.macgregor@summitgear.co.uk | e.watson@summitgear.co.uk | l.white@summitgear.co.uk | d.henderson@summitgear.co.uk |
| Glasgow | f.campbell@summitgear.co.uk | c.thomson@summitgear.co.uk | i.mckenzie@summitgear.co.uk | h.bruce@summitgear.co.uk |
| Aberdeen | a.stewart@summitgear.co.uk | m.douglas@summitgear.co.uk | r.macleod@summitgear.co.uk | s.grant@summitgear.co.uk |
| Inverness | e.fraser@summitgear.co.uk | a.ross@summitgear.co.uk | k.munro@summitgear.co.uk | g.sinclair@summitgear.co.uk |
| Dundee | c.murray@summitgear.co.uk | a.ferguson@summitgear.co.uk | b.robertson@summitgear.co.uk | c.wallace@summitgear.co.uk |

---

### 👷 员工账户 (全部)

#### Edinburgh Flagship 员工 (ID 1-14)
| ID | 姓名 | 职位 | 邮箱 |
|----|------|------|------|
| 1 | Robert MacGregor | Store Manager | r.macgregor@summitgear.co.uk |
| 2 | Emily Watson | Business Admin | e.watson@summitgear.co.uk |
| 3 | Lucy White | Inventory Admin | l.white@summitgear.co.uk |
| 4 | David Henderson | HR Admin | d.henderson@summitgear.co.uk |
| 5 | Alice Murray | Staff | a.murray.ed@summitgear.co.uk |
| 6 | Ben Fraser | Staff | b.fraser.ed@summitgear.co.uk |
| 7 | Claire Douglas | Staff | c.douglas.ed@summitgear.co.uk |
| 8 | Daniel Ross | Staff | d.ross.ed@summitgear.co.uk |
| 9 | Emma Campbell | Staff | e.campbell.ed@summitgear.co.uk |
| 10 | Finlay Stewart | Staff | f.stewart.ed@summitgear.co.uk |
| 11 | Grace Thomson | Staff | g.thomson.ed@summitgear.co.uk |
| 12 | Harry McKenzie | Staff | h.mckenzie.ed@summitgear.co.uk |
| 13 | Isla Grant | Staff | i.grant.ed@summitgear.co.uk |
| 14 | Jack Bruce | Staff | j.bruce.ed@summitgear.co.uk |

#### Glasgow Central 员工 (ID 15-28)
| ID | 姓名 | 职位 | 邮箱 |
|----|------|------|------|
| 15 | Fiona Campbell | Store Manager | f.campbell@summitgear.co.uk |
| 16 | Craig Thomson | Business Admin | c.thomson@summitgear.co.uk |
| 17 | Isla McKenzie | Inventory Admin | i.mckenzie@summitgear.co.uk |
| 18 | Hamish Bruce | HR Admin | h.bruce@summitgear.co.uk |
| 19 | Karen Wallace | Staff | k.wallace.gla@summitgear.co.uk |
| 20 | Liam Sinclair | Staff | l.sinclair.gla@summitgear.co.uk |
| 21 | Megan Robertson | Staff | m.robertson.gla@summitgear.co.uk |
| 22 | Nathan Ferguson | Staff | n.ferguson.gla@summitgear.co.uk |
| 23 | Olivia MacLeod | Staff | o.macleod.gla@summitgear.co.uk |
| 24 | Patrick Murray | Staff | p.murray.gla@summitgear.co.uk |
| 25 | Quinn Henderson | Staff | q.henderson.gla@summitgear.co.uk |
| 26 | Rachel Scott | Staff | r.scott.gla@summitgear.co.uk |
| 27 | Samuel Brown | Staff | s.brown.gla@summitgear.co.uk |
| 28 | Tara Wilson | Staff | t.wilson.gla@summitgear.co.uk |

#### Aberdeen Store 员工 (ID 29-42)
| ID | 姓名 | 职位 | 邮箱 |
|----|------|------|------|
| 29 | Angus Stewart | Store Manager | a.stewart@summitgear.co.uk |
| 30 | Morag Douglas | Business Admin | m.douglas@summitgear.co.uk |
| 31 | Rory MacLeod | Inventory Admin | r.macleod@summitgear.co.uk |
| 32 | Shona Grant | HR Admin | s.grant@summitgear.co.uk |
| 33 | Una Fraser | Staff | u.fraser.abd@summitgear.co.uk |
| 34 | Victor Ross | Staff | v.ross.abd@summitgear.co.uk |
| 35 | Wendy Campbell | Staff | w.campbell.abd@summitgear.co.uk |
| 36 | Xavier Thomson | Staff | x.thomson.abd@summitgear.co.uk |
| 37 | Yvonne McKenzie | Staff | y.mckenzie.abd@summitgear.co.uk |
| 38 | Zachary Bruce | Staff | z.bruce.abd@summitgear.co.uk |
| 39 | Amy Wallace | Staff | amy.wallace.abd@summitgear.co.uk |
| 40 | Brian Sinclair | Staff | brian.sinclair.abd@summitgear.co.uk |
| 41 | Carol Robertson | Staff | carol.robertson.abd@summitgear.co.uk |
| 42 | Derek Ferguson | Staff | derek.ferguson.abd@summitgear.co.uk |

#### Inverness Highland 员工 (ID 43-56)
| ID | 姓名 | 职位 | 邮箱 |
|----|------|------|------|
| 43 | Eilidh Fraser | Store Manager | e.fraser@summitgear.co.uk |
| 44 | Alasdair Ross | Business Admin | a.ross@summitgear.co.uk |
| 45 | Kirsty Munro | Inventory Admin | k.munro@summitgear.co.uk |
| 46 | Gregor Sinclair | HR Admin | g.sinclair@summitgear.co.uk |
| 47 | Ellen Murray | Staff | ellen.murray.inv@summitgear.co.uk |
| 48 | Fraser Henderson | Staff | fraser.henderson.inv@summitgear.co.uk |
| 49 | Gillian Scott | Staff | gillian.scott.inv@summitgear.co.uk |
| 50 | Hamish Brown | Staff | hamish.brown.inv@summitgear.co.uk |
| 51 | Irene Wilson | Staff | irene.wilson.inv@summitgear.co.uk |
| 52 | Jamie Douglas | Staff | jamie.douglas.inv@summitgear.co.uk |
| 53 | Kara Campbell | Staff | kara.campbell.inv@summitgear.co.uk |
| 54 | Lewis Thomson | Staff | lewis.thomson.inv@summitgear.co.uk |
| 55 | Mhairi McKenzie | Staff | mhairi.mckenzie.inv@summitgear.co.uk |
| 56 | Neil Bruce | Staff | neil.bruce.inv@summitgear.co.uk |

#### Dundee Outlet 员工 (ID 57-70)
| ID | 姓名 | 职位 | 邮箱 |
|----|------|------|------|
| 57 | Callum Murray | Store Manager | c.murray@summitgear.co.uk |
| 58 | Aileen Ferguson | Business Admin | a.ferguson@summitgear.co.uk |
| 59 | Blair Robertson | Inventory Admin | b.robertson@summitgear.co.uk |
| 60 | Catriona Wallace | HR Admin | c.wallace@summitgear.co.uk |
| 61 | Orla Grant | Staff | orla.grant.dun@summitgear.co.uk |
| 62 | Peter Sinclair | Staff | peter.sinclair.dun@summitgear.co.uk |
| 63 | Rhona Robertson | Staff | rhona.robertson.dun@summitgear.co.uk |
| 64 | Scott Ferguson | Staff | scott.ferguson.dun@summitgear.co.uk |
| 65 | Tina MacLeod | Staff | tina.macleod.dun@summitgear.co.uk |
| 66 | Ulric Murray | Staff | ulric.murray.dun@summitgear.co.uk |
| 67 | Victoria Henderson | Staff | victoria.henderson.dun@summitgear.co.uk |
| 68 | William Scott | Staff | william.scott.dun@summitgear.co.uk |
| 69 | Xena Brown | Staff | xena.brown.dun@summitgear.co.uk |
| 70 | Yuri Wilson | Staff | yuri.wilson.dun@summitgear.co.uk |

#### 自定义添加的员工
| ID | 姓名 | 门店 | 邮箱 |
|----|------|------|------|
| 71 | King | Aberdeen Store | 2617340@dundee.ac.uk |
| 72 | Edison | Dundee Outlet | 123456@dundee.ac.uk |

---

### 🛒 顾客账户

| 姓名 | 邮箱 | 会员等级 | 累计积分 | 累计消费 |
|------|------|----------|----------|----------|
| James Wilson | james.wilson@email.com | Gold | 2450 | £2850 |
| Emma Thompson | emma.t@email.com | Silver | 680 | £890 |
| Oliver Brown | o.brown@email.com | Platinum | 5200 | £6100 |
| Sophie Clark | s.clark@email.com | Bronze | 120 | £150 |
| William Scott | w.scott@email.com | Silver | 890 | £1200 |

---

### 📦 供应商账户

| 供应商名称 | 联系人 | 邮箱 | 品牌 |
|------------|--------|------|------|
| North Face UK | James Mitchell | j.mitchell@northface.co.uk | The North Face |
| Black Diamond Equipment | Sarah Connor | s.connor@blackdiamond.co.uk | Black Diamond |
| MSR Outdoor | Mike Chen | m.chen@msr.co.uk | MSR |
| Garmin UK | Emma Watson | e.watson@garmin.co.uk | Garmin |
| Patagonia Europe | David Brown | d.brown@patagonia.eu | Patagonia |

---

## 🏪 门店信息

| ID | 门店名称 | 城市 |
|----|----------|------|
| 1 | Edinburgh Flagship | Edinburgh |
| 2 | Glasgow Central | Glasgow |
| 3 | Aberdeen Store | Aberdeen |
| 4 | Inverness Highland | Inverness |
| 5 | Dundee Outlet | Dundee |

---

## 🎒 商品信息

### 商品分类与数量

| 分类 | 商品数量 | 价格范围 |
|------|----------|----------|
| Camping | 8 | £75 - £699 |
| Climbing | 6 | £85 - £180 |
| Clothing | 6 | £149 - £599 |
| Footwear | 5 | £130 - £480 |
| Electronics | 5 | £89 - £749 |
| Backpacks | 5 | £95 - £359 |
| Lighting | 3 | £55 - £79 |
| Tools | 2 | £59 - £120 |

### 品牌与供应商对应

| 品牌 | 供应商 | 商品数量 |
|------|--------|----------|
| The North Face | North Face UK | 8 |
| Black Diamond | Black Diamond Equipment | 10 |
| MSR | MSR Outdoor | 8 |
| Garmin | Garmin UK | 6 |
| Patagonia | Patagonia Europe | 10 |

### 热门商品示例

| SKU | 商品名称 | 分类 | 零售价 |
|-----|----------|------|--------|
| CMP001 | North Face Stormbreak 2 Tent | Camping | £450.00 |
| ELC002 | Garmin Fenix 7 Solar Watch | Electronics | £749.00 |
| CLT001 | Patagonia Nano Puff Jacket | Clothing | £220.00 |
| CLM001 | Black Diamond Climbing Rope 60m | Climbing | £180.00 |
| BKP001 | Patagonia Refugio Pack 65L | Backpacks | £320.00 |

---

## 📱 功能测试指南

### 1. 顾客门户 (Customer Portal)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 🔍 商品浏览 | 按分类、品牌、价格筛选商品 |
| 🛒 购物车 | 添加商品、修改数量、删除商品 |
| 📦 下单 | 选择配送方式（到店自取/快递）、选择门店 |
| 💳 支付 | 使用积分抵扣、会员折扣自动应用 |
| 📜 订单历史 | 查看订单状态、订单详情 |
| 🔄 退货申请 | 对已完成订单申请退货 |
| 👤 账户管理 | 查看积分、会员等级、个人信息 |

#### 测试步骤
1. 访问 http://localhost/summit-gear/customer-portal/
2. 点击"Login"登录 (例: james.wilson@email.com / password123)
3. 浏览商品，添加到购物车
4. 进入购物车，选择配送方式和门店
5. 确认订单（观察会员折扣和促销折扣）
6. 查看订单历史中的新订单

---

### 2. 员工门户 (Staff Portal)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 📋 待处理订单 | 查看所有待处理订单 |
| ✅ 完成订单 | 处理订单并完成销售 |
| 📊 我的业绩 | 查看今日/本周/本月销售额 |
| 🔄 退货处理 | 审批顾客的退货申请 |

#### 测试步骤
1. 访问 http://localhost/summit-gear/staff-portal/
2. 登录员工账户 (例: a.murray.ed@summitgear.co.uk / staff123)
3. 在"Pending Orders"中处理订单
4. 点击"Complete Order"完成订单
5. 切换到"My Performance"查看业绩
6. 切换到"Returns"处理退货申请

---

### 3. 供应商门户 (Supplier Portal)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 📊 仪表盘 | 查看销售概况、待处理事项 |
| 📦 商品管理 | 查看自己品牌的商品列表 |
| 📋 补货订单 | 处理来自门店的补货请求 |
| 💰 支付管理 | 查看待收款和已收款记录 |
| 📈 报表 | 生成销售报告（PDF/CSV） |

#### 测试步骤
1. 访问 http://localhost/summit-gear/supplier-portal/
2. 登录供应商账户 (例: j.mitchell@northface.co.uk / supplier123)
3. 查看仪表盘概况
4. 在"Stock Requests"中处理补货请求
5. 点击"Confirm & Ship"确认发货
6. 在"Reports"中导出报表

---

### 4. HR管理员 (HR Admin)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 👥 员工管理 | 添加、编辑、查看员工 |
| 📊 员工业绩 | 查看本门店所有员工的销售业绩 |

#### 测试步骤
1. 访问 http://localhost/summit-gear/admin-portal/hr-admin.html
2. 登录HR管理员 (例: d.henderson@summitgear.co.uk / admin123)
3. 查看员工列表
4. 查看"Staff Sales Performance"板块的员工业绩排名

---

### 5. 库存管理员 (Inventory Admin)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 📦 库存概览 | 查看本门店库存统计 |
| ⚠️ 低库存警告 | 查看库存低于阈值的商品 |
| 📋 补货请求 | 创建、管理补货订单 |
| ✅ 确认收货 | 确认供应商发来的货物 |
| 💳 支付管理 | 支付已收货的订单 |

#### 测试步骤
1. 访问 http://localhost/summit-gear/admin-portal/inventory-admin.html
2. 登录库存管理员 (例: l.white@summitgear.co.uk / admin123)
3. 查看仪表盘上的库存统计（确保只显示本门店数据）
4. 在"Low Stock"中查看低库存商品
5. 创建补货请求
6. 供应商发货后，确认收货并支付

---

### 6. 商业管理员 (Business Admin)

#### 功能列表
| 功能 | 描述 |
|------|------|
| 📊 数据分析 | 查看销售趋势、分类销售、品牌销售等可视化图表 |
| 🎯 促销管理 | 创建、编辑、启用/禁用促销活动 |
| 🖼️ 首页横幅 | 管理顾客界面的横幅广告 |
| 📈 利润分析 | 查看分类、品牌的利润分析 |

#### 测试步骤
1. 访问 http://localhost/summit-gear/admin-portal/business-admin.html
2. 登录商业管理员 (例: e.watson@summitgear.co.uk / admin123)
3. 查看"Business Analytics"中的各项数据可视化
4. 在"Promotions"中创建新促销（设置折扣百分比、最低消费）
5. 在"Banners"中管理首页横幅

---

## 🧪 测试场景

### 场景1: 完整购物流程

```
步骤：
1. 顾客登录 → 浏览商品 → 添加购物车 → 下单
2. 员工登录 → 查看待处理订单 → 完成订单
3. 顾客登录 → 查看订单历史（状态应为Completed）
4. 员工查看 → "My Performance"应增加销售额
```

**预期结果**：
- ✅ 订单状态正确更新
- ✅ 员工业绩正确增加
- ✅ 顾客积分正确增加
- ✅ 库存正确减少

---

### 场景2: 退货流程

```
步骤：
1. 顾客登录 → 订单历史 → 选择已完成订单 → 点击"Request Return"
2. 填写退货原因 → 提交申请
3. 员工登录 → "Returns"标签 → 搜索订单
4. 审批退货（Approve 或 Reject）
```

**预期结果（Approve）**：
- ✅ 订单状态变为 Returned
- ✅ 库存恢复（状态为 Returned）
- ✅ 顾客积分扣除
- ✅ 员工业绩相应减少
- ✅ 商业分析中收入相应减少

---

### 场景3: 补货流程

```
步骤：
1. 库存管理员登录 → 查看低库存商品
2. 创建补货请求（选择商品、数量）
3. 供应商登录 → "Stock Requests" → 点击"Confirm & Ship"
4. 库存管理员登录 → 点击"Confirm Receipt"确认收货
5. 点击"Pay"支付订单
```

**预期结果**：
- ✅ 补货请求状态：Pending → In Transit → Completed
- ✅ 确认收货后库存数量增加
- ✅ 支付后供应商收到付款记录

---

### 场景4: 促销活动

```
步骤：
1. Business Admin登录 → "Promotions" → 创建新促销
   - 标题: "测试折扣"
   - 折扣: 10%
   - 最低消费: £50
   - 日期: 当天有效
2. 顾客登录 → 添加商品超过£50 → 进入购物车
3. 选择门店 → 查看订单汇总
```

**预期结果**：
- ✅ 购物车显示"Promotion Discount: -£xx.xx"
- ✅ 最终金额正确扣除促销折扣
- ✅ 订单确认时显示所有折扣明细

---

### 场景5: 会员等级测试

| 会员等级 | 累计消费门槛 | 折扣 | 积分倍率 |
|----------|--------------|------|----------|
| Bronze | £0 | 0% | 1x |
| Silver | £500 | 5% | 1.5x |
| Gold | £2000 | 10% | 2x |
| Platinum | £5000 | 15% | 3x |

```
测试步骤：
1. 登录不同会员等级的顾客账户
2. 添加相同商品到购物车
3. 对比显示的会员折扣是否正确
```

---

### 场景6: 门店数据隔离

```
测试步骤：
1. 登录Edinburgh的库存管理员(l.white@summitgear.co.uk)
2. 查看库存数据 → 应只显示Edinburgh门店的库存
3. 登录Glasgow的库存管理员(i.mckenzie@summitgear.co.uk)
4. 查看库存数据 → 应只显示Glasgow门店的库存
```

**预期结果**：
- ✅ 各门店管理员只能看到自己门店的数据
- ✅ 促销活动只影响设置该促销的门店

---

## ⚠️ 常见问题

### Q: 页面数据不更新？
**A:** 尝试强制刷新浏览器 (Ctrl+Shift+R 或 Cmd+Shift+R)

### Q: 登录失败？
**A:** 检查密码是否正确：
- 管理员: admin123
- 员工: staff123
- 顾客: password123
- 供应商: supplier123

### Q: 库存不足无法下单？
**A:** 系统会校验所选门店的库存，确保库存充足或选择其他门店

### Q: 促销没有生效？
**A:** 检查：
1. 促销是否处于激活状态 (Active)
2. 当前日期是否在促销有效期内
3. 购物金额是否达到最低消费要求
4. 是否选择了正确的门店

---

## 📊 数据库重置

如需重置数据库，在MySQL中执行：

```sql
SOURCE /Applications/XAMPP/xamppfiles/htdocs/summit-gear/数据库.sql
```

这将：
- 删除并重建数据库
- 插入所有预设数据（员工、顾客、商品、库存等）
- 重置所有订单和交易记录

---

## 📝 版本信息

- **系统版本**: 2.0
- **最后更新**: 2025年12月25日
- **开发环境**: XAMPP (Apache + MySQL + PHP)

---

*Summit Gear & Adventures - 探索无限，装备齐全* 🏔️

