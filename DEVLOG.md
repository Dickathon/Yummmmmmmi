# Yummi 开发日志（DEVLOG）

本文件记录**所有成员**（含 AI 辅助开发）对仓库的修改，便于联合开发时追溯、减少重复劳动与冲突。

> **硬性要求：** 每次向 `main` 合并或推送有意义改动前，必须在下文「日志条目」中**新增一条记录**。  
> 使用 Cursor / Copilot / 其他 AI 开发时，请将本文件要求写入对话，并让 AI **在同一 PR 或同一次提交中**更新本日志。

---

## 如何填写（人类开发者）

1. 在**最上方**「日志条目」区域追加新记录（最新在前）。
2. 填写**日期**、**修改人**（GitHub 用户名或姓名）、**模块/范围**、**修改摘要**、**涉及路径**。
3. 若改动影响他人（改了 `js/core/`、`index.html` 等），在摘要中**显式标注**并说明原因。
4. 与 PR 描述一致即可，但本文件为团队共享的**唯一汇总日志**。

## 如何让 AI 同步记录

在开始任务时，可向 AI 发送：

```text
开发 Yummi 项目时请遵守：
1. Project Specification.md、style.md、CONTRIBUTING.md
2. 只改我负责的模块目录（或先说明若要改全局文件）
3. 完成代码后，必须在 DEVLOG.md 最上方新增一条日志：日期、修改人（填：你的名字）、模块、摘要、涉及路径
4. 不要跳过 DEVLOG 更新
```

AI 完成实现后，应检查 `DEVLOG.md` 是否已更新；未更新则要求补写后再合并。

---

## 日志条目格式（复制模板）

```markdown
### YYYY-MM-DD — 修改人姓名 / @github

- **模块/范围：** order | dress | social | 全局 | 资源 | 文档
- **摘要：** 一两句话说明做了什么、为什么
- **路径：** `path/a`, `path/b`（关键文件即可）
- **备注：** 可选；联调说明、Breaking、待办
```

---

## 日志条目

（以下按时间倒序，**新的写在最上面**）

---

### 2026-05-30 — 项目维护 / AI 协助（点餐转盘对齐 wmx）

- **模块/范围：** order
- **摘要：** 点餐转盘几何与渲染对齐 `wmx-temporary/转盘`（`INITIAL_CONFIG` 全局偏移/缩放、四层含顶柱、侧壁色带、顶内拖+侧壁拖、惯性、地面阴影）；食物立牌仍用 `getSlotOrbitDeg`、275° 换菜与 viewBox 竖立展示，格心位置改由 `getDiscGeometry` 计算。
- **路径：** `js/modules/order/config.js`, `js/modules/order/view.js`, `js/modules/order/state.js`, `css/modules/order.css`
- **备注：** 顶柱猫图路径 `config.turntable.capAssetsBase`；中/顶/柱 `autoSpeed` 与 wmx 同为负值反向转。

---

### 2026-05-30 — 项目维护 / AI 协助（wmx 分支整合）

- **模块/范围：** wmx-temporary | 文档
- **摘要：** 合并 `origin/wmx`（`63f70cb` 及祖先）：宠物 `latest-pictures` 标准底图、头/腿/尾生成与校验工具、转盘原型侧壁与惯性试验；**未改动** `js/modules/order/view.js` / `state.js` 立牌公转、竖立展示与 `updatePlacardPositions` 逻辑；`dress` 仍为占位视图。
- **路径：** `wmx-temporary/装扮/`, `wmx-temporary/tools/`, `wmx-temporary/转盘/index.html`, `wmx-temporary/README.md`, `assets/modules/dress/placards/README.md`
- **备注：** `displayment-wmx/` 大图已迁至 `装扮/latest-pictures/标准底图/`；主应用点餐立牌仍用 `source/compressed/10kb/`。

---

### 2026-05-30 — 项目维护 / AI 协助（ljh + wmx 分支整合）

- **模块/范围：** social | dress | 资源 | 文档
- **摘要：** 合并 `origin/ljh`（街区网格布局、`food1/2/3` 素材、`social-map.js/css` 更新）与 `origin/wmx`（保留 main 立牌实现与相对路径文档）；冲突仅 `wmx-temporary/README.md`、`组件合并规范.md`，已保留 main 侧目录说明与仓库相对路径。
- **路径：** `css/social-map.css`, `js/social-map.js`, `food1/`, `food2/`, `food3/`, `wmx-temporary/`
- **备注：** dress 模块以 main 当前立牌竖立方案为准，未回退 wmx 占位逻辑。

---

### 2026-05-30 — 项目维护 / AI 协助（wmx 立牌素材 + 竖立展示）

- **模块/范围：** dress | wmx-temporary
- **摘要：** 从 `origin/wmx` 整合 `displayment-wmx` 宠物部件图作转盘立牌内容；立牌层与 `data-disc-placard-rotor` 绑定（底座在格内、牌身竖起可超出格线）；修正 `组件合并规范.md` 中的本机绝对路径。
- **路径：** `js/modules/dress/config.js`, `js/modules/dress/view.js`, `css/modules/dress.css`, `wmx-temporary/displayment-wmx/`, `assets/modules/dress/placards/README.md`
- **备注：** 未合并 wmx 分支上对 `dress/view.js` 的占位回退；正式包体需压缩立牌图后再改 `itemsBase`。

---

### 2026-05-30 — 项目维护 / AI 协助（Tab 栏修复）

- **模块/范围：** 全局
- **摘要：** 修复底部 Tab 点击无效：`Yummi.module.define()` 不再覆盖 `modules.<id>` 上的 `screen/state/view`；导航移至 `body` 下并调整点击层级。
- **路径：** `js/core/module.js`, `js/main.js`, `index.html`, `css/layout.css`, `css/nav.css`
- **备注：** 根因非绝对路径，为模块注册时命名空间被整对象替换。

---

### 2026-05-30 — 项目维护 / AI 协助（ljh 整合）

- **模块/范围：** social | 资源
- **摘要：** 整合 `origin/ljh`：美食街区 `social-map.html`、店铺图标 `source/shop/`（16 家）、`js/social-map.js`；主应用「社交」Tab 跳转至该页。
- **路径：** `social-map.html`, `js/social-map.js`, `css/social-map.css`, `source/shop/`, `js/main.js`, `js/modules/social/README.md`
- **备注：** 保留 main 已有框架、装扮转盘、食物资源与 `DEVLOG`。

---

### 2026-05-30 — 项目维护 / AI 协助（wmx 整合）

- **模块/范围：** dress | 全局文档 | 资源
- **摘要：** 整合 `origin/wmx`：装扮 Tab 三层椭圆转盘（`view/state/screen` + `dress.css`）、`dress-preview.html` 调试页、`wmx-temporary/` 宠物素材与转盘原型；保留 main 已有 `source/` 食物图与 `DEVLOG`。
- **路径：** `js/modules/dress/`, `css/modules/dress.css`, `css/modules/dress-preview.css`, `dress-preview.html`, `wmx-temporary/`, `CONTRIBUTING.md`
- **备注：** `wmx-temporary` 内大图仅作开发参考，正式打包请用 `source/compressed/` 或 `assets/modules/` 内已压缩资源。

---

### 2026-05-30 — 项目维护 / AI 协助

- **模块/范围：** 文档
- **摘要：** 新增 `DEVLOG.md` 开发日志；约定全员与 AI 在提交前登记修改人与变更说明。
- **路径：** `DEVLOG.md`, `CONTRIBUTING.md`
- **备注：** 请后续每位开发者将姓名或 GitHub ID 写入自己的条目。

---

### 2026-05-30 — 项目维护

- **模块/范围：** 资源
- **摘要：** 从 `ljh` 分支导入食物 PNG；部署 `wmx` 压缩工具；批量压缩并按 5kb/10kb/20kb 分档存放。
- **路径：** `source/food1/`, `source/food2/`, `source/food3/`, `source/compressed/`, `source/tools/`
- **备注：** 原始 PNG 约 6.4MB；压缩 WebP 约 2.7MB；`.venv` 不提交。

---

### 2026-05-30 — 项目维护

- **模块/范围：** 全局
- **摘要：** 建立三模块协作架构（`Yummi.module.define`）、各模块 `config/state/view/screen` 骨架与 `CONTRIBUTING.md`。
- **路径：** `js/core/`, `js/modules/`, `CONTRIBUTING.md`, `index.html`
- **备注：** 负责人认领后请在后续日志中标注 `[order]` / `[dress]` / `[social]`。

---

### 2026-05-30 — 项目维护

- **模块/范围：** 全局
- **摘要：** 按 `style.md` 更新移动端视觉（设计令牌、Hero、导航、组件样式）。
- **路径：** `css/`, `js/main.js`, `style.md`

---

### 2026-05-30 — 项目维护

- **模块/范围：** 全局
- **摘要：** 初始 H5 脚手架：三栏导航（点餐/装扮/社交）、食物数据、离线静态入口。
- **路径：** `index.html`, `css/`, `js/data/foods.js`, `Project Specification.md`

---

## 模块负责人登记（可选）

| 模块 | Tab id | 负责人 | 备注 |
|------|--------|--------|------|
| 点餐 | `order` | （待填写） | |
| 装扮 | `dress` | （待填写） | |
| 社交 | `social` | （待填写） | |
| 全局/框架 | — | （待填写） | `js/core/`, `js/main.js` |

认领后请更新上表，并在后续日志条目中使用统一「修改人」名称。
