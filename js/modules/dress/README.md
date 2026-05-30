# 装扮模块（dress）

**Tab id：** `dress`

## 功能说明（来自 `wmx` 分支整合）

- 主应用 `index.html` → **装扮** Tab：三层椭圆转盘（可拖拽旋转、自动慢转）
- 独立调试页：根目录 [`dress-preview.html`](../../../dress-preview.html)（仅挂载本模块，不改主框架）
- 临时素材与工具：[`wmx-temporary/`](../../../wmx-temporary/)（宠物图、压缩脚本、转盘单页原型）

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
- 正式资源目录：`assets/modules/dress/`（入选包体的压缩图放这里）
- 开发参考：`wmx-temporary/assets/pet/`（体积大，勿直接打进 8MB 包）

## 协作约定

- 只改本模块目录、`css/modules/dress.css`、`dress-preview.html`（若需）
- 勿改 `js/core/`、`index.html` 中其他模块脚本块
- PR 描述前缀：`[dress]`
