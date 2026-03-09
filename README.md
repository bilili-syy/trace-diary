<p align="center">
  <img src="assets/icon.png" width="100" height="100" alt="素履 Logo" />
</p>

<h1 align="center">素履 (Trace)</h1>

<p align="center">
  记录人生轨迹，素雅且纯粹
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License" /></a>
  <img src="https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue.svg" alt="Platform" />
  <img src="https://img.shields.io/badge/Expo%20SDK-54-black.svg" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/React%20Native-0.81-61dafb.svg" alt="React Native" />
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#%E5%AE%89%E8%A3%85">安装</a> ·
  <a href="#%E6%9E%84%E5%BB%BA">构建</a> ·
  <a href="#%E8%B4%A1%E7%8C%AE">贡献</a>
</p>

---

**素履** 是一款以绝对隐私为核心的移动端日记应用。所有数据仅存储在本地设备，零网络上传，零云端同步。

> 素履之往，独行愿也 —— 《周易》

## Features

- **Markdown 编辑** - 实时预览，撤销/重做（50 步历史）
- **模板引导** - 自由写作、每日复盘、感恩日记、情绪追踪，对话式逐步引导
- **心情 & 天气** - 每日记录，7 天趋势图表
- **图片管理** - 每篇最多 9 张，拖拽排序，可选压缩
- **标签系统** - 自定义标签 + 预设管理
- **日历视图** - 按日期浏览，"那年今日" 回顾
- **搜索 & 筛选** - 按内容/标签搜索，按心情/天气/标签筛选
- **应用锁** - PIN 码 (SHA256 + salt) + 生物识别 (Face ID / 指纹)
- **5 套主题** - 花园绿 / 海洋蓝 / 薰衣草 / 日落橙 / 玫瑰粉
- **深色模式** - 浅色 / 深色 / 跟随系统
- **数据导出** - ZIP 格式 (data.json + images/)，支持合并/覆盖导入
- **分享为图片** - 日记详情导出为带水印图片
- **写作统计** - 连续天数、最长记录、总字数
- **每日提醒** - 自定义时间通知
- **草稿恢复** - 24 小时内自动恢复未保存内容
- **新手引导** - 三步引导首次使用
- **完全离线** - 所有数据加密存储在本地，不联网

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | React Native (Expo SDK 54) |
| 语言 | TypeScript (strict) |
| 导航 | React Navigation v7 |
| 状态管理 | useContext + useReducer |
| 本地存储 | react-native-mmkv (加密) |
| 认证 | expo-local-authentication + expo-secure-store |
| 图片 | expo-image-picker + expo-image-manipulator |
| 压缩包 | jszip |
| 日期 | date-fns |
| 动画 | react-native-reanimated |
| 图标 | @expo/vector-icons (Feather) |

## 项目结构

```
src/
├── api/           # MMKV 存储层
├── components/    # 可复用 UI 组件
├── constants/     # 颜色、布局、全局样式
├── context/       # 全局状态 (Diary / Auth / Theme)
├── hooks/         # 自定义 Hooks
├── navigation/    # 导航配置
├── screens/       # 页面组件
├── types/         # TypeScript 类型定义
└── utils/         # 工具函数
```

## 安装

### 环境要求

- Node.js >= 18
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (Android) 或 Xcode (iOS)

### 开发

```bash
# 克隆仓库
git clone https://github.com/bilili-syy/trace-diary.git
cd trace-diary

# 安装依赖
npm install

# 启动开发服务器
npx expo start

# 在 Android 设备/模拟器上运行
npx expo run:android

# 在 iOS 设备/模拟器上运行
npx expo run:ios
```

> **注意**: 本项目使用 `react-native-mmkv`，不支持 Expo Go，需要 Development Build。

## 构建

项目使用 [EAS Build](https://docs.expo.dev/build/introduction/) 构建：

```bash
# 安装 EAS CLI
npm install -g eas-cli

# 构建 Android APK
eas build --platform android --profile preview

# 构建 iOS
eas build --platform ios --profile preview-ios

# 生产构建
eas build --platform android --profile production
```

也可以通过 GitHub Actions 自动构建 —— 创建 `v*` 格式的 tag 即可触发。

## 数据安全

- 使用 MMKV 加密存储，密钥通过 `CryptoJS.lib.WordArray.random(32)` 生成并保存在 SecureStore
- PIN 码使用 SHA256 + salt 哈希，不可逆
- 所有图片存储在应用沙盒目录 (`documentDirectory/diary-images/`)
- 导出为 ZIP 文件，用户完全掌控数据
- 零网络权限，不发送任何数据

## 演示视频

[![Bilibili](https://img.shields.io/badge/Bilibili-应用介绍-FB7299?logo=bilibili&logoColor=white)](https://www.bilibili.com/video/BV1sgFbzuEss/)

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/my-feature`)
3. 提交更改 (`git commit -m 'Add my feature'`)
4. 推送到分支 (`git push origin feature/my-feature`)
5. 创建 Pull Request

## 捐赠

如果觉得这个项目对你有帮助，欢迎请作者喝杯咖啡 :)

<p align="center">
  <img src="donate/wechat-pay.png" width="250" alt="微信赞赏" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="donate/alipay-pay.jpg" width="250" alt="支付宝赞赏" />
</p>

## 许可证

[MIT License](./LICENSE)
