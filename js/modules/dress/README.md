# 装扮模块（dress）

**Tab id：** `dress`

## 功能

- 主应用 Tab：**占位页**（宠物装扮开发中）
- **转盘已迁至 order 模块**；转盘调试见 [`dress-preview.html`](../../../dress-preview.html)（加载 order）

## 目录职责

| 文件 | 职责 |
|------|------|
| `config.js` | meta |
| `state.js` | 占位状态 |
| `view.js` | 占位视图 |
| `screen.js` | 生命周期 |
| `index.js` | 注册入口 |

历史转盘资源说明见 `items-catalog.js`（dress 目录内，主应用不再加载）。

## 协作约定

- 只改本模块与 `css/modules/dress.css`
- PR 前缀：`[dress]`
