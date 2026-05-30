# 装扮模块（dress）

**Tab id：** `dress`

## 功能说明（来自 `wmx` 分支整合）

- 主应用 `index.html` → **装扮** Tab：三层椭圆转盘，**回转小火锅**式（6 格 × 每格固定一道菜）
- 旋转：`translate(cx,cy) scale(1,ry/rx)` 后顶面色固定，扇区在 `data-disc-rotor` 内 `rotate(angle)`（同 wmx 转盘）
- 立牌：在 viewBox 层（不在椭圆 `scale` 组内），槽位公转、牌身朝上；`Image` 预载等比缩至 `itemSize`；`placardDrop` 微调下移贴盘
- 独立调试页：[`dress-preview.html`](../../../dress-preview.html)
- 规范与原型：[`wmx-temporary/displayment-wmx/组件合并规范.md`](../../../wmx-temporary/displayment-wmx/组件合并规范.md)、[`wmx-temporary/转盘/index.html`](../../../wmx-temporary/转盘/index.html)

## 目录职责

| 文件 | 职责 |
|------|------|
| `config.js` | 模块 id、meta、资源路径 |
| `state.js` | 转盘状态（三层 disc、角度、拖拽） |
| `view.js` | SVG 转盘渲染、指针交互、动画 |
| `screen.js` | 生命周期（`onShow`/`onHide` 启停动画） |
| `preview.js` | 仅 `dress-preview.html` 使用 |
| `index.js` | 注册入口 |

## 资源

- 运行时：`css/modules/dress.css`
- 正式资源：沿用 `source/compressed/10kb/` 食物 WebP（与点餐模块同源）

## 协作约定

- 只改本模块目录、`css/modules/dress.css`、`dress-preview.html`（若需）
- 勿改 `js/core/`、`index.html` 中其他模块脚本块
- PR 描述前缀：`[dress]`
