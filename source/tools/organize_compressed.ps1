# 将 compress_images.py 的输出（按 food1/2/3 平铺）整理为 5kb|10kb|20kb/foodN/ 结构
param(
  [string]$Root = (Join-Path $PSScriptRoot "..\compressed")
)

$Root = (Resolve-Path $Root -ErrorAction SilentlyContinue) ?? (Resolve-Path (Join-Path $PSScriptRoot "..\compressed"))
$tiers = @("5kb", "10kb", "20kb")
$categories = @("food1", "food2", "food3")

foreach ($cat in $categories) {
  $srcDir = Join-Path $Root $cat
  if (-not (Test-Path $srcDir)) { continue }

  foreach ($tier in $tiers) {
    $dest = Join-Path $Root (Join-Path $tier $cat)
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Get-ChildItem $srcDir -Filter "*-$tier.webp" -File | ForEach-Object {
      $target = Join-Path $dest $_.Name
      if (Test-Path $target) { Remove-Item $target -Force }
      Move-Item -Force $_.FullName $target
    }
  }

  $remaining = Get-ChildItem $srcDir -File -ErrorAction SilentlyContinue
  if (-not $remaining) {
    Remove-Item $srcDir -Force -Recurse -ErrorAction SilentlyContinue
  }
}

Write-Host "Done. Layout: $Root/{5kb|10kb|20kb}/{food1|food2|food3}/"
