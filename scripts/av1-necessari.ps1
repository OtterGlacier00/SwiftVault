# AV1 solo-necessari: encodare tutti gli mp4 >100MiB dei download (launchpad + swiftui-fundamentals),
# poi swap in public/media con supporto NEW (repo path ancora assente).
# Skip se lo stage esiste gia' e ha dimensione plausibile (>10MB, valido).
# Uso: powershell -File scripts\av1-necessari.ps1
$ff = "$env:LOCALAPPDATA\Microsoft\WinGet\Links\ffmpeg.exe"
$stage = 'C:\Users\Stefy\AppData\Local\Temp\opencode\av1-720p'
$log = Join-Path $stage 'encode-nec.log'
$repo = (Get-Location).Path
$limit = 104857600
New-Item -ItemType Directory -Force -Path $stage | Out-Null
$script:startT = Get-Date
function Encode-One([string]$srcFile, [string]$rel) {
  $out = Join-Path $stage $rel
  New-Item -ItemType Directory -Force -Path (Split-Path $out) | Out-Null
  if ((Test-Path $out) -and (Get-Item $out).Length -gt 10MB) { "SKIP_OK $rel" | Out-File $log -Append -Encoding utf8; return }
  "[NEC] $rel $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8
  & $ff -hide_banner -y -i $srcFile -vf scale=1280:720 -c:v libsvtav1 -crf 34 -preset 10 -g 240 -c:a copy -movflags +faststart $out *> (Join-Path $stage 'ffmpeg-last.log')
  if ($LASTEXITCODE -eq 0 -and ((Test-Path $out) -and (Get-Item $out).Length -gt 10MB)) {
    $sz = [math]::Round((Get-Item $out).Length/1MB,1)
    $min = [math]::Round(((Get-Date)-$script:startT).TotalMinutes,1)
    "OK $rel -> $sz MiB (tot $min min) $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8
  } else { "FAIL $rel exit=$LASTEXITCODE $(Get-Date -Format 'HH:mm:ss')" | Out-File $log -Append -Encoding utf8 }
}

foreach ($dlRoot in @('C:\Users\Stefy\Downloads\ios-dev-launchpad', 'C:\Users\Stefy\Downloads\swiftui-fundamentals')) {
  $course = Split-Path $dlRoot -Leaf
  $big = Get-ChildItem $dlRoot -Recurse -File -Filter '*.mp4' | Where-Object Length -ge $limit
  foreach ($f in $big) {
    $rel = $course + '\' + $f.FullName.Substring($dlRoot.Length + 1)
    Encode-One $f.FullName $rel
  }
}

# swap (NEW-aware)
"--- swap ---" | Out-File $log -Append -Encoding utf8
Get-ChildItem $stage -Recurse -File -Filter '*.mp4' | Where-Object Name -ne 'encode-nec.log' | ForEach-Object {
  $rel = $_.FullName -replace [regex]::Escape($stage + '\'), ''
  $media = Join-Path (Join-Path $repo 'public\media') $rel
  if ($_.Length -ge $limit) { Write-Output "OVER-LIMIT $rel - lascio"; return }
  $exists = Test-Path $media
  $before = if ($exists) { [math]::Round((Get-Item $media).Length/1MB,1) } else { 0 }
  Copy-Item $_.FullName $media -Force
  Write-Output ("{0} {1} {2} -> {3} MiB" -f ($(if ($exists) {'SWAP'} else {'NEW'})), $rel, $before, [math]::Round((Get-Item $media).Length/1MB,1))
}
"--- residuo >100MiB in public/media ---"
$still = Get-ChildItem (Join-Path $repo 'public\media') -Recurse -File -Filter '*.mp4' | Where-Object Length -ge $limit
if ($still.Count -eq 0) { "ZERO" } else { $still.FullName }
"DONE-NEC $([math]::Round(((Get-Date)-$script:startT).TotalMinutes,1)) min" | Out-File $log -Append -Encoding utf8
