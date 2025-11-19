// 测试上传功能
// 在浏览器控制台运行此脚本

(function() {
  console.clear();
  console.log('%c🧪 测试图标上传功能', 'color: #FF9800; font-size: 18px; font-weight: bold;');
  console.log('=' .repeat(50));
  
  // 1. 检查文件输入框
  const fileInput = document.querySelector('input[type="file"]');
  console.log('\n📁 文件输入框:', fileInput ? '✅ 存在' : '❌ 不存在');
  if (fileInput) {
    console.log('  - accept:', fileInput.getAttribute('accept'));
    console.log('  - 可见性:', window.getComputedStyle(fileInput).display);
  }
  
  // 2. 模拟点击聊天顶栏
  console.log('\n🖱️ 测试聊天顶栏点击:');
  const chatTopbar = document.querySelector('.bg-white.h-14.flex.items-center');
  if (chatTopbar) {
    console.log('  ✅ 找到聊天顶栏元素');
    console.log('  - 类名:', chatTopbar.className);
    console.log('  - 是否可点击:', chatTopbar.style.cursor === 'pointer' || chatTopbar.className.includes('cursor-pointer'));
  } else {
    console.log('  ❌ 未找到聊天顶栏元素');
    console.log('  提示: 请确保切换到"聊天界面"标签页');
  }
  
  // 3. 检查桌面图标
  console.log('\n🖱️ 测试桌面图标:');
  const desktopIcons = document.querySelectorAll('.grid.grid-cols-4 > div > div[title*="点击更换"]');
  console.log('  找到桌面图标:', desktopIcons.length, '个');
  if (desktopIcons.length > 0) {
    console.log('  ✅ 桌面图标存在');
    console.log('  第一个图标:', desktopIcons[0].getAttribute('title'));
  } else {
    console.log('  ❌ 未找到桌面图标');
    console.log('  提示: 请确保切换到"桌面"标签页');
  }
  
  // 4. 监听点击事件
  console.log('\n👂 设置点击监听...');
  let clickCount = 0;
  
  document.addEventListener('click', function testClick(e) {
    const target = e.target;
    clickCount++;
    
    if (clickCount <= 3) { // 只记录前3次点击
      console.log(`\n点击 #${clickCount}:`, {
        元素: target.tagName,
        类名: target.className,
        内容: target.textContent?.substring(0, 20) || '无文字',
        父元素: target.parentElement?.className
      });
    }
    
    if (clickCount === 3) {
      document.removeEventListener('click', testClick);
      console.log('\n✅ 监听已停止（记录了3次点击）');
    }
  }, true);
  
  console.log('  ✅ 监听已激活，尝试点击聊天顶栏或桌面图标...');
  console.log('  📝 将记录接下来的3次点击事件');
  
  // 5. 提供手动测试方法
  console.log('\n💡 手动测试方法:');
  console.log('1. 切换到"聊天界面"标签');
  console.log('2. 点击顶部的空白处（联系人名称附近）');
  console.log('3. 观察控制台是否输出: 🖱️ 点击聊天顶栏背景区域');
  console.log('4. 切换到"桌面"标签');
  console.log('5. 点击任意应用图标');
  console.log('6. 观察控制台是否输出: 🖱️ 点击桌面图标');
  
  console.log('\n' + '=' .repeat(50));
})();
