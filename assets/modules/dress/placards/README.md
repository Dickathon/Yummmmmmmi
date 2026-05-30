# 装扮立牌正式资源

开发阶段立牌图源图位于 `wmx-temporary/装扮/latest-pictures/标准底图/`（点餐转盘立牌逻辑在 `js/modules/order/`，见 `order/config.js` 的 `itemsBase`）。

打包前请将下列源图压缩为本目录下的 WebP（建议 10kb 档），并改 `config.js` 的 `itemsBase` 指向此处：

- `head_1024_strawberry_shortcake.png` / `head_1024.png`
- `body_1024_strawberry_cake.png` / `body_1024.png`
- `legs_1024_strawberry_shortcake.png` / `legs_1024.png`
- `tail_1024.png`

```bash
python source/tools/compress_images.py wmx-temporary/装扮/latest-pictures/标准底图/head_1254.png ... --targets-kb 10 --output-dir assets/modules/dress/placards/10kb
```
