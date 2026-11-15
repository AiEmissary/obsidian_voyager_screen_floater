$ErrorActionPreference = 'Stop'
$ToolDir = 'C:\Users\rajka\AppData\Roaming\graviton\custom-tools\obsidian_voyager'
$HostDir = Join-Path $ToolDir 'desktop_host'
$PidFile = Join-Path $ToolDir 'obsidian_voyager.pid.json'
$ModelPath = 'C:\Users\rajka\Desktop\Meshy_AI_Obsidian_Voyager_0421201108_texture.glb'
$ElectronCandidates = @(
  (Join-Path $ToolDir 'node_modules\electron\dist\electron.exe'),
  'C:\Users\rajka\AppData\Roaming\graviton\custom-tools\Studio3\node_modules\electron\dist\electron.exe',
  'C:\Users\rajka\AppData\Roaming\npm\node_modules\electron\dist\electron.exe',
  'C:\Program Files\nodejs\node_modules\electron\dist\electron.exe'
)

function Show-Message($text, $title='Obsidian Voyager') {
  Add-Type -AssemblyName PresentationFramework -ErrorAction SilentlyContinue
  [System.Windows.MessageBox]::Show($text, $title) | Out-Null
}

if (-not (Test-Path $ModelPath)) {
  Show-Message "Could not find the Voyager GLB:`n$ModelPath"
  exit 1
}

if (Test-Path $PidFile) {
  try {
    $saved = Get-Content $PidFile -Raw | ConvertFrom-Json
    if ($saved.pid) {
      $existing = Get-Process -Id ([int]$saved.pid) -ErrorAction SilentlyContinue
      if ($existing) {
        Show-Message "Obsidian Voyager is already flying.`n`nRight-click its tray/notification icon and choose Close Voyager when finished."
        exit 0
      }
    }
  } catch {}
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

$ElectronExe = $ElectronCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $ElectronExe) {
  Show-Message "Could not find electron.exe.`n`nExpected it at:`nC:\Users\rajka\AppData\Roaming\graviton\custom-tools\Studio3\node_modules\electron\dist\electron.exe"
  exit 1
}

$env:OBSIDIAN_VOYAGER_MODEL = $ModelPath
$env:OBSIDIAN_VOYAGER_SPEED = '1'
$env:OBSIDIAN_VOYAGER_SCALE = '2'
$env:OBSIDIAN_VOYAGER_TOOL_DIR = $ToolDir

$p = Start-Process -FilePath $ElectronExe -ArgumentList @($HostDir) -WorkingDirectory $HostDir -WindowStyle Hidden -PassThru
@{
  pid = $p.Id
  started = (Get-Date).ToUniversalTime().ToString('o')
  modelPath = $ModelPath
  electronExe = $ElectronExe
  speed = 1
  scale = 2
  launchedBy = 'desktop shortcut'
} | ConvertTo-Json | Set-Content -Path $PidFile -Encoding UTF8
