// 紧急恢复脚本 - 在浏览器控制台运行
// 先检查数据在哪里

(function() {
  console.clear();
  console.log('%c🚨 紧急数据恢复检查', 'color: red; font-size: 20px; font-weight: bold');
  console.log('=' .repeat(50));
  
  // 1. 检查localStorage
  console.log('\n📦 检查 localStorage:');
  const uiIcons = localStorage.getItem('ui_custom_icons');
  const desktopIcons = localStorage.getItem('custom_icons');
  const chatHistory = localStorage.getItem('chatHistory');
  const messages = localStorage.getItem('messages');
  
  if (uiIcons) {
    console.log('✅ 找到UI图标备份:', Object.keys(JSON.parse(uiIcons)).length, '个');
  } else {
    console.log('❌ localStorage中没有UI图标');
  }
  
  if (desktopIcons) {
    console.log('✅ 找到桌面图标备份:', JSON.parse(desktopIcons).length, '个');
  } else {
    console.log('❌ localStorage中没有桌面图标');
  }
  
  if (chatHistory || messages) {
    console.log('✅ 找到聊天记录');
  } else {
    console.log('❌ 没有找到聊天记录');
  }
  
  // 2. 检查IndexedDB
  console.log('\n📦 检查 IndexedDB:');
  
  const checkIndexedDB = async () => {
    try {
      const databases = await indexedDB.databases();
      console.log('数据库列表:', databases);
      
      // 检查IconStorage数据库
      const request = indexedDB.open('IconStorage', 1);
      
      request.onsuccess = () => {
        const db = request.result;
        console.log('✅ IconStorage数据库已打开');
        
        // 检查UI图标
        const transaction = db.transaction(['ui_icons'], 'readonly');
        const store = transaction.objectStore('ui_icons');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const icons = getAllRequest.result;
          console.log('IndexedDB中的UI图标数:', icons.length);
        };
      };
      
      request.onerror = () => {
        console.log('❌ 无法打开IconStorage数据库');
      };
      
    } catch (error) {
      console.error('检查IndexedDB失败:', error);
    }
  };
  
  checkIndexedDB();
  
  // 3. 提供恢复方案
  console.log('\n💡 恢复方案:');
  console.log('1. 如果上面显示localStorage有数据，运行: recover-backup.js');
  console.log('2. 如果都没有，检查浏览器的"应用"标签 > IndexedDB');
  console.log('3. 尝试使用浏览器的"后退"功能恢复');
  
})();
