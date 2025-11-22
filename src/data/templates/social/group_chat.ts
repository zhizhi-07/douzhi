import { TheatreTemplate } from '../../theatreTemplates'

export const groupChatTemplate: TheatreTemplate = {
    id: 'group_chat',
    category: '社交通讯',
    name: '群聊记录',
    keywords: ['群聊', '聊天记录', '截图', '群截图'],
    fields: [
      { key: 'GROUP_NAME', label: '群名', placeholder: '好友群' },
      { key: 'MEMBER_COUNT', label: '群成员数', placeholder: '25' },
      { key: 'MSG1_SENDER', label: '消息1发送者', placeholder: '张三' },
      { key: 'MSG1_CONTENT', label: '消息1内容', placeholder: '大家好' },
      { key: 'MSG2_SENDER', label: '消息2发送者', placeholder: '李四' },
      { key: 'MSG2_CONTENT', label: '消息2内容', placeholder: '在吗' },
      { key: 'MSG3_SENDER', label: '消息3发送者', placeholder: '王五' },
      { key: 'MSG3_CONTENT', label: '消息3内容', placeholder: '怎么了' },
      { key: 'MSG4_SENDER', label: '消息4发送者', placeholder: '赵六' },
      { key: 'MSG4_CONTENT', label: '消息4内容', placeholder: '说啊' },
      { key: 'MSG5_SENDER', label: '消息5发送者', placeholder: '孙七' },
      { key: 'MSG5_CONTENT', label: '消息5内容', placeholder: '等着呢' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
    ],
    htmlTemplate: `
<div style="max-width: 375px; margin: 0 auto; background: #000; border-radius: 20px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', sans-serif; box-shadow: 0 8px 32px rgba(0,0,0,0.3);">
  <!-- 状态栏 -->
  <div style="background: #f7f7f7; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: #000;">
    <div style="flex: 1;">{{TIME}}</div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#000" style="opacity: 0.5;">
        <circle cx="12" cy="12" r="10"/>
      </svg>
      <span style="font-size: 11px;">中国移动</span>
      <svg width="14" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" style="opacity: 0.7;">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
        <path d="M12 20h.01"/>
      </svg>
    </div>
    <div style="flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 3px;">
      <span style="font-size: 11px;">100%</span>
      <svg width="20" height="10" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
        <rect x="2" y="7" width="18" height="10" rx="2"/>
        <rect x="4" y="9" width="14" height="6" fill="#000"/>
        <line x1="21" y1="10" x2="21" y2="14" stroke="#000" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </div>
  </div>
  
  <!-- 导航栏 -->
  <div style="background: #ededed; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 0.5px solid #c8c8c8;">
    <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #000; line-height: 1.2;">{{GROUP_NAME}}</div>
        <div style="font-size: 11px; color: #888; margin-top: 1px;">({{MEMBER_COUNT}})</div>
      </div>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  </div>
  
  <!-- 聊天内容区 -->
  <div style="background: #f7f7f7; padding: 12px; min-height: 320px; max-height: 450px; overflow-y: auto;">
    <!-- 时间提示 -->
    <div style="text-align: center; margin: 8px 0 12px 0;">
      <span style="background: rgba(0,0,0,0.08); color: #888; font-size: 11px; padding: 3px 10px; border-radius: 10px;">{{TIME}}</span>
    </div>
    
    <!-- 消息1 -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 4px;">{{MSG1_SENDER}}</div>
      <div style="background: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; max-width: 70%; font-size: 14px; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{MSG1_CONTENT}}</div>
    </div>
    
    <!-- 消息2 -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 4px;">{{MSG2_SENDER}}</div>
      <div style="background: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; max-width: 70%; font-size: 14px; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{MSG2_CONTENT}}</div>
    </div>
    
    <!-- 消息3 -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 4px;">{{MSG3_SENDER}}</div>
      <div style="background: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; max-width: 70%; font-size: 14px; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{MSG3_CONTENT}}</div>
    </div>
    
    <!-- 消息4 -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 4px;">{{MSG4_SENDER}}</div>
      <div style="background: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; max-width: 70%; font-size: 14px; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{MSG4_CONTENT}}</div>
    </div>
    
    <!-- 消息5 -->
    <div style="margin-bottom: 10px;">
      <div style="font-size: 12px; color: #888; margin-bottom: 4px;">{{MSG5_SENDER}}</div>
      <div style="background: #fff; padding: 8px 12px; border-radius: 8px; display: inline-block; max-width: 70%; font-size: 14px; color: #333; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">{{MSG5_CONTENT}}</div>
    </div>
  </div>
  
  <!-- 底部输入栏装饰 -->
  <div style="background: #f3f3f3; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-top: 0.5px solid #d1d1d1;">
    <div style="width: 28px; height: 28px; border-radius: 4px; background: #fff; display: flex; align-items: center; justify-content: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </div>
    <div style="flex: 1; background: #fff; border-radius: 6px; padding: 7px 12px; font-size: 13px; color: #999;">{{GROUP_NAME}}</div>
    <div style="width: 28px; height: 28px; border-radius: 4px; background: #fff; display: flex; align-items: center; justify-content: center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    </div>
    <div style="width: 28px; height: 28px; border-radius: 4px; background: #fff; display: flex; align-items: center; justify-content: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2.5" stroke-linecap="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </div>
</div>
    `.trim()
  }
