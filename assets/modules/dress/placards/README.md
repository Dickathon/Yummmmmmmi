# 装扮立牌正式资源

开发阶段立牌图引用 `wmx-temporary/displayment-wmx/`（见 `js/modules/dress/config.js`）。

打包前请将下列源图压缩为本目录下的 WebP（建议 10kb 档），并改 `config.js` 的 `itemsBase` 指向此处：

- `head_1024_strawberry_shortcake.png` / `head_1024.png`
- `body_1024_strawberry_cake.png` / `body_1024.png`
- `legs_1024_strawberry_shortcake.png` / `legs_1024.png`
- `tail_1024.png`

```bash
python source/tools/compress_images.py wmx-temporary/displayment-wmx/head_1024.png ... --targets-kb 10 --output-dir assets/modules/dress/placards/10kb
```
