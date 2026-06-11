# GitHub + Copilot Setup Script
# Run once: Right-click -> Run with PowerShell

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\pc\Desktop\student-dropout-prediction"
$repoUrl = "https://github.com/Abdikafi252/student-dropout-prediction"

Write-Host "=== Student Dropout Prediction - GitHub Setup ===" -ForegroundColor Cyan

# 1. Open GitHub to create repo (if not exists)
Write-Host "`n[1/4] Opening GitHub to create repository..." -ForegroundColor Yellow
Start-Process "https://github.com/new?name=student-dropout-prediction&description=Student+dropout+prediction+system"

Write-Host "   -> Create repo WITHOUT README/.gitignore (project already exists locally)"
Write-Host "   -> Press Enter after you created the repo on GitHub..."
Read-Host

# 2. Open Copilot Student settings
Write-Host "`n[2/4] Opening GitHub Copilot Student settings..." -ForegroundColor Yellow
Start-Process "https://github.com/settings/copilot/features"
Start-Process "https://github.com/settings/education/benefits"

# 3. Open VS Code and sign in
Write-Host "`n[3/4] Opening VS Code..." -ForegroundColor Yellow
$code = "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd"
if (Test-Path $code) {
    & $code $repoPath
    Write-Host "   In VS Code: Accounts (bottom-left) -> Sign in with GitHub"
    Write-Host "   Then: Ctrl+Shift+P -> 'GitHub Copilot: Sign In'"
}

# 4. Push to GitHub
Write-Host "`n[4/4] Pushing code to GitHub..." -ForegroundColor Yellow
Set-Location $repoPath

if (-not (git remote get-url origin 2>$null)) {
    git remote add origin "$repoUrl.git"
}

git branch -M main 2>$null
git push -u origin main
if ($LASTEXITCODE -ne 0) {
    git push -u origin master
}

Write-Host "`nDone! Copilot completions work now (unlimited)." -ForegroundColor Green
Write-Host "Chat credits reset on July 1, 2026." -ForegroundColor Green
Read-Host "Press Enter to close"
