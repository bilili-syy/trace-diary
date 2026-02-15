import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// 布局常量
export const Layout = {
  // 屏幕尺寸
  window: {
    width,
    height,
  },

  // 是否为小屏设备
  isSmallDevice: width < 375,

  // 边距 - 使用 8px 基准的倍数系统
  spacing: {
    xs: 8,    // 1x
    sm: 12,   // 1.5x
    md: 16,   // 2x
    lg: 24,   // 3x
    xl: 32,   // 4x
    xxl: 48,  // 6x
  },

  // 圆角
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },

  // 底部导航栏
  tabBar: {
    height: 70,
    marginBottom: 20,
    marginHorizontal: 20,
  },

  // 卡片
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },

  // 输入框
  input: {
    height: 48,
    paddingHorizontal: 16,
  },

  // 头部
  header: {
    height: 56,
  },
};

// 统一的字体系统 - 基于 4px 网格
export const Typography = {
  // 字体大小
  fontSize: {
    xs: 12,      // 小号文字：辅助信息、标签
    sm: 14,      // 正文小号：次要内容
    base: 16,    // 基础正文：主要内容
    lg: 18,      // 大号正文：强调内容
    xl: 20,      // 小标题
    '2xl': 24,   // 中标题
    '3xl': 28,   // 大标题
    '4xl': 32,   // 特大标题
    '5xl': 48,   // 超大显示
  },

  // 行高
  lineHeight: {
    tight: 1.25,   // 紧凑：标题
    normal: 1.5,   // 正常：正文
    relaxed: 1.75, // 宽松：长文本
  },

  // 字重
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export default Layout;
