# 图片压缩工具

来自仓库 `wmx` 分支：`wmx-temporary/tools/compress_images.py`

## 安装依赖

```bash
pip install -r source/tools/requirements.txt
```

## 用法

对**单个目录**（仅处理该目录下的图片文件，不含子目录）：

```bash
source/tools/.venv/Scripts/python.exe source/tools/compress_images.py source/food1 --output-dir source/compressed/_tmp/food1 --targets-kb 5 10 20 --overwrite
# food2、food3 同理后执行：
powershell -File source/tools/organize_compressed.ps1
```

整理后结果在 `source/compressed/5kb|10kb|20kb/food1|food2|food3/`。

对单张图片：

```bash
python source/tools/compress_images.py source/food1/炸酱面.png --targets-kb 5 10 20
```

## 参数说明

| 参数 | 说明 |
|------|------|
| `input` | 输入图片或目录 |
| `--targets-kb` | 目标体积档位（KB），默认 `5 10 20` |
| `--output-dir` | 输出目录，默认在输入旁生成 `compressed-output` |
| `--format` | 输出格式，目前为 `webp` |
| `--min-width` | 搜索时允许的最小宽度，默认 `96` |
| `--overwrite` | 覆盖已有输出 |

输出文件命名：`原文件名-<目标KB>kb.webp`（如 `炸酱面-10kb.webp`）。

## 注意

- 需 Python 3.10+（使用了 `X | Y` 类型注解）
- 压缩结果请人工确认画质后，再复制到 `assets/modules/` 等正式资源目录
- 遵守 `Project Specification.md` 包体与离线规范
