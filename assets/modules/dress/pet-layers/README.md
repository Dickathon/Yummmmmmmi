# pet-layers 目录结构

成品按**身体组件**分子文件夹存放；临时留档与标准底图保持独立。

```
pet-layers/
├── 标准底图/          # body/head/legs/tail_1254.png 校验用
├── 躯干/              # {食品名}-躯干.png
├── 头部/              # {食品名}-头部.png
├── 四肢/              # {食品名}-四肢.png
├── 尾巴/              # {食品名}-尾巴.png
├── 毯子/              # {食品名}-毯子.png（甜品独立图层）
├── _tmp_body_builtin/ # 躯干生图中间件
├── _tmp_head_builtin/
├── _tmp_legs_builtin/
├── _tmp_tail_builtin/
└── _tmp_blanket_builtin/
```

**整理脚本**：`wmx-temporary/tools/organize_pictures.mjs` 仍保留旧目录逻辑；若要批量整理 `pet-layers/`，请先把脚本里的 `PICTURES_DIR` 改成本目录再运行。

命名规范见 [`pet-base/标准底图/组件合并规范.md`](../pet-base/标准底图/组件合并规范.md)。
