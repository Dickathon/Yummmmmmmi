# 模块开发说明

三栏玩法按目录隔离，便于在 GitHub 上并行提交 PR、减少冲突。

## 目录地图

```
js/
  core/           ← 共享内核（协商后修改）
    util.js
    screens.js
    module.js
  main.js         ← 应用壳（协商后修改）
  modules/
    order/        ← 点餐（建议一位负责人）
    dress/        ← 装扮
    social/       ← 社交
css/
  variables.css … ← 全局样式（协商后修改）
  modules/
    order.css     ← 仅点餐
    dress.css
    social.css
assets/modules/
  order/          ← 仅点餐资源
  dress/
  social/
```

## 标准模块文件

每个 `js/modules/<id>/` 包含：

| 文件 | 说明 |
|------|------|
| `config.js` | `id`、`meta`（标题/描述/Hero）、`assetsBase` |
| `state.js` | 模块私有状态，`create` / `reset` |
| `view.js` | `render` + `bind` / `unbind` |
| `screen.js` | `create(ctx)` 返回 `{ mount, unmount, onShow?, onHide? }` |
| `index.js` | 仅调用 `Yummi.module.define()` |
| `README.md` | 模块说明 |

## 注册流程

`index.html` 按顺序加载脚本后，`index.js` 会执行：

```javascript
Yummi.module.define({
  id: "order",
  meta: { ... },
  create: function (ctx) {
    return Yummi.modules.order.screen.create(ctx);
  }
});
```

## 上下文 ctx

`mount(container, ctx)` 时可用：

- `ctx.id` — 模块 id
- `ctx.foods` — 共享食物数据（点餐常用）
- `ctx.navigate("dress")` — 切换 Tab
- `ctx.app` — `Yummi.app`（`setActiveTab` 等）

## 复制新模块骨架

参考 `js/modules/_template/`（勿直接改 template，复制到新目录）。

## 提交规范

- PR 描述前缀：`[order]` / `[dress]` / `[social]`
- 勿在同一 PR 混改多个模块（除非联调约定）
- 遵守根目录 `Project Specification.md`（离线、8MB、无网络请求）

详见仓库根目录 `CONTRIBUTING.md`。
