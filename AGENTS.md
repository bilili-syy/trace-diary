# 素履 (Trace) - AI 开发指南

## 项目概述
素履 - 记录人生轨迹，素雅且纯粹。一个以绝对隐私为核心的 React Native 日记应用，使用 Expo + TypeScript 开发，所有数据存储在本地。

## 技术栈
- **框架**: React Native + Expo SDK 54
- **语言**: TypeScript (strict mode)
- **导航**: React Navigation v7 (Bottom Tabs + Native Stack)
- **状态管理**: useContext + useReducer
- **数据持久化**: react-native-mmkv (加密存储)
- **认证**: expo-local-authentication (生物识别) + PIN 码 (SHA256 哈希)
- **图片**: expo-image-picker + expo-image-manipulator (压缩至1080px, 质量0.7)
- **图片存储**: expo-file-system/legacy (文件存储)
- **导出压缩**: jszip (ZIP 格式导出/导入)
- **通知**: expo-notifications (日记提醒)
- **导出图片**: react-native-view-shot + expo-media-library
- **日期**: date-fns
- **图标**: @expo/vector-icons (Feather)

## 目录结构
```
src/
├── api/           # MMKV 存储层封装
│   └── storage.ts # 所有数据读写操作
├── components/    # 可复用 UI 组件
│   ├── DiaryCard.tsx      # 日记卡片
│   ├── Calendar.tsx       # 月历组件
│   ├── PinInput.tsx       # PIN 输入键盘
│   ├── MoodPicker.tsx     # 心情选择器
│   ├── WeatherPicker.tsx  # 天气选择器
│   ├── TemplateModal.tsx  # 模板选择弹窗
│   ├── SettingsItem.tsx   # 设置项组件
│   └── MarkdownPreview.tsx # Markdown 预览组件
├── constants/     # 全局常量
│   ├── Colors.ts  # 颜色定义
│   ├── Layout.ts  # 布局尺寸
│   └── Styles.ts  # 全局样式 + 心情/天气/模板配置
├── context/       # 全局状态
│   ├── DiaryProvider.tsx  # 日记状态 (useReducer)
│   ├── AuthProvider.tsx   # 认证状态
│   └── ThemeProvider.tsx  # 主题状态 (动态配色)
├── hooks/         # 自定义 Hooks
│   └── useDebounce.ts     # 防抖 Hook
├── navigation/    # 导航配置
│   ├── AppNavigator.tsx   # 主导航 (悬浮 Tab + Stack)
│   └── RootNavigator.tsx  # 根导航 (Auth 切换)
├── screens/       # 页面组件
│   ├── AuthScreen.tsx     # 解锁页
│   ├── HomeScreen.tsx     # 首页 (日记列表)
│   ├── CalendarScreen.tsx # 日历页
│   ├── EditorScreen.tsx   # 编辑器 (模态)
│   ├── DiaryDetailScreen.tsx # 日记详情
│   └── SettingsScreen.tsx # 设置页
├── types/         # TypeScript 类型
│   └── index.ts   # DiaryEntry, AppSettings, 导航类型等
└── utils/         # 工具函数
    ├── dateUtils.ts      # 日期格式化、字数统计
    ├── cryptoUtils.ts    # PIN 哈希、验证
    └── imageStorage.ts   # 图片文件存储/读取/删除
```

## 核心数据结构

### DiaryEntry (日记条目)
```typescript
interface DiaryEntry {
  id: string;           // 格式: 'YYYY-MM-DD'
  date: number;         // 时间戳
  content: string;      // Markdown 格式的日记内容
  mood?: string;        // Emoji: '😊', '😢', '😡', '😌', '😰', '🥰', '😴', '🤔'
  weather?: string;     // 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'stormy'
  templateUsed?: string; // 'free' | 'daily-review' | 'gratitude' | 'mood-tracker'
  wordCount: number;
  images?: string[];    // 图片文件名数组 (存储在 documentDirectory/diary-images/)
  tags?: string[];      // 标签数组
}
```

### ExportData (导出数据)
```typescript
interface ExportData {
  version: string;
  exportDate: number;
  entries: DiaryEntry[];
  images?: ImageExportData[];  // 图片 Base64 数据 (导出时打包)
}
```

## 功能列表

### 编辑器功能
- **撤销/重做**: 编辑历史记录 (最多50步)
- **Markdown 预览**: 点击眼睛图标切换编辑/预览模式
- **图片管理**: 最多9张图片，支持拖拽排序
- **标签系统**: 自定义标签
- **写作提示**: 10个随机写作灵感提示
- **模板系统**: 自由写作、每日回顾、感恩日记、心情追踪
- **自动保存**: 防抖1秒自动保存
- **写作模式**: 隐藏干扰项，专注写作

### 设置页功能
- **写作统计**: 连续天数、最长连续、总天数、总字数
- **日记提醒**: 每日定时通知提醒写日记
- **主题切换**: 5种预设主题配色
- **应用锁**: PIN 码 + 生物识别
- **数据导入导出**: ZIP 格式 (data.json + images 文件夹)

### 详情页功能
- **Markdown 渲染**: 支持标题、列表、引用、粗体、斜体等
- **导出为图片**: 保存日记为图片并可分享
- **图片查看器**: 全屏查看、左右滑动

## 图片存储

图片存储在 `documentDirectory/diary-images/` 目录下：
- 文件名格式: `{diaryId}_{index}_{timestamp}.jpg`
- 压缩参数: 1080px 宽度, 0.7 质量
- 导出时打包为 ZIP 文件 (images 文件夹)
- 导入时从 ZIP 解压还原

```typescript
// 保存图片
const fileName = await saveImage(uri, diaryId, index);

// 获取图片 URI
const imageUri = getImageUri(fileName);

// 删除图片
await deleteImage(fileName);

// 读取图片 (用于导出)
const base64 = await readImageAsBase64(fileName);

// 写入图片 (用于导入)
await writeImageFromBase64(fileName, base64);
```

## 导出/导入格式

导出为 ZIP 文件，结构如下：
```
trace-backup-YYYY-MM-DD.zip
├── data.json          # 日记数据
└── images/            # 图片文件夹
    ├── 2024-01-01_0_xxx.jpg
    └── 2024-01-02_0_xxx.jpg
```

## 常用命令

```bash
# 开发 (需要 Development Build，不支持 Expo Go)
npx expo run:android
npx expo run:ios

# 构建 APK/IPA
eas build --platform android --profile preview
eas build --platform ios --profile preview

# 类型检查
npx tsc --noEmit
```

## 开发规范

### 样式
- 使用 `StyleSheet.create`
- 颜色从动态主题 `useTheme().colors` 获取
- 间距从 `Layout.spacing` 引用
- 卡片圆角: `Layout.borderRadius.lg` (16)

### 数据操作
- 所有 MMKV 操作通过 `src/api/storage.ts`
- 图片操作通过 `src/utils/imageStorage.ts`
- 状态更新通过 Context dispatch
- 自动保存使用 `useDebounce` (1000ms)

### 组件
- 函数组件 + Hooks
- Props 接口定义在组件文件内
- 导出方式: `export function ComponentName`

### 导航
- Stack 页面: Editor (modal), DiaryDetail
- Tab 页面: Home, Calendar, Settings
- 导航类型: `RootStackParamList`, `MainTabParamList`
- 底部导航栏: 自定义 TabBar，4 个 tab 项 (首页、日历、新建、设置)，新建按钮为小圆形 (40x40) 主题色背景，与其他图标对齐

## 主题系统

应用支持 5 种预设主题配色，用户可在设置页切换：

| 主题ID | 名称 | 主色调 |
|--------|------|--------|
| garden | 花园绿 | #5B8C5A |
| ocean | 海洋蓝 | #4A90A4 |
| lavender | 薰衣草 | #8B7CB6 |
| sunset | 日落橙 | #D4764E |
| rose | 玫瑰粉 | #C77B8B |

### 使用主题
```typescript
import { useTheme } from '../context/ThemeProvider';

function MyComponent() {
  const { colors, theme, setTheme, availableThemes } = useTheme();
  
  return (
    <View style={{ backgroundColor: colors.background }}>
      <Text style={{ color: colors.primary }}>{theme.name}</Text>
    </View>
  );
}
```

## 注意事项

1. **MMKV 不支持 Expo Go** - 必须使用 Development Build 或 EAS Build
2. **图片存储为文件** - 不再使用 Base64，每篇日记最多9张
3. **PIN 码使用 SHA256 + Salt 哈希** - 存储在 MMKV，无法恢复
4. **日记 ID 是日期字符串** - 一天只能有一篇日记
5. **组件样式应使用动态主题** - 使用 `useTheme()` 获取 `colors`，避免直接引用静态 Colors
6. **导出为 ZIP** - 导出时打包为 ZIP 文件，包含 data.json 和 images 文件夹

## 新增功能摘要

- **图片文件存储**: 替代 Base64，提升性能
- **图片排序**: 编辑器中左右移动图片
- **图片压缩设置**: 用户可选择是否压缩图片 (设置页)
- **撤销/重做**: 编辑历史支持
- **Markdown 预览**: 编辑/预览模式切换
- **标签系统**: 自定义标签
- **写作提示**: 随机灵感提示
- **日记提醒**: 每日定时通知
- **连续写作统计**: 当前连续、最长连续、总天数、总字数
- **导出为图片**: 日记详情页导出为图片 (包含日记图片和品牌水印)
- **搜索增强**: 支持按内容、标签搜索，按心情、天气、标签筛选
- **快捷操作**: 长按日记卡片显示编辑/删除菜单
- **心情统计图表**: 设置页显示 7 天心情趋势和统计
- **深色模式**: 支持浅色/深色/跟随系统三种模式
- **草稿自动恢复**: 未保存的内容在 24 小时内可恢复
- **对话式模板引导**: 选择模板后逐个问题引导用户填写，输出格式化日记内容
- **首页卡片纯文本预览**: 自动去除 Markdown 标记显示纯文本
- **关于页面**: 包含开发者联系信息 (QQ/哔哩哔哩)
- **新手引导**: 三步引导首次设置 (隐私/应用锁/主题提醒)

## 功能实现核对（代码扫描）

### 已实现（与文档一致）
- **编辑器**: 撤销/重做、Markdown 预览、模板+对话引导、写作提示、标签、图片管理（最多9张/左右排序）、自动保存（1s 防抖）、草稿恢复（24h）
- **首页**: 搜索（内容/标签）、筛选（心情/天气/标签）、长按快捷操作、卡片纯文本预览
- **设置**: 写作统计、7天心情趋势、提醒（开关+时间）、主题（5色）+显示模式（浅/深/系统）、应用锁（PIN+生物识别）、导入/导出 ZIP、图片压缩开关、关于页
- **详情**: Markdown 渲染、导出为图片、图片查看（全屏左右滑动）
- **存储**: MMKV 加密、本地图片文件存储、导出时打包 images/

### 文档未覆盖但已实现
- **首页「那年今日」回顾卡片**
- **详情页 Markdown/原文切换**
- **图片查看支持捏合缩放**
- **导入支持合并/覆盖两种模式，并展示图片数量**

### 未实现/待完善（文档中提及但代码未发现）
- **暂无明确缺失项**

## 模板系统

模板采用对话式引导设计，每个问题包含：
- `question`: 问题文本
- `placeholder`: 输入提示
- `format`: 格式化函数，将用户回答转换为 Markdown 格式

示例 (情绪追踪模板):
```typescript
{
  question: '此刻你的心情如何？（1-10分）',
  placeholder: '输入1-10的数字',
  format: (answer: string) => `**心情指数**：${answer}分`,
}
```

用户填写 "8" 后，输出：`**心情指数**：8分`
