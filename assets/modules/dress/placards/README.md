# 装扮立牌正式资源

开发阶段立牌图源图位于 `wmx-temporary/装扮/latest-pictures/标准底图/`（点餐转盘立牌逻辑在 `js/modules/order/`，见 `order/config.js` 的 `itemsBase`）。

10kb 立牌底图已自 `wmx-temporary/compressed/10kb/装扮/latest-pictures/标准底图/` 同步至本目录 `10kb/`。  
打包前若更新源图，请重新压缩并覆盖此处，并改 `order/config.js` 或 dress 侧 `itemsBase` 指向 `assets/modules/dress/placards/10kb/`。

历史说明（源 PNG 清单）：

- `head_1024_strawberry_shortcake.png` / `head_1024.png`
- `body_1024_strawberry_cake.png` / `body_1024.png`
- `legs_1024_strawberry_shortcake.png` / `legs_1024.png`
- `tail_1024.png`

```bash
python source/tools/compress_images.py wmx-temporary/装扮/latest-pictures/标准底图/head_1254.png ... --targets-kb 10 --output-dir assets/modules/dress/placards/10kb
```
