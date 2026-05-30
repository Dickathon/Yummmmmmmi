# 点餐模块（order）

**Tab id：** `order`

## 功能

- **三层椭圆转盘**（自 dress 迁入）：6 格立牌、food1/2/3 轮换池、拖动盘面、θ=275° 换菜
- **转盘食物展示逻辑说明：** [`TURNTABLE-FOOD-DISPLAY.md`](TURNTABLE-FOOD-DISPLAY.md)（HTML 结构、极坐标定位、可见性、换菜、动画）
- 调试页：[`dress-preview.html`](../../../dress-preview.html)（挂载 order 脚本）
- 目录生成：`node js/modules/dress/scripts/gen-items-catalog.mjs` 后复制或重跑 `node js/modules/order/scripts/port-turntable-from-dress.mjs` 同步 `items-catalog.js`（或手动同步 catalog）

## 目录职责

| 文件 | 职责 |
|------|------|
| `items-catalog.js` | food1/2/3 WebP 路径列表 |
| `config.js` | 转盘与 meta 配置 |
| `state.js` | 三层 disc、洗牌、换菜逻辑 |
| `view.js` | SVG 转盘、交互、动画 |
| `screen.js` | 生命周期 |
| `preview.js` | 仅 `dress-preview.html` |
| `index.js` | 注册入口 |

## 资源

- 样式：`css/modules/order.css`（`.order-` 前缀）
- 图片：`source/compressed/10kb/`

## 协作约定

- 只改 `js/modules/order/`、`css/modules/order.css`
- `index.html` 中 order 脚本块变更需团队协商
- PR 前缀：`[order]`
