import { TheatreTemplate } from '../../theatreTemplates'

export const callLogTemplate: TheatreTemplate = {
    id: 'call_log',
    category: '社交通讯',
    name: '通话记录',
    keywords: ['通话记录', '通话', '电话记录', '通话详单'],
    fields: [
      { key: 'SCHOOL', label: '学校/单位', placeholder: '清华大学' },
      { key: 'MY_NUMBER', label: '本机号码', placeholder: '138 0013 8000' },
      
      { key: 'CALL1_NAME', label: '通话1人名', placeholder: '妈妈' },
      { key: 'CALL1_TIME', label: '通话1时间', placeholder: '18:20' },
      { key: 'CALL1_TYPE', label: '通话1类型', placeholder: '呼入' }, 
      { key: 'CALL1_LABEL', label: '通话1标签', placeholder: '手机' },
      
      { key: 'CALL2_NAME', label: '通话2人名', placeholder: '顺丰快递' },
      { key: 'CALL2_TIME', label: '通话2时间', placeholder: '昨天' },
      { key: 'CALL2_TYPE', label: '通话2类型', placeholder: '呼出' },
      { key: 'CALL2_LABEL', label: '通话2标签', placeholder: '工作' },
      
      { key: 'CALL3_NAME', label: '通话3人名', placeholder: '辅导员' },
      { key: 'CALL3_TIME', label: '通话3时间', placeholder: '星期一' },
      { key: 'CALL3_TYPE', label: '通话3类型', placeholder: '未接' },
      { key: 'CALL3_LABEL', label: '通话3标签', placeholder: '学校' },

      { key: 'CALL4_NAME', label: '通话4人名', placeholder: '外卖' },
      { key: 'CALL4_TIME', label: '通话4时间', placeholder: '星期一' },
      { key: 'CALL4_TYPE', label: '通话4类型', placeholder: '呼入' },
      { key: 'CALL4_LABEL', label: '通话4标签', placeholder: '未知' },

      { key: 'CALL5_NAME', label: '通话5人名', placeholder: '诈骗电话' },
      { key: 'CALL5_TIME', label: '通话5时间', placeholder: '星期日' },
      { key: 'CALL5_TYPE', label: '通话5类型', placeholder: '未接' },
      { key: 'CALL5_LABEL', label: '通话5标签', placeholder: '被拦截' },
    ],
    htmlTemplate: `
<div id="call-log-app" style="width: 100%; max-width: 375px; margin: 0 auto; background: #fff; border-radius: 40px; overflow: hidden; border: 8px solid #1c1c1e; font-family: -apple-system, BlinkMacSystemFont, sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; user-select: none; aspect-ratio: 9/19.5; display: flex; flex-direction: column;">
  
  <!-- 顶部状态栏 -->
  <div style="height: 44px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; font-size: 15px; font-weight: 600; z-index: 10; border-bottom: 0.5px solid rgba(0,0,0,0.1);">
    <div>9:41</div>
    <div style="display: flex; gap: 6px;">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M1 8C1 8 3.5 4 9 4C14.5 4 17 8 17 8" stroke="black" stroke-width="2" stroke-linecap="round"/><path d="M1 8.5C1 8.5 3.5 12.5 9 12.5C14.5 12.5 17 8.5 17 8.5" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M13 4V2C13 1.44772 12.5523 1 12 1H2C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H12C12.5523 11 13 10.5523 13 10V8" stroke="black" stroke-width="2"/><rect x="14" y="4" width="2" height="4" fill="black"/></svg>
    </div>
  </div>

  <!-- 内容区域：最近通话 (Tab 1) -->
  <div id="tab-recents" style="flex: 1; overflow-y: auto; display: block;">
    <!-- 标题栏 -->
    <div style="padding: 10px 16px 10px; display: flex; justify-content: center; align-items: center;">
      <div style="background: #eeeff1; border-radius: 9px; padding: 2px; display: flex; width: 180px;">
        <div style="flex: 1; text-align: center; padding: 4px; font-size: 13px; font-weight: 600; background: #fff; border-radius: 7px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">所有通话</div>
        <div style="flex: 1; text-align: center; padding: 4px; font-size: 13px; font-weight: 500; color: #000;">未接来电</div>
      </div>
      <div style="position: absolute; right: 16px; color: #007aff; font-size: 16px;">编辑</div>
    </div>
    
    <div style="padding-left: 20px;">
       <div style="font-size: 32px; font-weight: 700; margin: 10px 0 15px 0;">最近通话</div>
       
       <!-- 通话列表 -->
       <div style="display: flex; flex-direction: column;">
         <!-- Item 1 -->
         <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8;">
           <div style="flex: 1;">
             <div style="font-size: 17px; font-weight: 600; color: {{CALL1_TYPE}} == '未接' ? '#ff3b30' : '#000'; margin-bottom: 4px;">{{CALL1_NAME}}</div>
             <div style="font-size: 14px; color: #8e8e93; display: flex; align-items: center; gap: 6px;">
                <span style="color: #8e8e93;">{{CALL1_LABEL}}</span>
             </div>
           </div>
           <div style="display: flex; align-items: center; gap: 8px;">
             <div style="font-size: 15px; color: #8e8e93;">{{CALL1_TIME}}</div>
             <div style="width: 22px; height: 22px; border: 1px solid #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #007aff;">
               <span style="font-size: 12px;">i</span>
             </div>
           </div>
         </div>

         <!-- Item 2 -->
         <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8;">
           <div style="flex: 1;">
             <div style="font-size: 17px; font-weight: 600; color: {{CALL2_TYPE}} == '未接' ? '#ff3b30' : '#000'; margin-bottom: 4px;">{{CALL2_NAME}}</div>
             <div style="font-size: 14px; color: #8e8e93;">{{CALL2_LABEL}}</div>
           </div>
           <div style="display: flex; align-items: center; gap: 8px;">
             <div style="font-size: 15px; color: #8e8e93;">{{CALL2_TIME}}</div>
             <div style="width: 22px; height: 22px; border: 1px solid #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #007aff;">
               <span style="font-size: 12px;">i</span>
             </div>
           </div>
         </div>

         <!-- Item 3 -->
         <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8;">
           <div style="flex: 1;">
             <div style="font-size: 17px; font-weight: 600; color: {{CALL3_TYPE}} == '未接' ? '#ff3b30' : '#000'; margin-bottom: 4px;">{{CALL3_NAME}}</div>
             <div style="font-size: 14px; color: #8e8e93;">{{CALL3_LABEL}}</div>
           </div>
           <div style="display: flex; align-items: center; gap: 8px;">
             <div style="font-size: 15px; color: #8e8e93;">{{CALL3_TIME}}</div>
             <div style="width: 22px; height: 22px; border: 1px solid #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #007aff;">
               <span style="font-size: 12px;">i</span>
             </div>
           </div>
         </div>

         <!-- Item 4 -->
         <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8;">
           <div style="flex: 1;">
             <div style="font-size: 17px; font-weight: 600; color: {{CALL4_TYPE}} == '未接' ? '#ff3b30' : '#000'; margin-bottom: 4px;">{{CALL4_NAME}}</div>
             <div style="font-size: 14px; color: #8e8e93;">{{CALL4_LABEL}}</div>
           </div>
           <div style="display: flex; align-items: center; gap: 8px;">
             <div style="font-size: 15px; color: #8e8e93;">{{CALL4_TIME}}</div>
             <div style="width: 22px; height: 22px; border: 1px solid #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #007aff;">
               <span style="font-size: 12px;">i</span>
             </div>
           </div>
         </div>

         <!-- Item 5 -->
         <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8;">
           <div style="flex: 1;">
             <div style="font-size: 17px; font-weight: 600; color: {{CALL5_TYPE}} == '未接' ? '#ff3b30' : '#000'; margin-bottom: 4px;">{{CALL5_NAME}}</div>
             <div style="font-size: 14px; color: #8e8e93;">{{CALL5_LABEL}}</div>
           </div>
           <div style="display: flex; align-items: center; gap: 8px;">
             <div style="font-size: 15px; color: #8e8e93;">{{CALL5_TIME}}</div>
             <div style="width: 22px; height: 22px; border: 1px solid #007aff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #007aff;">
               <span style="font-size: 12px;">i</span>
             </div>
           </div>
         </div>

       </div>
    </div>
  </div>

  <!-- 内容区域：通讯录 (Tab 2) -->
  <div id="tab-contacts" style="flex: 1; overflow-y: auto; display: none; background: #fff;">
     <div style="padding: 10px 16px; display: flex; justify-content: space-between; color: #007aff; font-size: 16px;">
       <div>群组</div>
       <div style="font-size: 20px;">+</div>
     </div>
     <div style="padding-left: 20px;">
       <div style="font-size: 32px; font-weight: 700; margin: 0px 0 10px 0;">通讯录</div>
       <div style="background: #eeeff1; border-radius: 10px; padding: 8px 12px; margin-right: 20px; margin-bottom: 15px; color: #8e8e93; display: flex; align-items: center; gap: 6px;">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
         搜索
       </div>

       <!-- 个人名片 -->
       <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8; align-items: center;">
         <div style="width: 50px; height: 50px; background: #e5e5ea; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 20px; color: #999;">👤</div>
         <div>
           <div style="font-size: 18px; font-weight: 600;">我</div>
           <div style="font-size: 13px; color: #8e8e93;">{{MY_NUMBER}}</div>
         </div>
       </div>

       <!-- 学校列表 -->
       <div style="background: #f2f2f7; padding: 6px 16px; font-weight: 600; font-size: 14px; margin-left: -20px; padding-left: 20px;">{{SCHOOL}}</div>
       
       <div style="padding: 12px 0; border-bottom: 0.5px solid #c6c6c8; font-size: 17px; font-weight: 500;">教务处</div>
       <div style="padding: 12px 0; border-bottom: 0.5px solid #c6c6c8; font-size: 17px; font-weight: 500;">{{CALL3_NAME}}</div>
       <div style="padding: 12px 0; border-bottom: 0.5px solid #c6c6c8; font-size: 17px; font-weight: 500;">图书馆</div>

       <div style="background: #f2f2f7; padding: 6px 16px; font-weight: 600; font-size: 14px; margin-left: -20px; padding-left: 20px;">常用</div>
       <div style="padding: 12px 0; border-bottom: 0.5px solid #c6c6c8; font-size: 17px; font-weight: 500;">{{CALL1_NAME}}</div>
       <div style="padding: 12px 0; border-bottom: 0.5px solid #c6c6c8; font-size: 17px; font-weight: 500;">{{CALL2_NAME}}</div>

     </div>
  </div>

  <!-- 内容区域：个人收藏 (Tab 3) -->
  <div id="tab-favorites" style="flex: 1; overflow-y: auto; display: none; background: #fff;">
     <div style="padding: 10px 16px; display: flex; justify-content: space-between; color: #007aff; font-size: 16px;">
       <div></div>
       <div>+</div>
     </div>
     <div style="padding-left: 20px;">
       <div style="font-size: 32px; font-weight: 700; margin: 0px 0 10px 0;">个人收藏</div>
       
       <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8; align-items: center;">
         <div style="width: 40px; height: 40px; background: #8e8e93; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px; color: #fff;">妈</div>
         <div style="flex: 1;">
           <div style="font-size: 17px; font-weight: 600;">{{CALL1_NAME}}</div>
           <div style="font-size: 13px; color: #8e8e93;">手机</div>
         </div>
         <div style="color: #007aff; font-size: 20px;">ℹ️</div>
       </div>

       <div style="display: flex; padding: 12px 16px 12px 0; border-bottom: 0.5px solid #c6c6c8; align-items: center;">
         <div style="width: 40px; height: 40px; background: #ff9500; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px; color: #fff;">校</div>
         <div style="flex: 1;">
           <div style="font-size: 17px; font-weight: 600;">{{SCHOOL}}保卫处</div>
           <div style="font-size: 13px; color: #8e8e93;">办公电话</div>
         </div>
         <div style="color: #007aff; font-size: 20px;">ℹ️</div>
       </div>

     </div>
  </div>

  <!-- 底部Tab栏 -->
  <div style="height: 83px; background: #f9f9f9; border-top: 0.5px solid rgba(0,0,0,0.2); display: flex; justify-content: space-around; padding-top: 10px; position: sticky; bottom: 0; width: 100%; z-index: 20;">
    <div onclick="switchTab('favorites')" id="btn-favorites" style="display: flex; flex-direction: column; align-items: center; color: #999; cursor: pointer;">
      <div style="font-size: 24px;">★</div>
      <div style="font-size: 10px; margin-top: 4px;">个人收藏</div>
    </div>
    <div onclick="switchTab('recents')" id="btn-recents" style="display: flex; flex-direction: column; align-items: center; color: #007aff; cursor: pointer;">
      <div style="font-size: 24px;">🕒</div>
      <div style="font-size: 10px; margin-top: 4px;">最近通话</div>
    </div>
    <div onclick="switchTab('contacts')" id="btn-contacts" style="display: flex; flex-direction: column; align-items: center; color: #999; cursor: pointer;">
      <div style="font-size: 24px;">👥</div>
      <div style="font-size: 10px; margin-top: 4px;">通讯录</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #999;">
      <div style="font-size: 24px;">⌨️</div>
      <div style="font-size: 10px; margin-top: 4px;">拨号键盘</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #999;">
      <div style="font-size: 24px;">➿</div>
      <div style="font-size: 10px; margin-top: 4px;">语音留言</div>
    </div>
  </div>
  
  <!-- 底部Home Indicator -->
  <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 134px; height: 5px; background: #000; border-radius: 100px; z-index: 30;"></div>

  <script>
    function switchTab(tabName) {
      // Hide all tabs
      document.getElementById('tab-recents').style.display = 'none';
      document.getElementById('tab-contacts').style.display = 'none';
      document.getElementById('tab-favorites').style.display = 'none';
      
      // Reset button colors
      document.getElementById('btn-recents').style.color = '#999';
      document.getElementById('btn-contacts').style.color = '#999';
      document.getElementById('btn-favorites').style.color = '#999';
      
      // Show selected tab and highlight button
      document.getElementById('tab-' + tabName).style.display = 'block';
      document.getElementById('btn-' + tabName).style.color = '#007aff';
    }
  </script>
</div>
    `.trim()
  }
