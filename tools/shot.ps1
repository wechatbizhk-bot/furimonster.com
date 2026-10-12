param(
  [Parameter(Mandatory=$true)][string]$Page,
  [Parameter(Mandatory=$true)][string]$Out,
  [int]$W = 1280,
  [int]$H = 900,
  [int]$Wait = 3000
)
# Headless-Chrome screenshot helper for the FURI MONSTER site.
# NOTE: Chrome's IPC uses named pipes, which the confined sandbox blocks, so
# this must run with wider access. See claw-machine/tools/shot.ps1 for the
# same pattern used by the earlier project.
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { $chrome = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' }
$resolved = (Resolve-Path $Page).Path
$url = 'file:///' + $resolved.Replace('\', '/').Replace(' ', '%20')
$outPath = Join-Path (Get-Location) $Out
$prof = Join-Path (Get-Location) 'furimonster.com\_art\chrome-profile'
& $chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars `
  --user-data-dir="$prof" --virtual-time-budget=$Wait --force-device-scale-factor=1 `
  --screenshot="$outPath" --window-size=$W,$H $url 2>&1 | Out-Null
if (Test-Path $outPath) { "ok $outPath ($((Get-Item $outPath).Length) bytes)" } else { "FAILED: $outPath" }
