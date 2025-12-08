import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.zhizhi.douzhi',
  appName: '豆汁',
  webDir: 'dist',
  ios: {
    // 允许WebView延伸到安全区域
    contentInset: 'always',
    // 允许滚动到边缘
    allowsLinkPreview: false
  },
  plugins: {
    StatusBar: {
      // 状态栏样式
      style: 'DARK',
      // 背景色透明，让内容延伸到状态栏下方
      backgroundColor: '#00000000'
    }
  }
};

export default config;
