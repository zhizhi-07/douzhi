// 全面测试图标系统
// 在浏览器控制台运行此脚本

(function() {
  console.clear();
  console.log('%c🔍 图标系统完整性测试', 'color: #2196F3; font-size: 18px; font-weight: bold;');
  console.log('=' .repeat(50));
  
  // 1. 检查localStorage数据
  console.log('\n📦 数据存储检查:');
  const uiIcons = localStorage.getItem('ui_custom_icons');
  const desktopIcons = localStorage.getItem('custom_icons');
  
  if (uiIcons) {
    const ui = JSON.parse(uiIcons);
    console.log(`✅ UI图标: ${Object.keys(ui).length}个`);
    console.log('  详细:', Object.keys(ui));
  } else {
    console.log('❌ UI图标: 未找到数据');
  }
  
  if (desktopIcons) {
    const desktop = JSON.parse(desktopIcons);
    console.log(`✅ 桌面图标: ${desktop.length}个`);
    console.log('  详细:', desktop.map(d => d.appId));
  } else {
    console.log('❌ 桌面图标: 未找到数据');
  }
  
  // 2. 检查当前页面
  console.log('\n📍 当前页面:', window.location.pathname);
  
  // 3. 页面特定检查
  if (window.location.pathname === '/wechat') {
    console.log('\n🔍 ChatList页面检查:');
    
    // 检查主界面背景
    const topBar = document.querySelector('.glass-effect');
    const bottomBar = document.querySelector('.glass-card.rounded-\\[48px\\]');
    
    if (topBar) {
      const topBg = topBar.style.backgroundImage;
      console.log(topBg ? '✅ 顶栏背景已设置' : '⚠️ 顶栏背景未设置');
    }
    
    if (bottomBar) {
      const bottomBg = bottomBar.style.backgroundImage;
      console.log(bottomBg ? '✅ 底栏背景已设置' : '⚠️ 底栏背景未设置');
    }
    
    // 检查图标
    const imgs = document.querySelectorAll('img[alt]');
    const customIconsFound = [];
    imgs.forEach(img => {
      if (img.src.startsWith('data:image')) {
        customIconsFound.push(img.alt);
      }
    });
    console.log(`✅ 页面显示自定义图标: ${customIconsFound.length}个`);
    if (customIconsFound.length > 0) {
      console.log('  包括:', customIconsFound);
    }
  }
  
  // 4. 测试事件系统
  console.log('\n🎯 事件系统测试:');
  
  // 测试UI图标更新事件
  let uiEventReceived = false;
  const testUIHandler = () => { uiEventReceived = true; };
  window.addEventListener('uiIconsChanged', testUIHandler);
  window.dispatchEvent(new Event('uiIconsChanged'));
  console.log(uiEventReceived ? '✅ UI图标事件正常' : '❌ UI图标事件失败');
  window.removeEventListener('uiIconsChanged', testUIHandler);
  
  // 测试桌面图标更新事件
  let desktopEventReceived = false;
  const testDesktopHandler = () => { desktopEventReceived = true; };
  window.addEventListener('iconChanged', testDesktopHandler);
  window.dispatchEvent(new CustomEvent('iconChanged'));
  console.log(desktopEventReceived ? '✅ 桌面图标事件正常' : '❌ 桌面图标事件失败');
  window.removeEventListener('iconChanged', testDesktopHandler);
  
  // 5. 提供修复建议
  console.log('\n💡 建议操作:');
  console.log('1. 如果图标未显示，尝试刷新页面 (Ctrl+R)');
  console.log('2. 进入 /decoration/global 重新上传图标');
  console.log('3. 清除浏览器缓存并重新加载');
  
  console.log('\n' + '=' .repeat(50));
  console.log('%c测试完成!', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
})();
