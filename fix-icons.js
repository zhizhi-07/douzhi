// 图标系统修复脚本
// 如果图标显示有问题，运行此脚本

(function() {
  console.clear();
  console.log('%c🔧 图标系统自动修复', 'color: #FF5722; font-size: 18px; font-weight: bold;');
  console.log('=' .repeat(50));
  
  let fixed = 0;
  
  // 1. 检查并修复UI图标数据
  console.log('\n📦 检查UI图标数据...');
  const uiIcons = localStorage.getItem('ui_custom_icons');
  if (uiIcons) {
    try {
      const icons = JSON.parse(uiIcons);
      console.log(`✅ 找到 ${Object.keys(icons).length} 个UI图标`);
      
      // 触发更新事件确保页面刷新
      window.dispatchEvent(new Event('uiIconsChanged'));
      fixed++;
    } catch (e) {
      console.log('❌ UI图标数据损坏，正在清理...');
      localStorage.removeItem('ui_custom_icons');
      localStorage.setItem('ui_custom_icons', '{}');
      fixed++;
    }
  } else {
    console.log('⚠️ 未找到UI图标数据，创建空数据...');
    localStorage.setItem('ui_custom_icons', '{}');
    fixed++;
  }
  
  // 2. 检查并修复桌面图标数据
  console.log('\n📦 检查桌面图标数据...');
  const desktopIcons = localStorage.getItem('custom_icons');
  if (desktopIcons) {
    try {
      const icons = JSON.parse(desktopIcons);
      console.log(`✅ 找到 ${icons.length} 个桌面图标`);
      
      // 确保是数组格式
      if (!Array.isArray(icons)) {
        console.log('⚠️ 修复桌面图标格式...');
        localStorage.setItem('custom_icons', '[]');
        fixed++;
      }
      
      // 触发更新事件
      window.dispatchEvent(new CustomEvent('iconChanged'));
    } catch (e) {
      console.log('❌ 桌面图标数据损坏，正在清理...');
      localStorage.removeItem('custom_icons');
      localStorage.setItem('custom_icons', '[]');
      fixed++;
    }
  } else {
    console.log('⚠️ 未找到桌面图标数据，创建空数据...');
    localStorage.setItem('custom_icons', '[]');
    fixed++;
  }
  
  // 3. 强制刷新React组件
  console.log('\n🔄 强制刷新组件...');
  const reactRoot = document.getElementById('root');
  if (reactRoot && reactRoot._reactRootContainer) {
    console.log('✅ 找到React根组件');
    // 触发所有可能的更新事件
    window.dispatchEvent(new Event('uiIconsChanged'));
    window.dispatchEvent(new CustomEvent('iconChanged'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'ui_custom_icons',
      newValue: localStorage.getItem('ui_custom_icons'),
      url: window.location.href
    }));
    fixed++;
  }
  
  // 4. 检查当前页面
  console.log('\n📍 当前页面检查...');
  const path = window.location.pathname;
  if (path === '/wechat') {
    console.log('✅ 在聊天列表页面');
    // 尝试直接设置样式
    const topBar = document.querySelector('.glass-effect');
    const bottomBar = document.querySelector('.glass-card.rounded-\\[48px\\]');
    
    if (topBar || bottomBar) {
      const icons = JSON.parse(localStorage.getItem('ui_custom_icons') || '{}');
      if (topBar && icons['main-topbar-bg']) {
        topBar.style.backgroundImage = `url(${icons['main-topbar-bg']})`;
        topBar.style.backgroundSize = 'cover';
        console.log('✅ 直接应用顶栏背景');
        fixed++;
      }
      if (bottomBar && icons['main-bottombar-bg']) {
        bottomBar.style.backgroundImage = `url(${icons['main-bottombar-bg']})`;
        bottomBar.style.backgroundSize = 'cover';
        console.log('✅ 直接应用底栏背景');
        fixed++;
      }
    }
  }
  
  // 5. 完成报告
  console.log('\n' + '=' .repeat(50));
  if (fixed > 0) {
    console.log(`%c✅ 修复完成! 执行了 ${fixed} 项修复`, 'color: #4CAF50; font-size: 14px; font-weight: bold;');
    console.log('\n💡 建议操作:');
    console.log('1. 刷新页面查看效果 (F5)');
    console.log('2. 如仍有问题，尝试硬刷新 (Ctrl+Shift+R)');
    console.log('3. 进入 /decoration/global 重新设置图标');
  } else {
    console.log('%c✅ 系统正常，无需修复', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
  }
  
})();
