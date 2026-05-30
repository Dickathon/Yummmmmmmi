# 社交模块（social）

**Tab id：** `social`

## 功能说明（`ljh` 分支整合）

点击主应用底部 **社交** 会进入 [`social-map.html`](../../../social-map.html)（美食街区地图），不在 `#screen-root` 内嵌渲染。

| 文件 | 说明 |
|------|------|
| `social-map.html` | 美食街区页面（返回 `index.html`） |
| `js/social-map.js` | 店铺列表、点击预览 |
| `css/social-map.css` | 街区样式 |
| `source/shop/` | 16 家店铺图标 |

本目录 `view.js` / `screen.js` 仍为模块占位；若改为内嵌地图，可将 `social-map.js` 逻辑迁入 `view.js`。

## 目录职责

| 文件 | 职责 |
|------|------|
| `config.js` | meta、资源路径 |
| `state.js` / `view.js` / `screen.js` | 模块生命周期（当前占位） |
| `index.js` | 注册入口 |

## 协作约定

- 社交玩法优先改 `social-map.html`、`js/social-map.js`、`css/social-map.css`、`source/shop/`
- PR 前缀：`[social]`
