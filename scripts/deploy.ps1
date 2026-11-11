# Usage: .\scripts\deploy.ps1 -ProjectId YOUR_FIREBASE_PROJECT_ID [-HostingOnly]
param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [switch]$HostingOnly
)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) { throw 'Install firebase-tools and run firebase login first.' }
npm ci; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' }
npm run check; if ($LASTEXITCODE -ne 0) { throw 'Frontend checks failed' }
if (-not $HostingOnly) {
  npm --prefix functions install; if ($LASTEXITCODE -ne 0) { throw 'Functions dependencies failed' }
  firebase deploy --only functions,firestore,storage --project $ProjectId
  if ($LASTEXITCODE -ne 0) { throw 'Backend deploy failed' }
}
firebase deploy --only hosting --project $ProjectId
if ($LASTEXITCODE -ne 0) { throw 'Hosting deploy failed' }
