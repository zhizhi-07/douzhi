// 生成测试图标数据
// 在浏览器控制台运行此脚本来生成测试数据

(function() {
  console.clear();
  console.log('%c🎨 生成测试图标数据', 'color: #FF9800; font-size: 18px; font-weight: bold;');
  
  // 创建一个简单的彩色方块作为测试图标
  function createTestIcon(color) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // 绘制渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 64, 64);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, adjustColor(color, -30));
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    // 添加文字
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('测', 32, 32);
    
    return canvas.toDataURL();
  }
  
  function adjustColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }
  
  // 生成UI图标测试数据
  const testUIIcons = {
    'main-topbar-bg': createTestIcon('#9C27B0'),  // 紫色
    'main-bottombar-bg': createTestIcon('#2196F3'), // 蓝色
    'main-group': createTestIcon('#4CAF50'),       // 绿色
    'main-add': createTestIcon('#FF5722'),         // 橙色
    'nav-chat': createTestIcon('#00BCD4'),         // 青色
    'nav-contacts': createTestIcon('#FFC107'),      // 黄色
    'nav-discover': createTestIcon('#E91E63'),      // 粉色
    'nav-me': createTestIcon('#795548'),            // 棕色
  };
  
  // 生成桌面图标测试数据
  const testDesktopIcons = [
    { appId: 'wechat-app', icon: createTestIcon('#4CAF50') },
    { appId: 'preset', icon: createTestIcon('#2196F3') },
    { appId: 'worldbook', icon: createTestIcon('#FF9800') },
    { appId: 'music-app', icon: createTestIcon('#E91E63') },
  ];
  
  // 保存到localStorage
  localStorage.setItem('ui_custom_icons', JSON.stringify(testUIIcons));
  localStorage.setItem('custom_icons', JSON.stringify(testDesktopIcons));
  
  // 触发更新事件
  window.dispatchEvent(new Event('uiIconsChanged'));
  window.dispatchEvent(new CustomEvent('iconChanged'));
  
  console.log('✅ 测试数据已生成!');
  console.log('📦 UI图标:', Object.keys(testUIIcons).length, '个');
  console.log('📦 桌面图标:', testDesktopIcons.length, '个');
  console.log('\n💡 现在请:');
  console.log('1. 刷新页面查看效果');
  console.log('2. 进入 /wechat 查看主界面背景');
  console.log('3. 进入 /decoration/global 查看所有图标');
  
})();
