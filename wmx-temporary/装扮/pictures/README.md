# pictures 目录结构

成品按**身体组件**分子文件夹存放；临时留档与标准底图保持独立。

```
pictures/
├── 标准底图/          # body/head/legs/tail_1254.png 校验用
├── 躯干/              # {食品名}_躯干.png
├── 头部/              # {食品名}_头部.png
├── 四肢/              # {食品名}_四肢.png
├── 尾巴/              # {食品名}_尾巴.png
├── 毯子/              # {食品名}_毯子.png（甜品独立图层）
├── _tmp_body_builtin/ # 躯干生图中间件
├── _tmp_head_builtin/
├── _tmp_legs_builtin/
├── _tmp_tail_builtin/
└── _tmp_blanket_builtin/
```

命名规范见 [`latest-pictures/标准底图/组件合并规范.md`](../latest-pictures/标准底图/组件合并规范.md)。
