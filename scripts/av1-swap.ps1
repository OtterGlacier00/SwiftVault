# Sostituzione video AV1 stage -> public/media + verifica limite GitHub
# Uso (dopo encode OK): powershell -File scripts\av1-swap.ps1
$stage = 'C:\Users\Stefy\AppData\Local\Temp\opencode\av1-720p'
$limit = 104857600
Get-ChildItem $stage -Recurse -File -Filter '*.mp4' | Where-Object Name -ne 'encode.log' | ForEach-Object {
  $rel = $_.FullName -replace [regex]::Escape($stage + '\'), ''
  $media = Join-Path (Join-Path (Get-Location) 'public\media') $rel
  if (-not (Test-Path $media)) { Write-Output "NOORIG $rel"; return }
  if ($_.Length -ge $limit) { Write-Output "OVER-LIMIT $rel ($([math]::Round($_.Length/1MB,1)) MiB) - lascio l'originale"; return }
  $before = [math]::Round((Get-Item $media).Length/1MB,1)
  Copy-Item $_.FullName $media -Force
  Write-Output "SWAP $rel $before -> $([math]::Round((Get-Item $media).Length/1MB,1)) MiB"
}
"--- residuo >100MiB ---"
$still = Get-ChildItem 'public\media' -Recurse -File -Filter '*.mp4' | Where-Object Length -gt $limit
if ($still.Count -eq 0) { "ZERO" } else { $still.FullName }
