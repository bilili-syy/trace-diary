#!/bin/bash

# 素履 - 发布脚本
# 用法: ./release.sh v1.0.0 "发布说明"

VERSION=$1
MESSAGE=${2:-"Release $VERSION"}

if [ -z "$VERSION" ]; then
  echo "用法: ./release.sh <版本号> [提交信息]"
  echo "示例: ./release.sh v1.0.0 \"首次发布\""
  exit 1
fi

echo "🚀 开始发布 $VERSION"

# 检查是否有未提交的更改
if [ -n "$(git status --porcelain)" ]; then
  echo "📦 提交更改..."
  git add .
  git commit -m "$MESSAGE"
fi

# 推送代码
echo "⬆️  推送代码到远程..."
git push origin master

# 删除已存在的 tag（如果有）
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo "🗑️  删除旧 tag..."
  git tag -d "$VERSION"
  git push origin --delete "$VERSION" 2>/dev/null
fi

# 创建新 tag
echo "🏷️  创建 tag $VERSION..."
git tag "$VERSION"
git push origin "$VERSION"

echo "✅ 发布完成: $VERSION"
