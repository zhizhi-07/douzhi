import { TheatreTemplate } from '../../theatreTemplates'

export const callLogTemplate: TheatreTemplate = {
    id: 'call_log',
    category: '社交通讯',
    name: '通话记录',
    keywords: ['通话记录', '通话', '电话记录', '通话详单'],
    fields: [
      { key: 'NAME', label: '联系人', placeholder: '妈妈' },
      { key: 'LOCATION', label: '归属地', placeholder: '北京 移动' },
      
      { key: 'CALL1_TIME', label: '通话1时间', placeholder: '18:20' },
      { key: 'CALL1_TYPE', label: '通话1类型', placeholder: '呼入' }, // 呼入, 呼出, 未接
      { key: 'CALL1_DURATION', label: '通话1时长', placeholder: '12分30秒' },
      { key: 'CALL1_CONTENT', label: '通话1内容', placeholder: '聊了关于周末回家的安排，确认了车票时间。' },
      
      { key: 'CALL2_TIME', label: '通话2时间', placeholder: '昨天' },
      { key: 'CALL2_TYPE', label: '通话2类型', placeholder: '呼出' },
      { key: 'CALL2_DURATION', label: '通话2时长', placeholder: '5分20秒' },
      { key: 'CALL2_CONTENT', label: '通话2内容', placeholder: '询问了快递的派送进度。' },
      
      { key: 'CALL3_TIME', label: '通话3时间', placeholder: '星期一' },
      { key: 'CALL3_TYPE', label: '通话3类型', placeholder: '未接' },
      { key: 'CALL3_DURATION', label: '通话3标签', placeholder: '响铃3声' },
      { key: 'CALL3_REASON', label: '未接原因', placeholder: '当时正在开重要会议，手机静音了。' },
    ],
    htmlTemplate: `
<div data-call-log style="width: 375px; margin: 0 auto; background: #fff; border-radius: 40px; overflow: hidden; border: 8px solid #1c1c1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 20px 40px rgba(0,0,0,0.2); position: relative; user-select: none;">
  <!-- 顶部状态栏 -->
  <div style="height: 44px; background: #fff; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; font-size: 15px; font-weight: 600;">
    <div>9:41</div>
    <div style="display: flex; gap: 6px;">
      <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><path d="M1 8C1 8 3.5 4 9 4C14.5 4 17 8 17 8" stroke="black" stroke-width="2" stroke-linecap="round"/><path d="M1 8.5C1 8.5 3.5 12.5 9 12.5C14.5 12.5 17 8.5 17 8.5" stroke="black" stroke-width="2" stroke-linecap="round"/></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor"><path d="M13 4V2C13 1.44772 12.5523 1 12 1H2C1.44772 1 1 1.44772 1 2V10C1 10.5523 1.44772 11 2 11H12C12.5523 11 13 10.5523 13 10V8" stroke="black" stroke-width="2"/><rect x="14" y="4" width="2" height="4" fill="black"/></svg>
    </div>
  </div>

  <!-- 标题栏 -->
  <div style="padding: 10px 16px 15px; display: flex; justify-content: center; align-items: center; border-bottom: 0.5px solid rgba(0,0,0,0.1);">
    <div style="background: #e5e5ea; border-radius: 8px; padding: 2px; display: flex; width: 180px;">
      <div data-tab="all" style="flex: 1; text-align: center; padding: 4px; font-size: 13px; font-weight: 600; background: #fff; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s;">所有通话</div>
      <div data-tab="missed" style="flex: 1; text-align: center; padding: 4px; font-size: 13px; font-weight: 500; color: #666; cursor: pointer; transition: all 0.2s;">未接来电</div>
    </div>
    <div style="position: absolute; right: 16px; color: #007aff; font-size: 16px;">编辑</div>
  </div>

  <!-- 列表内容 -->
  <div style="background: #fff; min-height: 500px;">
    
    <!-- 列表项 1 -->
    <div data-call-item="1" data-type="{{CALL1_TYPE}}" data-content="{{CALL1_CONTENT}}" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.1); cursor: pointer;">
      <div style="flex: 1;">
        <div style="font-size: 17px; font-weight: 600; color: #000; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <span style="color: black;">{{NAME}}</span>
        </div>
        <div style="font-size: 14px; color: #8e8e93; display: flex; align-items: center; gap: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .57 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.57A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>{{CALL1_DURATION}}</span>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 15px; color: #8e8e93;">{{CALL1_TIME}}</div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
    </div>

    <!-- 列表项 2 -->
    <div data-call-item="2" data-type="{{CALL2_TYPE}}" data-content="{{CALL2_CONTENT}}" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.1); cursor: pointer;">
      <div style="flex: 1;">
        <div style="font-size: 17px; font-weight: 600; color: #000; margin-bottom: 4px;">{{NAME}}</div>
        <div style="font-size: 14px; color: #8e8e93;">{{CALL2_DURATION}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 15px; color: #8e8e93;">{{CALL2_TIME}}</div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
    </div>

    <!-- 列表项 3 -->
    <div data-call-item="3" data-type="{{CALL3_TYPE}}" data-reason="{{CALL3_REASON}}" style="display: flex; align-items: center; padding: 12px 16px; border-bottom: 0.5px solid rgba(0,0,0,0.1); cursor: pointer;">
      <div style="flex: 1;">
        <div style="font-size: 17px; font-weight: 600; color: #ff3b30; margin-bottom: 4px;">{{NAME}}</div>
        <div style="font-size: 14px; color: #8e8e93;">{{CALL3_DURATION}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="font-size: 15px; color: #8e8e93;">{{CALL3_TIME}}</div>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007aff" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      </div>
    </div>

  </div>

  <!-- 底部Tab栏 -->
  <div style="height: 83px; background: #f9f9f9; border-top: 0.5px solid rgba(0,0,0,0.2); display: flex; justify-content: space-around; padding-top: 10px; position: absolute; bottom: 0; width: 100%;">
    <div style="display: flex; flex-direction: column; align-items: center; color: #999;">
      <div style="font-size: 24px;">★</div>
      <div style="font-size: 10px; margin-top: 4px;">个人收藏</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #007aff;">
      <div style="font-size: 24px;">🕒</div>
      <div style="font-size: 10px; margin-top: 4px;">最近通话</div>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; color: #999;">
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
  <div style="position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%); width: 134px; height: 5px; background: #000; border-radius: 100px;"></div>
</div>
    `.trim()
  }
