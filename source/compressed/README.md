# 压缩结果目录

由 `source/tools/compress_images.py` 批量生成，按**体积档位**与**食物分类**两级目录存放。

## 结构

```
compressed/
  5kb/
    food1/    ← 主食，约 ≤5KB WebP
    food2/    ← 甜品
    food3/    ← 饮品
  10kb/
    food1/
    food2/
    food3/
  20kb/
    food1/
    food2/
    food3/
```

## 命名规则

`{食物名}-{目标体积}kb.webp`（文件名中的档位与所在文件夹一致）

示例：`10kb/food1/炸酱面-10kb.webp`

## 原始素材

未修改的 PNG 仍在：

- `source/food1/`
- `source/food2/`
- `source/food3/`

## 选用建议

| 档位 | 适用场景 |
|------|----------|
| `5kb/` | 极小缩略图、省包体优先 |
| `10kb/` | 列表图标、常规展示 |
| `20kb/` | 稍大图、详情预览 |

确认画质后，再复制到 `assets/modules/` 等正式目录。

## 重新生成

先压缩到临时目录，再按档位归类（或直接使用工具输出后运行整理脚本）：

```bash
source/tools/.venv/Scripts/python.exe source/tools/compress_images.py source/food1 --output-dir source/compressed/_tmp/food1 --targets-kb 5 10 20 --overwrite
```

批量整理见 `source/tools/organize_compressed.ps1`。
