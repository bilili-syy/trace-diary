@echo off
chcp 65001 >nul
setlocal

set VERSION=%1
set MESSAGE=%~2

if "%VERSION%"=="" (
    echo 用法: release.bat ^<版本号^> [提交信息]
    echo 示例: release.bat v1.0.0 "首次发布"
    exit /b 1
)

if "%MESSAGE%"=="" set MESSAGE=Release %VERSION%

echo 开始发布 %VERSION%

:: 检查是否有未提交的更改
git status --porcelain > temp_status.txt
for %%A in (temp_status.txt) do if %%~zA gtr 0 (
    echo 提交更改...
    git add .
    git commit -m "%MESSAGE%"
)
del temp_status.txt 2>nul

:: 推送代码
echo 推送代码到远程...
git push origin master

:: 删除已存在的 tag
git rev-parse %VERSION% >nul 2>&1
if %errorlevel%==0 (
    echo 删除旧 tag...
    git tag -d %VERSION%
    git push origin --delete %VERSION% 2>nul
)

:: 创建新 tag
echo 创建 tag %VERSION%...
git tag %VERSION%
git push origin %VERSION%

echo 发布完成: %VERSION%
