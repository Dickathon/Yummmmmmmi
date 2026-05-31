# 装扮模块（dress）

**Tab id：** `dress`

## 功能

- 主应用 Tab：分层猫装扮展示，支持头部、躯干、四肢、尾巴、毯子、饮品切换
- 左上角「装扮」面板：按分类展示衣柜，点餐已选与手动解锁装扮优先排序
- 底部「一键导出宠物形象」：用 Canvas 合成当前背景、猫屋、装扮、饮品、名字与食物梗自嘲，生成 PNG 预览并支持保存
- **转盘已迁至 order 模块**；转盘调试见 [`dress-preview.html`](../../../dress-preview.html)（加载 order）

## 目录职责

| 文件 | 职责 |
|------|------|
| `config.js` | meta 与装扮/饮品资源路径 |
| `state.js` | 衣柜目录、当前选择、手动解锁、图层计算与 localStorage |
| `exporter.js` | 宠物形象 PNG 海报合成、食物候选随机与自嘲文案映射 |
| `view.js` | 分层猫视图与衣柜面板渲染 |
| `screen.js` | 生命周期 |
| `index.js` | 注册入口与衣柜面板初始化 |

运行资源位于 `assets/modules/dress/pet-layers/` 与 `assets/modules/dress/pet-base/`，饮品图使用 `source/compressed/10kb/food3/`，不再依赖 `wmx-temporary/`。

## 状态规则

- `躯干` 与 `四肢` 基础层始终显示，选择装扮后额外叠加对应装扮图。
- `头部`、`尾巴`、`毯子` 选择「不使用装扮」时显示基础图，选择装扮后替换为对应装扮图。
- 选择会保存到 `localStorage` 的 `yummi_dress_selection`；点餐变化通过 `yummi:food-selection-change` 事件同步刷新衣柜排序。
- 导出食物候选来自当前实际生效的头部、躯干、四肢、尾巴、毯子与饮品；每次生成随机抽一个候选对应自嘲。无候选时使用原生态兜底文案。
- 导出时宠物图层为必需资源；背景、猫屋图片和饮品图片加载失败会降级为纸纹底、占位猫屋或省略饮品。

## 协作约定

- 只改本模块、`css/modules/dress.css` 与 `assets/modules/dress/`
- PR 前缀：`[dress]`
