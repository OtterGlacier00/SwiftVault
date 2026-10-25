# Fase 2 AV1: (A) 6 launchpad over-limit [fonte Downloads], (B) tutti gli H.264 launchpad, (C) resto H.264 widgetkit
# Profilo: 720p, CRF 34, preset 10, g=240, audio copy, faststart
$ff = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
$stage = 'C:\Users\Stefy\AppData\Local\Temp\opencode\av1-720p'
$log = Join-Path $stage 'encode-f2.log'
$repo = (Get-Location).Path
$src = Join-Path $repo 'public\media'
$dlRoot = 'C:\Users\Stefy\Downloads\ios-dev-launchpad'
$limit = 104857600
New-Item -ItemType Directory -Force -Path $stage | Out-Null
$script:startT = Get-Date
function Encode-One([string]$srcFile, [string]$rel) {
  $out = Join-Path $stage $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
  if (Test-Path $out) { Write-Output "SKIP_ALREADY $rel"; return }
  "[F2] $rel $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8
  & $ff -hide_banner -y -i $srcFile -vf scale=1280:720 -c:v libsvtav1 -crf 34 -preset 10 -g 240 -c:a copy -movflags +faststart $out *> (Join-Path $stage 'ffmpeg-last.log')
  if ($LASTEXITCODE -eq 0 -and (Test-Path $out)) {
    $sz = [math]::Round((Get-Item $out).Length/1MB,1)
    $min = [math]::Round(((Get-Date)-$script:startT).TotalMinutes,1)
    "OK $rel -> $sz MiB (tot $min min) $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8
  } else { "FAIL $rel exit=$LASTEXITCODE $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8 }
}

# A: launchpad over-limit (sorgente Downloads, non sono in repo)
$bigDl = Get-ChildItem $dlRoot -Recurse -File -Filter '*.mp4' | Where-Object Length -ge $limit
foreach ($f in $bigDl) {
  $rel = 'ios-dev-launchpad\' + $f.FullName.Substring($dlRoot.Length + 1)
  Encode-One $f.FullName $rel
}
# B+C: tutto H.264 in public/media (launchpad e widgetkit)
$all = Get-ChildItem $src -Recurse -File -Filter '*.mp4'
"totali public/media mp4: $($all.Count)" | Out-File $log -Append -Encoding utf8
foreach ($f in $all) {
  $rel = $f.FullName -replace [regex]::Escape($src + '\'), ''
  # gia' AV1? salta (i convertiti di fase 1/2A)
  $probe = & $ff -hide_banner -i $f.FullName 2>&1 | Select-String 'Video: a(|v)1' | Select-Object -First 1
  if ($probe) { "SKIP_AV1 $rel" | Out-File $log -Append -Encoding utf8; continue }
  Encode-One $f.FullName $rel
}
"DONE-F2 $([math]::Round(((Get-Date)-$startT).TotalMinutes,1)) min" | Out-File $log -Append -Encoding utf8
