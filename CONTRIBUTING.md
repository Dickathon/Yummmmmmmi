# 协作开发指南

本项目为离线静态 H5，三栏模块可并行开发。提交前请阅读 `Project Specification.md`。

## 分工与目录（减少 Git 冲突）

| 模块 | Tab id | 你可自由修改的路径 |
|------|--------|-------------------|
| 点餐 | `order` | `js/modules/order/`、`css/modules/order.css`、`assets/modules/order/` |
| 装扮 | `dress` | `js/modules/dress/`、`css/modules/dress.css`、`assets/modules/dress/` |
| 社交 | `social` | `js/modules/social/`、`css/modules/social.css`、`assets/modules/social/` |

**需团队协商后再改：** `js/core/`、`js/main.js`、`js/data/foods.js`、`index.html`（脚本/样式清单）、`css/variables.css` 等全局文件。

## 分支建议

```bash
git checkout main
git pull
git checkout -b feat/order-menu   # 或 feat/dress-xxx / feat/social-xxx
```

一个 PR 只做一个模块的主要改动，标题示例：

- `[order] 添加菜单列表`
- `[dress] 衣橱占位 UI`
- `[social] 好友列表骨架`

## 本地预览

用浏览器直接打开根目录 `index.html`，或使用本地静态服务（勿依赖在线 CDN）。

## 模块开发步骤

1. 阅读 `js/modules/<你的模块>/README.md`
2. 在 `state.js` / `view.js` / `screen.js` 中实现玩法
3. 样式写在 `css/modules/<id>.css`，类名使用模块前缀（如 `.order-`）
4. 图片放入 `assets/modules/<id>/`，注意压缩与 8MB 包体
5. 自测三栏切换是否正常，且未引入 `fetch` / 远程资源

## 代码约定

- 原生 HTML / CSS / JS，不引入大型框架
- 模块状态放在 `state.js`，不要污染 `window`（除 `Yummi.modules.<id>` 命名空间）
- 切换 Tab 时框架会调用 `onHide` / `onShow`，请在 `unbind` 中移除监听
- 食物名称与分类遵守 `Project Specification.md` §5

## 脚本加载顺序

`index.html` 中顺序已固定：共享 core → 各模块 `config → state → view → screen → index` → `main.js`。  
**新增文件时**：只在本模块注释块内插入，并保证 `index.js` 最后加载。

## 问题与联调

跨模块跳转使用 `ctx.navigate("social")`。  
跨模块共享数据需经团队约定（优先各模块自包含，避免改 `foods.js` 结构除非必要）。
