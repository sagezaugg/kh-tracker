# Renders the link-preview image and app icons into public/ with headless Edge or Chrome.
# Usage (from the repo root):  pwsh scripts/brand/render.ps1
$ErrorActionPreference = 'Stop'

$browser = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $browser) { throw 'Need Edge or Chrome installed.' }

$here = $PSScriptRoot
$public = (Resolve-Path (Join-Path $here '..\..\public')).Path
$og = ([Uri](Join-Path $here 'og.html')).AbsoluteUri
$icon = ([Uri](Join-Path $here 'icon.html')).AbsoluteUri
# A throwaway profile, so the render doesn't hand off to an already-running browser.
$userData = Join-Path ([IO.Path]::GetTempPath()) 'kh-tracker-brand-render'

# Headless windows have a minimum width, so icons render at 512 and smaller sizes are scaled down.
$jobs = @(
  @{ Url = $og; Out = 'og.png'; W = 1200; H = 630 },
  @{ Url = $icon; Out = 'icon-512.png'; W = 512; H = 512 },
  @{ Url = "$icon#maskable"; Out = 'icon-maskable-512.png'; W = 512; H = 512 }
)

foreach ($j in $jobs) {
  $out = Join-Path $public $j.Out
  Remove-Item $out -ErrorAction SilentlyContinue
  $browserArgs = @(
    '--headless=new', '--disable-gpu', "--user-data-dir=$userData", '--hide-scrollbars',
    '--force-device-scale-factor=1', '--default-background-color=00000000', '--virtual-time-budget=5000',
    "--window-size=$($j.W),$($j.H)", "--screenshot=$out", $j.Url
  )
  Start-Process -FilePath $browser -ArgumentList $browserArgs -Wait -WindowStyle Hidden
  if (-not (Test-Path $out)) { throw "Failed to render $($j.Out)" }
  Write-Host "wrote public/$($j.Out)"
}

Add-Type -AssemblyName System.Drawing
function Resize-Png([string]$from, [string]$to, [int]$size) {
  $src = [Drawing.Image]::FromFile((Join-Path $public $from))
  $dst = New-Object Drawing.Bitmap $size, $size
  $g = [Drawing.Graphics]::FromImage($dst)
  $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($src, 0, 0, $size, $size)
  $dst.Save((Join-Path $public $to), [Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $dst.Dispose(); $src.Dispose()
  Write-Host "wrote public/$to"
}
Resize-Png 'icon-512.png' 'icon-192.png' 192
Resize-Png 'icon-maskable-512.png' 'apple-touch-icon.png' 180
