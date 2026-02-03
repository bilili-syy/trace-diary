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

  // 边距
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
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

export default Layout;
