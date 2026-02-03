# 素履 - GitHub 仓库设置脚本
# 运行方式: 右键 -> 使用 PowerShell 运行

chcp 65001 | Out-Null
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

try {

# 配置
$REPO_NAME = "trace-diary"
$EXPO_TOKEN = "t2lgFoAiR0O6HB0p0UkmoGv42EnLATEi9ZB0gn4x"

Write-Host "=== 素履 GitHub 设置脚本 ===" -ForegroundColor Cyan

# 检查 gh CLI
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "未安装 GitHub CLI，正在安装..." -ForegroundColor Yellow
    winget install GitHub.cli
    Write-Host "请重新打开终端后再次运行此脚本" -ForegroundColor Yellow
    Read-Host "按回车退出"
    exit
}

# 检查登录状态
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "请先登录 GitHub..." -ForegroundColor Yellow
    gh auth login
}

# 获取用户名
$USERNAME = gh api user --jq '.login'
Write-Host "当前用户: $USERNAME" -ForegroundColor Green

# 创建仓库
Write-Host "创建仓库 $REPO_NAME..." -ForegroundColor Cyan
$repoExists = gh repo view "$USERNAME/$REPO_NAME" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "仓库已存在" -ForegroundColor Yellow
} else {
    gh repo create $REPO_NAME --private --description "素履 - 记录人生轨迹，素雅且纯粹"
    Write-Host "仓库创建成功" -ForegroundColor Green
}

# 添加远程仓库
git remote remove origin 2>$null
git remote add origin "https://github.com/$USERNAME/$REPO_NAME.git"
Write-Host "远程仓库已配置" -ForegroundColor Green

# 设置 Secret
Write-Host "设置 EXPO_TOKEN Secret..." -ForegroundColor Cyan
echo $EXPO_TOKEN | gh secret set EXPO_TOKEN --repo="$USERNAME/$REPO_NAME"
Write-Host "Secret 设置成功" -ForegroundColor Green

# 提交并推送
Write-Host "提交代码..." -ForegroundColor Cyan
git add -A
git commit -m "Initial commit for trace-diary" 2>$null
git branch -M master
git push -u origin master --force

Write-Host ""
Write-Host "=== 设置完成 ===" -ForegroundColor Green
Write-Host "仓库地址: https://github.com/$USERNAME/$REPO_NAME" -ForegroundColor Cyan
Write-Host "Actions: https://github.com/$USERNAME/$REPO_NAME/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "GitHub Actions 已自动触发构建，请访问上方 Actions 链接查看进度" -ForegroundColor Yellow
Write-Host ""
Read-Host "按回车退出"

} catch {
    Write-Host ""
    Write-Host "发生错误: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "按回车退出"
}
