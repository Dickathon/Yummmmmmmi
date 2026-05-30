# 点餐模块（order）

**Tab id：** `order`（与 `index.html` 中 `data-tab="order"` 一致）

## 目录职责

| 文件 | 职责 |
|------|------|
| `config.js` | 模块 id、meta、资源路径 |
| `state.js` | 模块内部状态 |
| `view.js` | DOM 渲染与事件 |
| `screen.js` | 生命周期对象 |
| `index.js` | 注册入口（仅 `module.define`） |

## 资源

- 图片/音频：`assets/modules/order/`
- 样式：`css/modules/order.css`（类名建议 `.order-` 前缀）

## 协作约定

- 只改 `js/modules/order/`、`css/modules/order.css`、`assets/modules/order/`
- 勿改 `js/core/`、`js/main.js`、`index.html` 中其他模块的 script 标签（除非团队协商）
- 提交 PR 时在描述中写：`[order] 完成了什么`
