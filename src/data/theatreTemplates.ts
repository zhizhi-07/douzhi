// 小剧场模板配置
export interface TheatreTemplate {
  id: string
  name: string
  keywords: string[] // 触发关键词
  fields: TheatreField[] // 需要AI提供的字段
  htmlTemplate: string // HTML模板（带占位符）
}

export interface TheatreField {
  key: string // 字段key，用于正则替换
  label: string // 字段中文名
  placeholder?: string // 默认值
}

export const theatreTemplates: TheatreTemplate[] = [
  {
    id: 'receipt',
    name: '小票',
    keywords: ['小票', '发票', '账单', '收据'],
    fields: [
      { key: 'FOOD_NAME', label: '食物', placeholder: '炒饭' },
      { key: 'PRICE', label: '价格', placeholder: '25' },
      { key: 'SHOP_NAME', label: '商家', placeholder: '快餐店' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-21' },
      { key: 'TIME', label: '时间', placeholder: '13:45' },
    ],
    htmlTemplate: `
<div data-receipt style="max-width: 280px; margin: 0 auto; background: #fafafa; padding: 18px 16px; font-family: 'Courier New', monospace; border: 1px solid #e0e0e0; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
  <div style="text-align: center; border-bottom: 1px dashed #ccc; padding-bottom: 12px; margin-bottom: 14px;">
    <div style="font-size: 18px; font-weight: bold; color: #333;">{{SHOP_NAME}}</div>
    <div style="font-size: 11px; color: #999; margin-top: 4px;">电子小票</div>
  </div>
  
  <div style="font-size: 13px; line-height: 1.6; color: #333;">
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>商品</span>
      <span style="font-weight: 600;">{{FOOD_NAME}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>单价</span>
      <span>¥{{PRICE}}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0;">
      <span>数量</span>
      <span>x 1</span>
    </div>
    <div style="border-top: 1px solid #ddd; margin: 10px 0;"></div>
    <div style="display: flex; justify-content: space-between; margin: 6px 0; font-size: 15px; font-weight: bold;">
      <span>合计</span>
      <span style="color: #d32f2f;">¥{{PRICE}}</span>
    </div>
  </div>
  
  <div style="border-top: 1px dashed #ccc; margin-top: 14px; padding-top: 12px; font-size: 11px; color: #999; text-align: center;">
    <div>{{DATE}} {{TIME}}</div>
    <div style="margin-top: 6px; letter-spacing: 1px;">感谢您的光临</div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'diary',
    name: '日记',
    keywords: ['日记', '记录'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '平凡的一天' },
      { key: 'CONTENT', label: '内容', placeholder: '今天天气很好...' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'WEEKDAY', label: '星期', placeholder: '星期四' },
      { key: 'WEATHER', label: '天气', placeholder: '晴' },
      { key: 'MOOD', label: '心情', placeholder: '开心' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #f9f6f0; padding: 30px 25px; border-radius: 3px; box-shadow: 0 2px 10px rgba(0,0,0,0.1), inset 0 0 100px rgba(255,255,200,0.1); position: relative; font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 纸张纹理效果 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(200,200,180,0.15) 29px, rgba(200,200,180,0.15) 30px); pointer-events: none; border-radius: 3px;"></div>
  
  <!-- 订书钉装饰 -->
  <div style="position: absolute; top: 15px; left: 15px; width: 8px; height: 8px; background: #888; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
  <div style="position: absolute; top: 15px; right: 15px; width: 8px; height: 8px; background: #888; border-radius: 50%; box-shadow: 0 1px 2px rgba(0,0,0,0.3);"></div>
  
  <!-- 内容区 -->
  <div style="position: relative; z-index: 1;">
    <!-- 日期和天气 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid #d4c5a9;">
      <div>
        <div style="font-size: 18px; font-weight: bold; color: #2c2416; margin-bottom: 3px;">{{DATE}}</div>
        <div style="font-size: 13px; color: #6b5d4f;">{{WEEKDAY}}</div>
      </div>
      <div style="text-align: right; font-size: 13px; color: #6b5d4f;">
        <div style="margin-bottom: 3px;">天气：{{WEATHER}}</div>
        <div>心情：{{MOOD}}</div>
      </div>
    </div>
    
    <!-- 标题 -->
    <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #2c2416; font-weight: bold; text-align: center; letter-spacing: 1px;">{{TITLE}}</h2>
    
    <!-- 正文 -->
    <div style="font-size: 14px; line-height: 1.9; color: #3a3229; text-indent: 2em; white-space: pre-wrap; word-wrap: break-word;">{{CONTENT}}</div>
    
    <!-- 底部装饰 -->
    <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #9b8b7e; font-style: italic;">
      —— 记于{{DATE}}
    </div>
  </div>
  
  <!-- 边缘磨损效果 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent);"></div>
  <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, transparent, rgba(0,0,0,0.03), transparent);"></div>
</div>
    `.trim()
  },
  
  {
    id: 'menu',
    name: '菜单',
    keywords: ['菜单', '点菜', '餐单'],
    fields: [
      { key: 'DISH1', label: '菜品1', placeholder: '红烧肉' },
      { key: 'PRICE1', label: '价格1', placeholder: '38' },
      { key: 'DISH2', label: '菜品2', placeholder: '糖醋排骨' },
      { key: 'PRICE2', label: '价格2', placeholder: '42' },
      { key: 'DISH3', label: '菜品3', placeholder: '清炒时蔬' },
      { key: 'PRICE3', label: '价格3', placeholder: '18' },
      { key: 'RESTAURANT', label: '餐厅名', placeholder: '家常菜馆' },
    ],
    htmlTemplate: `
<div data-menu style="max-width: 380px; margin: 0 auto; background: linear-gradient(135deg, #1a1a1d 0%, #2d2d30 100%); padding: 0; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部装饰 -->
  <div style="background: linear-gradient(135deg, #c9a236 0%, #e8c468 100%); padding: 24px 20px; position: relative;">
    <div style="position: absolute; top: 0; right: 0; width: 100px; height: 100px; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); border-radius: 50%;"></div>
    <div style="text-align: center; position: relative; z-index: 1;">
      <div style="font-size: 28px; color: #1a1a1d; font-weight: bold; margin-bottom: 6px; letter-spacing: 2px;">{{RESTAURANT}}</div>
      <div style="font-size: 13px; color: rgba(26,26,29,0.7); letter-spacing: 3px;">MENU</div>
    </div>
  </div>
  
  <!-- 菜单列表 -->
  <div style="padding: 24px 20px;">
    <div data-menu-item="1" style="margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; backdrop-filter: blur(10px);">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">{{DISH1}}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5);">精选食材 · 手工制作</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 20px; color: #e8c468; font-weight: bold;">¥{{PRICE1}}</div>
          <div data-qty="1" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(232,196,104,0.15); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #e8c468; border: 1px solid rgba(232,196,104,0.3);">0</div>
        </div>
      </div>
    </div>
    
    <div data-menu-item="2" style="margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; backdrop-filter: blur(10px);">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">{{DISH2}}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5);">精选食材 · 手工制作</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 20px; color: #e8c468; font-weight: bold;">¥{{PRICE2}}</div>
          <div data-qty="2" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(232,196,104,0.15); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #e8c468; border: 1px solid rgba(232,196,104,0.3);">0</div>
        </div>
      </div>
    </div>
    
    <div data-menu-item="3" style="margin-bottom: 16px; padding: 16px; background: rgba(255,255,255,0.05); border-radius: 12px; cursor: pointer; transition: all 0.3s; border: 2px solid transparent; backdrop-filter: blur(10px);">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 6px;">{{DISH3}}</div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5);">精选食材 · 手工制作</div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="font-size: 20px; color: #e8c468; font-weight: bold;">¥{{PRICE3}}</div>
          <div data-qty="3" style="width: 32px; height: 32px; border-radius: 8px; background: rgba(232,196,104,0.15); display: flex; align-items: center; justify-content: center; font-size: 15px; font-weight: bold; color: #e8c468; border: 1px solid rgba(232,196,104,0.3);">0</div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 底部合计 -->
  <div style="background: rgba(0,0,0,0.3); padding: 20px; border-top: 1px solid rgba(232,196,104,0.2);">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 15px; color: rgba(255,255,255,0.7); letter-spacing: 1px;">TOTAL</div>
      <div data-total style="font-size: 32px; color: #e8c468; font-weight: bold; text-shadow: 0 2px 8px rgba(232,196,104,0.3);">¥0</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'group_chat',
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
  },
  
  {
    id: 'private_chat',
    name: '私聊记录',
    keywords: ['私聊', '聊天截图', '对话记录'],
    fields: [
      { key: 'CONTACT_NAME', label: '对方昵称', placeholder: '小美' },
      { key: 'MSG1_SENDER', label: '消息1发送者', placeholder: '我' },
      { key: 'MSG1_CONTENT', label: '消息1内容', placeholder: '在吗' },
      { key: 'MSG2_SENDER', label: '消息2发送者', placeholder: '小美' },
      { key: 'MSG2_CONTENT', label: '消息2内容', placeholder: '在呢' },
      { key: 'MSG3_SENDER', label: '消息3发送者', placeholder: '我' },
      { key: 'MSG3_CONTENT', label: '消息3内容', placeholder: '干嘛呢' },
      { key: 'MSG4_SENDER', label: '消息4发送者', placeholder: '小美' },
      { key: 'MSG4_CONTENT', label: '消息4内容', placeholder: '看电视' },
      { key: 'MSG5_SENDER', label: '消息5发送者', placeholder: '小美' },
      { key: 'MSG5_CONTENT', label: '消息5内容', placeholder: '好看吗' },
      { key: 'MSG6_SENDER', label: '消息6发送者', placeholder: '我' },
      { key: 'MSG6_CONTENT', label: '消息6内容', placeholder: '还行' },
      { key: 'MSG7_SENDER', label: '消息7发送者', placeholder: '我' },
      { key: 'MSG7_CONTENT', label: '消息7内容', placeholder: '什么剧' },
      { key: 'MSG8_SENDER', label: '消息8发送者', placeholder: '小美' },
      { key: 'MSG8_CONTENT', label: '消息8内容', placeholder: '悬疑剧' },
      { key: 'MSG9_SENDER', label: '消息9发送者', placeholder: '我' },
      { key: 'MSG9_CONTENT', label: '消息9内容', placeholder: '推荐吗' },
      { key: 'MSG10_SENDER', label: '消息10发送者', placeholder: '小美' },
      { key: 'MSG10_CONTENT', label: '消息10内容', placeholder: '值得看' },
      { key: 'TIME', label: '时间', placeholder: '15:20' },
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
      <span style="font-size: 15px; font-weight: 600; color: #000;">{{CONTACT_NAME}}</span>
    </div>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  </div>
  
  <!-- 聊天内容区 -->
  <div style="background: #f7f7f7; padding: 12px; min-height: 200px; max-height: 300px; overflow-y: auto;">
    <!-- 时间提示 -->
    <div style="text-align: center; margin: 8px 0 12px 0;">
      <span style="background: rgba(0,0,0,0.08); color: #888; font-size: 11px; padding: 3px 10px; border-radius: 10px;">{{TIME}}</span>
    </div>
    
    <!-- 动态消息列表 -->
    {{PRIVATE_CHAT_MESSAGES}}
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
    <div style="flex: 1; background: #fff; border-radius: 6px; padding: 7px 12px; font-size: 13px; color: #999;">{{CONTACT_NAME}}</div>
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
  },
  
  {
    id: 'memo',
    name: '备忘录',
    keywords: ['备忘录', '待办', '提醒', '记事'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '今日待办' },
      { key: 'ITEM1', label: '事项1', placeholder: '买菜' },
      { key: 'ITEM2', label: '事项2', placeholder: '开会' },
      { key: 'ITEM3', label: '事项3', placeholder: '健身' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
    ],
    htmlTemplate: `
<div data-memo style="max-width: 350px; margin: 0 auto; background: #fff9e6; padding: 22px; border-radius: 10px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-family: -apple-system, 'PingFang SC', sans-serif; border-top: 6px solid #f59e0b;">
  <!-- 标题区 -->
  <div style="margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid #fcd34d;">
    <div style="font-size: 20px; color: #1f2937; font-weight: 700; margin-bottom: 6px;">{{TITLE}}</div>
    <div style="font-size: 12px; color: #9ca3af;">{{DATE}}</div>
  </div>
  
  <!-- 待办列表 -->
  <div>
    <div data-todo-item="1" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="1" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="1" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM1}}</span>
    </div>
    
    <div data-todo-item="2" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="2" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="2" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM2}}</span>
    </div>
    
    <div data-todo-item="3" style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 12px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.2s; border: 1px solid #fde68a;">
      <div data-checkbox="3" style="width: 22px; height: 22px; border-radius: 6px; border: 2px solid #d1d5db; flex-shrink: 0; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <span data-text="3" style="font-size: 15px; color: #374151; transition: all 0.2s;">{{ITEM3}}</span>
    </div>
  </div>
  
  <!-- 进度条 -->
  <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #fbbf24;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <div style="font-size: 12px; color: #6b7280;">完成进度</div>
      <div data-progress-text style="font-size: 12px; font-weight: 600; color: #f59e0b;">0/3</div>
    </div>
    <div style="height: 6px; background: #fef3c7; border-radius: 3px; overflow: hidden;">
      <div data-progress-bar style="height: 100%; width: 0%; background: #f59e0b; transition: width 0.3s;"></div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'scratch_card',
    name: '刮刮乐',
    keywords: ['刮刮乐', '刮奖', '刮卡', '幸运'],
    fields: [
      { key: 'PRIZE', label: '奖品', placeholder: '一等奖' },
      { key: 'AMOUNT', label: '金额', placeholder: '100' },
      { key: 'CODE', label: '兑奖码', placeholder: 'LK2025' },
    ],
    htmlTemplate: `
<div data-scratch-card style="max-width: 340px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部标题 -->
  <div style="text-align: center; margin-bottom: 20px;">
    <div style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 5px;">刮刮乐</div>
    <div style="font-size: 12px; color: #999;">刮开涂层查看奖品</div>
  </div>
  
  <!-- 刮奖区域 -->
  <div style="position: relative; background: #f8f8f8; border-radius: 8px; overflow: hidden; border: 2px solid #e5e5e5;">
    <!-- 奖品内容（底层） -->
    <div data-prize-content style="padding: 50px 30px; text-align: center;">
      <div style="font-size: 28px; font-weight: bold; color: #ff6b6b; margin-bottom: 12px;">{{PRIZE}}</div>
      <div style="font-size: 42px; font-weight: bold; color: #ff4444; margin-bottom: 16px;">¥{{AMOUNT}}</div>
      <div style="font-size: 13px; color: #666; padding: 10px; background: white; border-radius: 6px; margin-top: 12px;">
        <div style="font-size: 11px; margin-bottom: 4px; color: #999;">兑奖码</div>
        <div style="font-weight: 600; letter-spacing: 2px; color: #333;">{{CODE}}</div>
      </div>
    </div>
    
    <!-- Canvas刮层（顶层覆盖） -->
    <canvas 
      data-scratch-canvas
      width="280" 
      height="200"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair;"
    ></canvas>
  </div>
  
  <!-- 底部提示 -->
  <div style="text-align: center; margin-top: 16px; font-size: 11px; color: #999;">
    刮开30%自动显示全部内容
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'love_letter',
    name: '情书',
    keywords: ['情书', '告白', '表白', '喜欢你'],
    fields: [
      { key: 'TO_NAME', label: '收信人', placeholder: '亲爱的你' },
      { key: 'CONTENT', label: '内容', placeholder: '遇见你是我最美的意外' },
      { key: 'FROM_NAME', label: '寄信人', placeholder: '想你的人' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.21' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #fff5f7; padding: 30px 25px; border-radius: 8px; box-shadow: 0 4px 20px rgba(255, 192, 203, 0.3); font-family: 'Georgia', 'Noto Serif SC', serif; position: relative;">
  <!-- 信纸纹理 -->
  <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: repeating-linear-gradient(0deg, transparent, transparent 29px, rgba(255,192,203,0.1) 29px, rgba(255,192,203,0.1) 30px); pointer-events: none; border-radius: 8px;"></div>
  
  <!-- 装饰线条 -->
  <div style="position: absolute; top: 15px; right: 15px; width: 30px; height: 30px; border: 2px solid rgba(213, 0, 109, 0.2); border-radius: 50%;"></div>
  <div style="position: absolute; bottom: 15px; left: 15px; width: 25px; height: 25px; border: 2px solid rgba(213, 0, 109, 0.15); border-radius: 50%;"></div>
  
  <!-- 内容 -->
  <div style="position: relative; z-index: 1;">
    <div style="text-align: right; font-size: 14px; color: #999; margin-bottom: 20px; font-style: italic;">{{DATE}}</div>
    
    <div style="font-size: 16px; color: #d5006d; margin-bottom: 16px; font-weight: 500;">致 {{TO_NAME}}：</div>
    
    <div style="font-size: 15px; line-height: 2; color: #333; text-indent: 2em; margin: 20px 0; min-height: 100px; white-space: pre-wrap;">{{CONTENT}}</div>
    
    <div style="text-align: right; margin-top: 30px;">
      <div style="font-size: 14px; color: #666; margin-bottom: 8px;">—— {{FROM_NAME}}</div>
      <div style="width: 40px; height: 2px; background: #d5006d; margin: 0 auto;"></div>
    </div>
  </div>
</div>
    `.trim()
  },

  // 新增精致模板
  {
    id: 'movie_ticket',
    name: '电影票',
    keywords: ['电影票', '看电影', '电影院', '观影'],
    fields: [
      { key: 'MOVIE_NAME', label: '电影名', placeholder: '流浪地球3' },
      { key: 'CINEMA', label: '影院', placeholder: '万达影城' },
      { key: 'HALL', label: '影厅', placeholder: '7号厅' },
      { key: 'SEAT', label: '座位', placeholder: '5排8座' },
      { key: 'DATE', label: '日期', placeholder: '2025-11-21' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'PRICE', label: '价格', placeholder: '45' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部区域 -->
  <div style="background: rgba(255,255,255,0.1); padding: 20px; border-bottom: 2px dashed rgba(255,255,255,0.3);">
    <div style="color: white; text-align: center;">
      <div style="font-size: 11px; opacity: 0.8; margin-bottom: 8px; letter-spacing: 1px;">CINEMA TICKET</div>
      <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: bold; line-height: 1.3;">{{MOVIE_NAME}}</h2>
      <div style="font-size: 13px; opacity: 0.9;">{{CINEMA}}</div>
    </div>
  </div>
  
  <!-- 信息区域 -->
  <div style="padding: 20px; color: white;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">放映厅</div>
        <div style="font-size: 16px; font-weight: 600;">{{HALL}}</div>
      </div>
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">座位号</div>
        <div style="font-size: 16px; font-weight: 600;">{{SEAT}}</div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 15px; margin-bottom: 15px;">
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">放映时间</div>
        <div style="font-size: 14px; font-weight: 500;">{{DATE}} {{TIME}}</div>
      </div>
      <div>
        <div style="font-size: 11px; opacity: 0.7; margin-bottom: 4px;">票价</div>
        <div style="font-size: 16px; font-weight: 600; color: #ffd700;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部条形码 -->
  <div style="background: white; padding: 15px; text-align: center;">
    <div style="display: flex; justify-content: center; gap: 2px; margin-bottom: 8px;">
      ${Array(20).fill(0).map((_, i) => `<div style="width: 3px; height: ${15 + Math.random() * 20}px; background: #333;"></div>`).join('')}
    </div>
    <div style="font-size: 10px; color: #666; letter-spacing: 2px; font-family: 'Courier New', monospace;">{{TICKET_NO}}</div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'train_ticket',
    name: '火车票',
    keywords: ['火车票', '高铁票', '动车票', '车票'],
    fields: [
      { key: 'TRAIN_NO', label: '车次', placeholder: 'G1234' },
      { key: 'FROM_STATION', label: '始发站', placeholder: '北京南' },
      { key: 'TO_STATION', label: '到达站', placeholder: '上海虹桥' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'TIME', label: '发车时间', placeholder: '08:30' },
      { key: 'SEAT', label: '座位', placeholder: '06车12A号' },
      { key: 'PRICE', label: '票价', placeholder: '553' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: white; border: 3px solid #003d82; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,61,130,0.2); font-family: 'SimHei', 'Microsoft YaHei', sans-serif;">
  <!-- 顶部蓝条 -->
  <div style="background: #003d82; color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold; letter-spacing: 2px;">中国铁路</div>
    <div style="font-size: 13px; opacity: 0.9;">电子客票</div>
  </div>
  
  <!-- 主要信息区 -->
  <div style="padding: 20px;">
    <!-- 车次和日期 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #f0f0f0;">
      <div>
        <div style="font-size: 28px; font-weight: bold; color: #003d82;">{{TRAIN_NO}}</div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">高速动车组</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 14px; color: #333; font-weight: 500;">{{DATE}}</div>
        <div style="font-size: 12px; color: #666; margin-top: 2px;">{{TIME}}开</div>
      </div>
    </div>
    
    <!-- 站点信息 -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <div style="flex: 1;">
        <div style="font-size: 24px; font-weight: bold; color: #000;">{{FROM_STATION}}</div>
      </div>
      <div style="flex: 0 0 60px; text-align: center;">
        <svg width="60" height="20" viewBox="0 0 60 20" style="display: block;">
          <path d="M5 10 L55 10" stroke="#003d82" stroke-width="2" fill="none"/>
          <path d="M55 10 L50 7 M55 10 L50 13" stroke="#003d82" stroke-width="2" fill="none"/>
        </svg>
      </div>
      <div style="flex: 1; text-align: right;">
        <div style="font-size: 24px; font-weight: bold; color: #000;">{{TO_STATION}}</div>
      </div>
    </div>
    
    <!-- 座位和票价 -->
    <div style="display: flex; justify-content: space-between; padding: 15px; background: #f8f9fa; border-radius: 8px;">
      <div>
        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">座位号</div>
        <div style="font-size: 18px; font-weight: bold; color: #003d82;">{{SEAT}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #666; margin-bottom: 4px;">票价</div>
        <div style="font-size: 20px; font-weight: bold; color: #e63946;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f0f4f8; padding: 10px 20px; font-size: 11px; color: #666; text-align: center; border-top: 1px dashed #ddd;">
    请提前到站 · 对号入座 · 保管好车票
  </div>
</div>
    `.trim()
  },

  {
    id: 'express_package',
    name: '快递单',
    keywords: ['快递单', '快递', '包裹', '物流单'],
    fields: [
      { key: 'EXPRESS_NO', label: '快递单号', placeholder: 'SF1234567890' },
      { key: 'COMPANY', label: '快递公司', placeholder: '顺丰速运' },
      { key: 'FROM_NAME', label: '寄件人', placeholder: '张三' },
      { key: 'FROM_ADDRESS', label: '寄件地址', placeholder: '北京市朝阳区' },
      { key: 'TO_NAME', label: '收件人', placeholder: '李四' },
      { key: 'TO_ADDRESS', label: '收件地址', placeholder: '上海市浦东新区' },
      { key: 'GOODS', label: '物品', placeholder: '文件' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border: 2px solid #000; font-family: -apple-system, 'PingFang SC', sans-serif; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
  <!-- 顶部公司条 -->
  <div style="background: #000; color: white; padding: 12px 15px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold;">{{COMPANY}}</div>
    <div style="font-size: 11px; opacity: 0.8;">EXPRESS</div>
  </div>
  
  <!-- 快递单号 -->
  <div style="background: #fff3cd; padding: 12px 15px; border-bottom: 2px dashed #000;">
    <div style="font-size: 10px; color: #666; margin-bottom: 4px;">快递单号</div>
    <div style="font-size: 16px; font-weight: bold; font-family: 'Courier New', monospace; letter-spacing: 1px;">{{EXPRESS_NO}}</div>
  </div>
  
  <!-- 收寄件信息 -->
  <div style="padding: 15px;">
    <!-- 收件人 -->
    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 6px; height: 18px; background: #000; border-radius: 2px;"></div>
        <div style="font-size: 13px; font-weight: bold;">收件人</div>
      </div>
      <div style="padding-left: 14px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px; color: #000;">{{TO_NAME}}</div>
        <div style="font-size: 13px; color: #666; line-height: 1.5;">{{TO_ADDRESS}}</div>
      </div>
    </div>
    
    <!-- 寄件人 -->
    <div style="margin-bottom: 15px;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
        <div style="width: 6px; height: 18px; background: #666; border-radius: 2px;"></div>
        <div style="font-size: 13px; font-weight: bold; color: #666;">寄件人</div>
      </div>
      <div style="padding-left: 14px;">
        <div style="font-size: 14px; font-weight: 500; margin-bottom: 4px;">{{FROM_NAME}}</div>
        <div style="font-size: 12px; color: #999; line-height: 1.5;">{{FROM_ADDRESS}}</div>
      </div>
    </div>
    
    <!-- 物品信息 -->
    <div style="background: #f8f9fa; padding: 10px; border-radius: 6px;">
      <div style="font-size: 11px; color: #666; margin-bottom: 4px;">物品</div>
      <div style="font-size: 14px; font-weight: 500;">{{GOODS}}</div>
    </div>
  </div>
  
  <!-- 底部条形码 -->
  <div style="border-top: 2px dashed #000; padding: 12px 15px; text-align: center;">
    <div style="display: flex; justify-content: center; gap: 1px; margin-bottom: 6px;">
      ${Array(25).fill(0).map((_, i) => `<div style="width: 2px; height: ${12 + Math.random() * 15}px; background: #000;"></div>`).join('')}
    </div>
    <div style="font-size: 9px; color: #999; font-family: 'Courier New', monospace; letter-spacing: 1px;">{{EXPRESS_NO}}</div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'postcard',
    name: '明信片',
    keywords: ['明信片', '寄明信片', '风景明信片'],
    fields: [
      { key: 'PLACE', label: '地点', placeholder: '巴黎铁塔' },
      { key: 'MESSAGE', label: '留言', placeholder: '这里的风景真美' },
      { key: 'FROM_NAME', label: '寄信人', placeholder: '小明' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.21' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: #faf8f3; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.15); font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 图片区域 -->
  <div style="height: 200px; background: #667eea; position: relative; overflow: hidden;">
    <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.1);"></div>
    <div style="position: absolute; bottom: 20px; left: 20px; color: white;">
      <div style="font-size: 26px; font-weight: bold; text-shadow: 0 2px 10px rgba(0,0,0,0.3); letter-spacing: 1px;">{{PLACE}}</div>
    </div>
    <!-- 装饰圆点 -->
    <div style="position: absolute; top: 30px; right: 40px; width: 60px; height: 60px; border-radius: 50%; background: rgba(255,255,255,0.2);"></div>
    <div style="position: absolute; bottom: 50px; right: 20px; width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.15);"></div>
  </div>
  
  <!-- 内容区域 -->
  <div style="padding: 25px;">
    <div style="font-size: 15px; line-height: 1.8; color: #333; margin-bottom: 20px; min-height: 80px; white-space: pre-wrap;">{{MESSAGE}}</div>
    
    <div style="border-top: 1px solid #e0d5c7; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 14px; color: #666; font-style: italic;">From {{FROM_NAME}}</div>
      <div style="font-size: 12px; color: #999;">{{DATE}}</div>
    </div>
  </div>
  
  <!-- 邮戳装饰 -->
  <div style="position: absolute; top: 165px; right: 15px; width: 50px; height: 50px; border: 3px solid rgba(139,69,19,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(250,248,243,0.8);">
    <div style="text-align: center; font-size: 9px; color: #8b4513; font-weight: bold;">
      <div>POST</div>
      <div>{{DATE}}</div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'birthday_card',
    name: '生日贺卡',
    keywords: ['生日贺卡', '生日快乐', '生日祝福', '贺卡'],
    fields: [
      { key: 'TO_NAME', label: '收卡人', placeholder: '小红' },
      { key: 'MESSAGE', label: '祝福语', placeholder: '祝你生日快乐，心想事成' },
      { key: 'FROM_NAME', label: '送卡人', placeholder: '你的朋友' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: #ffeaa7; border-radius: 20px; padding: 30px 25px; box-shadow: 0 10px 30px rgba(253,203,110,0.4); position: relative; overflow: hidden; font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 装饰彩带 -->
  <div style="position: absolute; top: -10px; left: -10px; width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; transform: rotate(45deg);"></div>
  <div style="position: absolute; bottom: -15px; right: -15px; width: 100px; height: 100px; background: rgba(255,255,255,0.15); border-radius: 50%;"></div>
  
  <div style="position: relative; z-index: 1;">
    <!-- 标题 -->
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="font-size: 32px; font-weight: bold; color: #d63031; text-shadow: 2px 2px 4px rgba(0,0,0,0.1); margin-bottom: 10px;">生日快乐</div>
      <div style="font-size: 18px; color: #2d3436; font-weight: 500;">Dear {{TO_NAME}}</div>
    </div>
    
    <!-- 祝福内容 -->
    <div style="background: rgba(255,255,255,0.6); padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px dashed rgba(214,48,49,0.3);">
      <p style="margin: 0; font-size: 16px; line-height: 1.8; color: #2d3436; text-align: center; white-space: pre-wrap;">{{MESSAGE}}</p>
    </div>
    
    <!-- 装饰蜡烛 -->
    <div style="display: flex; justify-content: center; gap: 12px; margin: 20px 0;">
      ${Array(5).fill(0).map((_, i) => `
        <div style="width: 8px; height: 35px; background: #e74c3c; border-radius: 4px 4px 0 0; position: relative;">
          <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%); width: 10px; height: 12px; background: #f39c12; border-radius: 50% 50% 0 0;"></div>
        </div>
      `).join('')}
    </div>
    
    <!-- 落款 -->
    <div style="text-align: right; font-size: 14px; color: #636e72; font-style: italic; margin-top: 25px;">
      —— {{FROM_NAME}}
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'boarding_pass',
    name: '登机牌',
    keywords: ['登机牌', '机票', '航班', '飞机票'],
    fields: [
      { key: 'PASSENGER', label: '乘客姓名', placeholder: '张三' },
      { key: 'FLIGHT', label: '航班号', placeholder: 'CA1234' },
      { key: 'FROM', label: '出发地', placeholder: '北京首都' },
      { key: 'TO', label: '目的地', placeholder: '上海虹桥' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '起飞时间', placeholder: '14:30' },
      { key: 'GATE', label: '登机口', placeholder: 'A12' },
      { key: 'SEAT', label: '座位号', placeholder: '32F' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部航空公司条 -->
  <div style="background: #0066cc; color: white; padding: 12px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-size: 18px; font-weight: bold;">✈ 航空公司</div>
    <div style="font-size: 12px; opacity: 0.9;">BOARDING PASS</div>
  </div>
  
  <!-- 主要信息区 -->
  <div style="padding: 24px 20px;">
    <!-- 乘客信息 -->
    <div style="margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #ddd;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">乘客姓名 PASSENGER</div>
      <div style="font-size: 20px; font-weight: bold; color: #333;">{{PASSENGER}}</div>
    </div>
    
    <!-- 航班信息 -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <div style="flex: 1;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">出发 FROM</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{FROM}}</div>
      </div>
      <div style="font-size: 24px; color: #0066cc;">→</div>
      <div style="flex: 1; text-align: right;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">到达 TO</div>
        <div style="font-size: 18px; font-weight: bold; color: #333;">{{TO}}</div>
      </div>
    </div>
    
    <!-- 详细信息 -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; background: #f8f9fa; padding: 16px; border-radius: 8px;">
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">航班 FLIGHT</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{FLIGHT}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">日期 DATE</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{DATE}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">起飞 TIME</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{TIME}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">登机口 GATE</div>
        <div style="font-size: 16px; font-weight: 600; color: #0066cc;">{{GATE}}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">座位 SEAT</div>
        <div style="font-size: 16px; font-weight: 600; color: #333;">{{SEAT}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部二维码 -->
  <div style="background: #f8f9fa; padding: 16px 20px; text-align: center; border-top: 2px dashed #ddd;">
    <div style="width: 80px; height: 80px; background: #000; margin: 0 auto; border-radius: 4px; display: flex; align-items: center; justify-content: center;">
      <div style="width: 60px; height: 60px; background: white; border: 8px solid #000; box-sizing: border-box;"></div>
    </div>
    <div style="font-size: 10px; color: #999; margin-top: 8px;">请于起飞前45分钟到达登机口</div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'concert_ticket',
    name: '演唱会门票',
    keywords: ['演唱会', '门票', '演出票', '音乐会'],
    fields: [
      { key: 'ARTIST', label: '演出艺人', placeholder: '周杰伦' },
      { key: 'TITLE', label: '演唱会名称', placeholder: '地表最强演唱会' },
      { key: 'VENUE', label: '场馆', placeholder: '鸟巢体育场' },
      { key: 'DATE', label: '日期', placeholder: '2025-05-20' },
      { key: 'TIME', label: '时间', placeholder: '19:30' },
      { key: 'SEAT', label: '座位', placeholder: 'A区10排15座' },
      { key: 'PRICE', label: '票价', placeholder: '880' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.3); font-family: -apple-system, 'PingFang SC', sans-serif; position: relative;">
  <!-- 背景装饰 -->
  <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,107,107,0.1); border-radius: 50%; filter: blur(40px);"></div>
  <div style="position: absolute; bottom: -50px; left: -50px; width: 150px; height: 150px; background: rgba(107,107,255,0.1); border-radius: 50%; filter: blur(40px);"></div>
  
  <div style="position: relative; z-index: 1; padding: 30px 24px;">
    <!-- 顶部标签 -->
    <div style="display: inline-block; background: #ff6b6b; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-bottom: 16px;">LIVE CONCERT</div>
    
    <!-- 艺人名称 -->
    <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 8px;">{{ARTIST}}</div>
    <div style="font-size: 16px; color: rgba(255,255,255,0.7); margin-bottom: 24px;">{{TITLE}}</div>
    
    <!-- 演出信息 -->
    <div style="background: rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; margin-bottom: 20px; backdrop-filter: blur(10px);">
      <div style="margin-bottom: 16px;">
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">场馆 VENUE</div>
        <div style="font-size: 16px; color: white; font-weight: 500;">{{VENUE}}</div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">日期 DATE</div>
          <div style="font-size: 14px; color: white; font-weight: 500;">{{DATE}}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">时间 TIME</div>
          <div style="font-size: 14px; color: white; font-weight: 500;">{{TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 座位和价格 -->
    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.2);">
      <div>
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">座位 SEAT</div>
        <div style="font-size: 16px; color: white; font-weight: 600;">{{SEAT}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 4px;">票价 PRICE</div>
        <div style="font-size: 20px; color: #ff6b6b; font-weight: bold;">¥{{PRICE}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'coupon',
    name: '优惠券',
    keywords: ['优惠券', '折扣券', '代金券', '券'],
    fields: [
      { key: 'TITLE', label: '优惠标题', placeholder: '满100减50' },
      { key: 'AMOUNT', label: '优惠金额', placeholder: '50' },
      { key: 'CONDITION', label: '使用条件', placeholder: '满100元可用' },
      { key: 'EXPIRE_DATE', label: '过期日期', placeholder: '2025-12-31' },
      { key: 'CODE', label: '券码', placeholder: 'SAVE50' },
    ],
    htmlTemplate: `
<div data-coupon style="max-width: 360px; margin: 0 auto; background: white; position: relative; font-family: -apple-system, 'PingFang SC', sans-serif; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
  <!-- 左侧主体 -->
  <div style="display: flex; border-radius: 12px 0 0 12px; overflow: hidden;">
    <div style="flex: 1; background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%); padding: 24px; color: white; position: relative;">
      <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">优惠</div>
      <div style="font-size: 48px; font-weight: bold; line-height: 1; margin-bottom: 8px;">¥{{AMOUNT}}</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 16px;">{{TITLE}}</div>
      <div style="font-size: 12px; opacity: 0.8;">{{CONDITION}}</div>
      
      <!-- 倒计时 -->
      <div data-countdown style="position: absolute; bottom: 16px; left: 24px; font-size: 12px; opacity: 0.9;">
        剩余: <span data-days>--</span>天 <span data-hours>--</span>时 <span data-minutes>--</span>分
      </div>
    </div>
    
    <!-- 右侧操作区 -->
    <div style="width: 100px; background: white; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; border-left: 2px dashed #ff6b6b; position: relative;">
      <div style="position: absolute; top: -10px; left: -11px; width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%;"></div>
      <div style="position: absolute; bottom: -10px; left: -11px; width: 20px; height: 20px; background: #f5f5f5; border-radius: 50%;"></div>
      
      <div data-use-btn style="writing-mode: vertical-rl; font-size: 16px; font-weight: bold; color: #ff6b6b; cursor: pointer; user-select: none; transition: transform 0.2s;">立即使用</div>
      
      <div style="margin-top: 20px; font-size: 10px; color: #999; writing-mode: vertical-rl;">{{CODE}}</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'business_card',
    name: '名片',
    keywords: ['名片', '联系方式', '个人信息'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'TITLE', label: '职位', placeholder: '产品经理' },
      { key: 'COMPANY', label: '公司', placeholder: '某某科技有限公司' },
      { key: 'PHONE', label: '电话', placeholder: '138-0000-0000' },
      { key: 'EMAIL', label: '邮箱', placeholder: 'zhangsan@example.com' },
      { key: 'ADDRESS', label: '地址', placeholder: '北京市朝阳区' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; overflow: hidden; box-shadow: 0 8px 24px rgba(102,126,234,0.25); font-family: -apple-system, 'PingFang SC', sans-serif; position: relative;">
  <!-- 背景装饰 -->
  <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
  <div style="position: absolute; bottom: -30px; left: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.08); border-radius: 50%;"></div>
  
  <div style="padding: 32px 24px; position: relative; z-index: 1;">
    <!-- 个人信息 -->
    <div style="margin-bottom: 28px;">
      <div style="font-size: 28px; font-weight: bold; color: white; margin-bottom: 8px; letter-spacing: 0.5px;">{{NAME}}</div>
      <div style="font-size: 15px; color: rgba(255,255,255,0.9); margin-bottom: 6px;">{{TITLE}}</div>
      <div style="font-size: 13px; color: rgba(255,255,255,0.75);">{{COMPANY}}</div>
    </div>
    
    <!-- 联系方式 -->
    <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); border-radius: 10px; padding: 18px 16px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">Tel</div>
        <div style="font-size: 14px; color: white; font-family: 'Courier New', monospace;">{{PHONE}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">@</div>
        <div style="font-size: 13px; color: white;">{{EMAIL}}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 32px; height: 32px; background: rgba(255,255,255,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 13px; color: white;">Loc</div>
        <div style="font-size: 13px; color: white;">{{ADDRESS}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'parking_ticket',
    name: '停车票',
    keywords: ['停车票', '停车', '停车费', '停车凭证'],
    fields: [
      { key: 'PLATE', label: '车牌号', placeholder: '京A12345' },
      { key: 'LOCATION', label: '停车场', placeholder: '万达广场地下停车场' },
      { key: 'ENTER_TIME', label: '入场时间', placeholder: '2025-01-15 14:30' },
      { key: 'EXIT_TIME', label: '出场时间', placeholder: '2025-01-15 17:45' },
      { key: 'DURATION', label: '停车时长', placeholder: '3小时15分' },
      { key: 'FEE', label: '停车费', placeholder: '20' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif; border: 2px solid #f39c12;">
  <!-- 顶部标题栏 -->
  <div style="background: #f39c12; color: white; padding: 14px 20px; text-align: center;">
    <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">停车凭证</div>
    <div style="font-size: 11px; opacity: 0.9;">PARKING TICKET</div>
  </div>
  
  <!-- 主要信息 -->
  <div style="padding: 20px;">
    <!-- 车牌号 -->
    <div style="text-align: center; margin-bottom: 20px; padding: 12px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">车牌号码</div>
      <div style="font-size: 28px; font-weight: bold; color: #2d3436; letter-spacing: 3px;">{{PLATE}}</div>
    </div>
    
    <!-- 停车场位置 -->
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; color: #999; margin-bottom: 4px;">停车场地点</div>
      <div style="font-size: 15px; color: #2d3436; font-weight: 500;">{{LOCATION}}</div>
    </div>
    
    <!-- 时间信息 -->
    <div style="background: #f8f9fa; padding: 14px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">入场时间</div>
          <div style="font-size: 13px; color: #2d3436; font-weight: 500;">{{ENTER_TIME}}</div>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">出场时间</div>
          <div style="font-size: 13px; color: #2d3436; font-weight: 500;">{{EXIT_TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 费用信息 -->
    <div style="border-top: 2px dashed #ddd; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">停车时长</div>
        <div style="font-size: 16px; color: #2d3436; font-weight: 600;">{{DURATION}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; color: #999; margin-bottom: 4px;">应付金额</div>
        <div style="font-size: 26px; color: #f39c12; font-weight: bold;">¥{{FEE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f8f9fa; padding: 10px 20px; text-align: center; font-size: 10px; color: #999;">
    请妥善保管此凭证，出场时出示
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'hospital_registration',
    name: '挂号单',
    keywords: ['挂号单', '挂号', '就诊', '医院'],
    fields: [
      { key: 'PATIENT', label: '患者姓名', placeholder: '张三' },
      { key: 'HOSPITAL', label: '医院名称', placeholder: '市人民医院' },
      { key: 'DEPARTMENT', label: '就诊科室', placeholder: '内科' },
      { key: 'DOCTOR', label: '医生', placeholder: '李医生' },
      { key: 'DATE', label: '就诊日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '就诊时间', placeholder: '上午 09:30' },
      { key: 'NUMBER', label: '挂号序号', placeholder: '15' },
      { key: 'FEE', label: '挂号费', placeholder: '5' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif; border: 2px solid #00b894;">
  <!-- 顶部医院信息 -->
  <div style="background: #00b894; color: white; padding: 16px 20px;">
    <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">{{HOSPITAL}}</div>
    <div style="font-size: 12px; opacity: 0.9;">门诊挂号单</div>
  </div>
  
  <!-- 主要信息 -->
  <div style="padding: 20px;">
    <!-- 患者信息 -->
    <div style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 2px dashed #ddd;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">患者姓名</div>
      <div style="font-size: 20px; font-weight: bold; color: #2d3436;">{{PATIENT}}</div>
    </div>
    
    <!-- 就诊信息 -->
    <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊科室</div>
        <div style="font-size: 16px; color: #2d3436; font-weight: 600;">{{DEPARTMENT}}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">接诊医生</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 500;">{{DOCTOR}}</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊日期</div>
          <div style="font-size: 14px; color: #2d3436; font-weight: 500;">{{DATE}}</div>
        </div>
        <div>
          <div style="font-size: 11px; color: #999; margin-bottom: 4px;">就诊时间</div>
          <div style="font-size: 14px; color: #2d3436; font-weight: 500;">{{TIME}}</div>
        </div>
      </div>
    </div>
    
    <!-- 序号和费用 -->
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">挂号序号</div>
        <div style="font-size: 32px; color: #00b894; font-weight: bold;">{{NUMBER}}</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 11px; color: #999; margin-bottom: 4px;">挂号费用</div>
        <div style="font-size: 22px; color: #e74c3c; font-weight: bold;">¥{{FEE}}</div>
      </div>
    </div>
  </div>
  
  <!-- 底部提示 -->
  <div style="background: #f8f9fa; padding: 10px 20px; text-align: center; font-size: 10px; color: #999;">
    请按时就诊，过号作废
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'leave_request',
    name: '请假条',
    keywords: ['请假条', '请假', '假条', '请假申请'],
    fields: [
      { key: 'TO', label: '收件人', placeholder: '王老师' },
      { key: 'FROM', label: '请假人', placeholder: '张三' },
      { key: 'REASON', label: '请假事由', placeholder: '身体不适，需要就医' },
      { key: 'START_DATE', label: '开始日期', placeholder: '2025-01-15' },
      { key: 'END_DATE', label: '结束日期', placeholder: '2025-01-16' },
      { key: 'DAYS', label: '请假天数', placeholder: '2' },
      { key: 'DATE', label: '申请日期', placeholder: '2025-01-14' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #fff9e6; padding: 28px 24px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.1); font-family: 'Georgia', 'Noto Serif SC', serif; border: 2px solid #f1c40f;">
  <!-- 标题 -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 26px; font-weight: bold; color: #2d3436;">请假条</div>
    <div style="width: 40px; height: 3px; background: #f1c40f; margin: 8px auto 0;"></div>
  </div>
  
  <!-- 称呼 -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 16px; color: #2d3436;">{{TO}}：</div>
  </div>
  
  <!-- 正文 -->
  <div style="background: white; padding: 18px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f1c40f;">
    <div style="font-size: 15px; color: #2d3436; line-height: 1.8; text-indent: 2em;">
      本人因{{REASON}}，特向您请假，请假时间为{{START_DATE}}至{{END_DATE}}，共{{DAYS}}天。请予批准。
    </div>
  </div>
  
  <!-- 落款 -->
  <div style="text-align: right; margin-top: 24px;">
    <div style="font-size: 15px; color: #2d3436; margin-bottom: 8px;">请假人：{{FROM}}</div>
    <div style="font-size: 14px; color: #636e72;">{{DATE}}</div>
  </div>
  
  <!-- 底部印章装饰 -->
  <div style="text-align: right; margin-top: 16px;">
    <div style="display: inline-block; width: 60px; height: 60px; border: 2px solid #e74c3c; border-radius: 50%; color: #e74c3c; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; transform: rotate(-15deg);">同意</div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'certificate',
    name: '证书',
    keywords: ['证书', '奖状', '荣誉证书', '获奖'],
    fields: [
      { key: 'NAME', label: '获奖人', placeholder: '张三' },
      { key: 'TITLE', label: '证书标题', placeholder: '优秀员工奖' },
      { key: 'CONTENT', label: '证书内容', placeholder: '在2024年度工作中表现突出，特发此证，以资鼓励' },
      { key: 'ORGANIZATION', label: '颁发机构', placeholder: '某某公司' },
      { key: 'DATE', label: '颁发日期', placeholder: '2025年1月' },
    ],
    htmlTemplate: `
<div style="max-width: 380px; margin: 0 auto; background: #fff8f0; padding: 32px 28px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: 'Georgia', 'Noto Serif SC', serif; border: 6px solid #d4af37; position: relative;">
  <!-- 装饰角 -->
  <div style="position: absolute; top: 20px; left: 20px; width: 30px; height: 30px; border-top: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
  <div style="position: absolute; top: 20px; right: 20px; width: 30px; height: 30px; border-top: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>
  <div style="position: absolute; bottom: 20px; left: 20px; width: 30px; height: 30px; border-bottom: 3px solid #d4af37; border-left: 3px solid #d4af37;"></div>
  <div style="position: absolute; bottom: 20px; right: 20px; width: 30px; height: 30px; border-bottom: 3px solid #d4af37; border-right: 3px solid #d4af37;"></div>
  
  <!-- 标题 -->
  <div style="text-align: center; margin-bottom: 28px;">
    <div style="font-size: 32px; font-weight: bold; color: #d4af37; letter-spacing: 4px; margin-bottom: 8px;">{{TITLE}}</div>
    <div style="width: 60px; height: 2px; background: #d4af37; margin: 0 auto;"></div>
  </div>
  
  <!-- 获奖人 -->
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="font-size: 14px; color: #999; margin-bottom: 8px;">兹授予</div>
    <div style="font-size: 28px; font-weight: bold; color: #2d3436; border-bottom: 2px solid #d4af37; display: inline-block; padding: 0 20px 4px;">{{NAME}}</div>
  </div>
  
  <!-- 正文 -->
  <div style="text-align: center; padding: 20px; background: white; border-radius: 8px; margin-bottom: 24px;">
    <div style="font-size: 15px; color: #2d3436; line-height: 1.9;">{{CONTENT}}</div>
  </div>
  
  <!-- 底部信息 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 20px;">
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; border: 2px solid #e74c3c; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: bold; color: #e74c3c; margin: 0 auto 8px;">印章</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 15px; color: #2d3436; font-weight: 600; margin-bottom: 6px;">{{ORGANIZATION}}</div>
      <div style="font-size: 13px; color: #636e72;">{{DATE}}</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'sms_screenshot',
    name: '短信截图',
    keywords: ['短信', '验证码', '短信截图', '消息通知'],
    fields: [
      { key: 'SENDER', label: '发送方', placeholder: '10086' },
      { key: 'CONTENT', label: '短信内容', placeholder: '您的验证码是123456，请在5分钟内完成验证' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: #f8f9fa; padding: 16px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.08); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部状态栏 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: white; border-radius: 8px 8px 0 0; font-size: 12px; color: #666;">
    <div>{{TIME}}</div>
    <div>●●●●</div>
  </div>
  
  <!-- 短信内容 -->
  <div style="background: white; padding: 16px; border-radius: 0 0 8px 8px;">
    <!-- 发送方 -->
    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #eee;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #00b894; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
        短
      </div>
      <div>
        <div style="font-size: 16px; font-weight: 600; color: #2d3436;">{{SENDER}}</div>
        <div style="font-size: 12px; color: #999;">短信消息</div>
      </div>
    </div>
    
    <!-- 短信正文 -->
    <div style="background: #f8f9fa; padding: 14px; border-radius: 8px;">
      <div style="font-size: 15px; color: #2d3436; line-height: 1.6; white-space: pre-wrap;">{{CONTENT}}</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'countdown',
    name: '倒计时',
    keywords: ['倒计时', '距离', '还有多久', '天数'],
    fields: [
      { key: 'EVENT', label: '事件名称', placeholder: '同学聚会' },
      { key: 'DAYS', label: '剩余天数', placeholder: '55' },
      { key: 'DATE', label: '目标日期', placeholder: '2025-06-07' },
    ],
    htmlTemplate: `
<div style="max-width: 280px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.15); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部条带 -->
  <div style="background: #5eb5a6; color: white; padding: 10px 16px; font-size: 14px; text-align: center;">
    {{EVENT}} 还有
  </div>
  
  <!-- 大数字区域 -->
  <div style="padding: 40px 20px; text-align: center; background: white;">
    <div style="font-size: 72px; font-weight: bold; color: #2d3436; line-height: 1;">{{DAYS}}</div>
  </div>
  
  <!-- 底部日期 -->
  <div style="background: #e8e8e8; padding: 8px 16px; text-align: center; font-size: 13px; color: #666;">
    {{DATE}}
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'class_schedule',
    name: '课程表',
    keywords: ['课程表', '课表', '上课时间', '课程安排'],
    fields: [
      { key: 'WEEK', label: '星期', placeholder: '星期一' },
      { key: 'CLASS1', label: '第1节', placeholder: '语文' },
      { key: 'CLASS2', label: '第2节', placeholder: '数学' },
      { key: 'CLASS3', label: '第3节', placeholder: '英语' },
      { key: 'CLASS4', label: '第4节', placeholder: '物理' },
      { key: 'CLASS5', label: '第5节', placeholder: '化学' },
      { key: 'CLASS6', label: '第6节', placeholder: '生物' },
      { key: 'CLASS7', label: '第7节', placeholder: '体育' },
      { key: 'CLASS8', label: '第8节', placeholder: '自习' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部标题 -->
  <div style="background: #6c5ce7; color: white; padding: 16px 20px;">
    <div style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 8px;">{{WEEK}} 课程表</div>
    <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; font-size: 11px; opacity: 0.8;">
      <div style="text-align: center;">一</div>
      <div style="text-align: center;">二</div>
      <div style="text-align: center;">三</div>
      <div style="text-align: center;">四</div>
      <div style="text-align: center;">五</div>
      <div style="text-align: center;">六</div>
      <div style="text-align: center;">日</div>
    </div>
  </div>
  
  <!-- 课程列表 -->
  <div style="padding: 14px;">
    <!-- 上午 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">上午</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #5dade2;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第1节 08:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS1}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #52b3d9;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第2节 09:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS2}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #48b9d0;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第3节 10:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS3}}</div>
      </div>
      <div style="padding: 10px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #3ebfc6;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第4节 11:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS4}}</div>
      </div>
    </div>
    
    <!-- 午休 -->
    <div style="text-align: center; padding: 8px; background: #fff8e6; border-radius: 6px; margin-bottom: 12px;">
      <div style="font-size: 12px; color: #e67e22;">午休时间 12:00 - 14:00</div>
    </div>
    
    <!-- 下午 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">下午</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px;">
      <div style="padding: 10px; background: #f0fcf8; border-radius: 6px; border-left: 3px solid #45c5a0;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第5节 14:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS5}}</div>
      </div>
      <div style="padding: 10px; background: #f0fcf8; border-radius: 6px; border-left: 3px solid #3bb894;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第6节 15:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS6}}</div>
      </div>
    </div>
    
    <!-- 晚上 -->
    <div style="font-size: 11px; color: #999; margin: 8px 0 8px 4px; font-weight: 600;">晚上</div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
      <div style="padding: 10px; background: #faf5ff; border-radius: 6px; border-left: 3px solid #9b87d8;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第7节 18:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS7}}</div>
      </div>
      <div style="padding: 10px; background: #faf5ff; border-radius: 6px; border-left: 3px solid #8b7bc5;">
        <div style="font-size: 11px; color: #999; margin-bottom: 2px;">第8节 19:00</div>
        <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CLASS8}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'check_in',
    name: '打卡记录',
    keywords: ['打卡', '签到', '上班打卡', '考勤'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
      { key: 'TIME', label: '打卡时间', placeholder: '09:00:23' },
      { key: 'LOCATION', label: '打卡地点', placeholder: '公司大楼' },
      { key: 'STATUS', label: '状态', placeholder: '正常' },
    ],
    htmlTemplate: `
<div style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部 -->
  <div style="background: #0984e3; color: white; padding: 20px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 8px;">✓</div>
    <div style="font-size: 20px; font-weight: bold;">打卡成功</div>
  </div>
  
  <!-- 内容区 -->
  <div style="padding: 24px;">
    <!-- 姓名 -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 24px; font-weight: bold; color: #2d3436;">{{NAME}}</div>
    </div>
    
    <!-- 打卡信息 -->
    <div style="background: #f8f9fa; padding: 18px; border-radius: 8px; margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 13px; color: #999;">打卡时间</div>
        <div data-time style="font-size: 15px; color: #2d3436; font-weight: 600;">{{TIME}}</div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <div style="font-size: 13px; color: #999;">打卡日期</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 600;">{{DATE}}</div>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <div style="font-size: 13px; color: #999;">打卡地点</div>
        <div style="font-size: 15px; color: #2d3436; font-weight: 600;">{{LOCATION}}</div>
      </div>
    </div>
    
    <!-- 状态 -->
    <div style="text-align: center; padding: 12px; background: #d5f4e6; border-radius: 8px;">
      <div data-status style="font-size: 16px; color: #00b894; font-weight: bold;">{{STATUS}}</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'music_player',
    name: '音乐播放器',
    keywords: ['音乐', '播放器', '正在播放', '歌曲'],
    fields: [
      { key: 'SONG', label: '歌曲名', placeholder: '晴天' },
      { key: 'ARTIST', label: '歌手', placeholder: '周杰伦' },
      { key: 'ALBUM', label: '专辑', placeholder: '叶惠美' },
      { key: 'DURATION', label: '时长', placeholder: '04:28' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 封面区 -->
  <div style="background: #2d3436; padding: 40px; text-align: center;">
    <div style="width: 160px; height: 160px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px; font-weight: 600;">MUSIC</div>
  </div>
  
  <!-- 歌曲信息 -->
  <div style="padding: 24px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 20px; font-weight: bold; color: #2d3436; margin-bottom: 6px;">{{SONG}}</div>
      <div style="font-size: 15px; color: #636e72;">{{ARTIST}}</div>
      <div style="font-size: 13px; color: #999; margin-top: 4px;">{{ALBUM}}</div>
    </div>
    
    <!-- 进度条 -->
    <div style="margin-bottom: 20px;">
      <div style="height: 4px; background: #e5e5e5; border-radius: 2px; overflow: hidden; margin-bottom: 8px;">
        <div style="width: 45%; height: 100%; background: #0984e3;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #999;">
        <div>02:00</div>
        <div>{{DURATION}}</div>
      </div>
    </div>
    
    <!-- 控制按钮 -->
    <div style="display: flex; justify-content: center; align-items: center; gap: 20px;">
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-size: 18px;">⏮</div>
      <div data-play-btn style="width: 56px; height: 56px; border-radius: 50%; background: #0984e3; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; cursor: pointer; transition: transform 0.2s;">▶</div>
      <div style="width: 40px; height: 40px; border-radius: 50%; background: #f8f9fa; display: flex; align-items: center; justify-content: center; font-size: 18px;">⏭</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'call_log',
    name: '通话记录',
    keywords: ['通话记录', '通话', '电话记录', '通话详单'],
    fields: [
      { key: 'NAME', label: '联系人', placeholder: '张三' },
      { key: 'NUMBER', label: '电话号码', placeholder: '138****1234' },
      { key: 'CALL1_TYPE', label: '通话1类型', placeholder: '呼出' },
      { key: 'CALL1_TIME', label: '通话1时间', placeholder: '14:30' },
      { key: 'CALL1_DURATION', label: '通话1时长', placeholder: '5分32秒' },
      { key: 'CALL1_CONTENT', label: '通话1内容', placeholder: '讨论明天的会议安排' },
      { key: 'CALL2_TYPE', label: '通话2类型', placeholder: '呼入' },
      { key: 'CALL2_TIME', label: '通话2时间', placeholder: '11:20' },
      { key: 'CALL2_DURATION', label: '通话2时长', placeholder: '2分15秒' },
      { key: 'CALL2_CONTENT', label: '通话2内容', placeholder: '确认文件是否收到' },
      { key: 'CALL3_TYPE', label: '通话3类型', placeholder: '呼出' },
      { key: 'CALL3_TIME', label: '通话3时间', placeholder: '昨天' },
      { key: 'CALL3_DURATION', label: '通话3时长', placeholder: '15分48秒' },
      { key: 'CALL3_CONTENT', label: '通话3内容', placeholder: '详细沟通项目进度' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部联系人卡片 -->
  <div style="background: #00b894; color: white; padding: 20px;">
    <div style="display: flex; align-items: center; gap: 14px;">
      <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold;">{{NAME_INITIAL}}</div>
      <div>
        <div style="font-size: 20px; font-weight: bold; margin-bottom: 4px;">{{NAME}}</div>
        <div style="font-size: 13px; opacity: 0.9;">{{NUMBER}}</div>
      </div>
    </div>
  </div>
  
  <!-- 通话记录列表 -->
  <div style="padding: 16px;">
    <div style="font-size: 13px; color: #999; margin-bottom: 12px; font-weight: 600;">通话记录</div>
    
    <!-- 记录1 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #00b894;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL1_TYPE}}</div>
          <div style="font-size: 12px; color: #00b894;">{{CALL1_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL1_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL1_CONTENT}}</div>
    </div>
    
    <!-- 记录2 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid #0984e3;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL2_TYPE}}</div>
          <div style="font-size: 12px; color: #0984e3;">{{CALL2_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL2_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL2_CONTENT}}</div>
    </div>
    
    <!-- 记录3 -->
    <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 3px solid #636e72;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <div style="font-size: 14px; font-weight: 600; color: #2d3436;">{{CALL3_TYPE}}</div>
          <div style="font-size: 12px; color: #636e72;">{{CALL3_DURATION}}</div>
        </div>
        <div style="font-size: 12px; color: #999;">{{CALL3_TIME}}</div>
      </div>
      <div style="font-size: 13px; color: #636e72; line-height: 1.4;">{{CALL3_CONTENT}}</div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'shopping_cart',
    name: '购物车',
    keywords: ['购物车', '结算', '购物', '下单'],
    fields: [
      { key: 'ITEM1', label: '商品1', placeholder: 'iPhone 15 Pro' },
      { key: 'PRICE1', label: '价格1', placeholder: '8999' },
      { key: 'ITEM2', label: '商品2', placeholder: 'AirPods Pro' },
      { key: 'PRICE2', label: '价格2', placeholder: '1999' },
      { key: 'ITEM3', label: '商品3', placeholder: 'MacBook保护壳' },
      { key: 'PRICE3', label: '价格3', placeholder: '199' },
      { key: 'TOTAL', label: '总价', placeholder: '11197' },
    ],
    htmlTemplate: `
<div data-shopping-cart style="max-width: 350px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部 -->
  <div style="background: #ff6b6b; color: white; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center;">
    <div>
      <div style="font-size: 18px; font-weight: bold;">购物车</div>
      <div style="font-size: 12px; opacity: 0.9;">共3件商品</div>
    </div>
    <div data-select-all style="font-size: 13px; cursor: pointer; background: rgba(255,255,255,0.2); padding: 6px 12px; border-radius: 16px;">全选</div>
  </div>
  
  <!-- 商品列表 -->
  <div style="padding: 14px;">
    <!-- 商品1 -->
    <div data-item="1" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="1" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM1}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE1}}</div>
    </div>
    
    <!-- 商品2 -->
    <div data-item="2" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="2" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM2}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE2}}</div>
    </div>
    
    <!-- 商品3 -->
    <div data-item="3" style="display: flex; gap: 12px; padding: 12px; background: #f8f9fa; border-radius: 8px; margin-bottom: 14px; cursor: pointer; transition: all 0.2s;">
      <div data-checkbox="3" style="width: 18px; height: 18px; border: 2px solid #ddd; border-radius: 4px; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"></div>
      <div style="flex: 1;">
        <div style="font-size: 15px; font-weight: 600; color: #2d3436; margin-bottom: 4px;">{{ITEM3}}</div>
        <div style="font-size: 13px; color: #999;">数量: 1</div>
      </div>
      <div style="font-size: 16px; font-weight: bold; color: #ff6b6b;">¥{{PRICE3}}</div>
    </div>
  </div>
  
  <!-- 底部结算栏 -->
  <div style="background: #f8f9fa; padding: 14px 20px; border-top: 1px solid #e5e5e5;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <div style="font-size: 14px; color: #636e72;">合计</div>
      <div data-total style="font-size: 24px; font-weight: bold; color: #ff6b6b;">¥{{TOTAL}}</div>
    </div>
    <div data-checkout-btn style="background: #ff6b6b; color: white; text-align: center; padding: 12px; border-radius: 8px; font-size: 15px; font-weight: bold; cursor: pointer; transition: all 0.2s;">结算 (3件)</div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'diagnosis',
    name: '诊断书',
    keywords: ['诊断书', '病历', '诊断证明', '医疗'],
    fields: [
      { key: 'PATIENT', label: '患者姓名', placeholder: '张三' },
      { key: 'HOSPITAL', label: '医院', placeholder: '市人民医院' },
      { key: 'DIAGNOSIS', label: '诊断结果', placeholder: '感冒' },
      { key: 'DOCTOR', label: '医生', placeholder: '李医生' },
      { key: 'DATE', label: '日期', placeholder: '2025-01-15' },
    ],
    htmlTemplate: `
<div style="max-width: 360px; margin: 0 auto; background: white; padding: 28px 24px; border-radius: 8px; box-shadow: 0 3px 15px rgba(0,0,0,0.12); font-family: 'Georgia', 'Noto Serif SC', serif; border: 2px solid #e74c3c;">
  <!-- 医院抬头 -->
  <div style="text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e74c3c;">
    <div style="font-size: 22px; font-weight: bold; color: #2d3436; margin-bottom: 6px;">{{HOSPITAL}}</div>
    <div style="font-size: 16px; color: #636e72;">诊断证明书</div>
  </div>
  
  <!-- 患者信息 -->
  <div style="margin-bottom: 20px;">
    <div style="font-size: 14px; color: #999; margin-bottom: 6px;">患者姓名</div>
    <div style="font-size: 18px; font-weight: bold; color: #2d3436;">{{PATIENT}}</div>
  </div>
  
  <!-- 诊断结果 -->
  <div style="background: #fff5f5; padding: 18px; border-radius: 8px; border-left: 4px solid #e74c3c; margin-bottom: 20px;">
    <div style="font-size: 13px; color: #999; margin-bottom: 8px;">临床诊断</div>
    <div style="font-size: 16px; color: #2d3436; line-height: 1.6;">{{DIAGNOSIS}}</div>
  </div>
  
  <!-- 底部信息 -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 16px; border-top: 1px dashed #ddd;">
    <div>
      <div style="font-size: 13px; color: #999; margin-bottom: 4px;">主治医师</div>
      <div style="font-size: 15px; font-weight: 600; color: #2d3436;">{{DOCTOR}}</div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 13px; color: #999; margin-bottom: 4px;">诊断日期</div>
      <div style="font-size: 15px; font-weight: 600; color: #2d3436;">{{DATE}}</div>
    </div>
  </div>
  
  <!-- 印章 -->
  <div style="text-align: right; margin-top: 16px;">
    <div style="display: inline-block; width: 70px; height: 70px; border: 2px solid #e74c3c; border-radius: 50%; color: #e74c3c; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold;">医院印章</div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'moments_post',
    name: '朋友圈动态',
    keywords: ['朋友圈', '发朋友圈', '动态', '分享'],
    fields: [
      { key: 'NAME', label: '用户名', placeholder: '张三' },
      { key: 'POST1', label: '动态1内容', placeholder: '今天天气真好！出去走走' },
      { key: 'TIME1', label: '动态1时间', placeholder: '10分钟前' },
      { key: 'LIKE1', label: '动态1点赞', placeholder: '李四、王五' },
      { key: 'COMMENT1', label: '动态1评论', placeholder: '李四：确实不错' },
      { key: 'POST2', label: '动态2内容', placeholder: '终于完成这个项目了，太不容易了' },
      { key: 'TIME2', label: '动态2时间', placeholder: '2小时前' },
      { key: 'LIKE2', label: '动态2点赞', placeholder: '王五、赵六、孙七' },
      { key: 'COMMENT2A', label: '动态2评论A', placeholder: '王五：辛苦了' },
      { key: 'COMMENT2B', label: '动态2评论B', placeholder: '赵六：恭喜恭喜' },
      { key: 'POST3', label: '动态3内容', placeholder: '周末愉快~' },
      { key: 'TIME3', label: '动态3时间', placeholder: '昨天' },
      { key: 'LIKE3', label: '动态3点赞', placeholder: '李四、周八' },
    ],
    htmlTemplate: `
<div style="max-width: 370px; margin: 0 auto; background: #ededed; padding: 0; border-radius: 0; font-family: -apple-system, 'PingFang SC', sans-serif;">
  <!-- 顶部个人信息 -->
  <div style="background: white; padding: 16px; border-bottom: 1px solid #e5e5e5;">
    <div style="display: flex; align-items: center; gap: 12px;">
      <div style="width: 50px; height: 50px; border-radius: 6px; background: #4facfe; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">{{NAME_INITIAL}}</div>
      <div>
        <div style="font-size: 17px; font-weight: 600; color: #2d3436;">{{NAME}}</div>
        <div style="font-size: 13px; color: #999;">查看朋友圈</div>
      </div>
    </div>
  </div>
  
  <!-- 动态列表 -->
  <div style="background: #ededed;">
    <!-- 动态1 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST1}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME1}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95; margin-bottom: 4px;">赞 {{LIKE1}}</div>
            <div style="border-top: 1px solid #e5e5e5; padding-top: 6px; margin-top: 4px;">
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4;">{{COMMENT1}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 动态2 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST2}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME2}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95; margin-bottom: 4px;">赞 {{LIKE2}}</div>
            <div style="border-top: 1px solid #e5e5e5; padding-top: 6px; margin-top: 4px;">
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4; margin-bottom: 3px;">{{COMMENT2A}}</div>
              <div style="font-size: 13px; color: #2d3436; line-height: 1.4;">{{COMMENT2B}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 动态3 -->
    <div style="background: white; padding: 14px; margin-top: 8px; border-top: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;">
      <div style="display: flex; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 4px; background: #4facfe; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">{{NAME_INITIAL}}</div>
        <div style="flex: 1;">
          <div style="font-size: 15px; font-weight: 600; color: #576b95; margin-bottom: 4px;">{{NAME}}</div>
          <div style="font-size: 15px; color: #2d3436; line-height: 1.5; margin-bottom: 8px;">{{POST3}}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 8px;">{{TIME3}}</div>
          <div style="background: #f7f7f7; padding: 8px 10px; border-radius: 4px;">
            <div style="font-size: 13px; color: #576b95;">赞 {{LIKE3}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'marriage_certificate',
    name: '结婚证',
    keywords: ['结婚证', '结婚', '领证', '婚姻'],
    fields: [
      { key: 'NAME1', label: '配偶1姓名', placeholder: '张三' },
      { key: 'ID1', label: '配偶1身份证', placeholder: '110101199001011234' },
      { key: 'NAME2', label: '配偶2姓名', placeholder: '李四' },
      { key: 'ID2', label: '配偶2身份证', placeholder: '110101199002025678' },
      { key: 'DATE', label: '登记日期', placeholder: '2025年1月15日' },
      { key: 'NUMBER', label: '证件编号', placeholder: 'J123456789' },
    ],
    htmlTemplate: `
<div style="max-width: 400px; margin: 0 auto; background: #c62828; padding: 20px; border-radius: 8px; box-shadow: 0 8px 30px rgba(198,40,40,0.4); font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 书本容器 -->
  <div style="display: flex; gap: 4px; background: #8b1a1a; padding: 4px; border-radius: 4px;">
    <!-- 左页 -->
    <div style="flex: 1; background: #fff5f7; padding: 20px 16px; border-radius: 4px 0 0 4px; box-shadow: inset -2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 80px; margin: 0 auto 10px; background: #ff6b9d; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">♥</div>
        <div style="font-size: 12px; color: #999;">中华人民共和国</div>
        <div style="font-size: 18px; font-weight: bold; color: #ff6b9d; margin-top: 4px;">结婚证</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME1}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID1}}</span></div>
        <div style="border-top: 1px dashed #ddd; margin: 12px 0;"></div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME2}}</div>
        <div><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID2}}</span></div>
      </div>
    </div>
    
    <!-- 中缝 -->
    <div style="width: 2px; background: rgba(0,0,0,0.3); box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>
    
    <!-- 右页 -->
    <div style="flex: 1; background: #fff5f7; padding: 20px 16px; border-radius: 0 4px 4px 0; box-shadow: inset 2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: bold; color: #2d3436;">登记信息</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666; margin-bottom: 16px;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记日期：</span>{{DATE}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记机关：</span>民政局</div>
        <div><span style="color: #999;">证件编号：</span>{{NUMBER}}</div>
      </div>
      <div style="background: white; padding: 10px; border-radius: 4px; text-align: center; margin-bottom: 12px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 6px;">特此证明</div>
        <div style="font-size: 11px; color: #2d3436; line-height: 1.6;">持证人自愿结为夫妻，双方具有完全民事行为能力</div>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; border: 2px solid #ff6b9d; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #ff6b9d;">印章</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'divorce_certificate',
    name: '离婚证',
    keywords: ['离婚证', '离婚', '离婚证明'],
    fields: [
      { key: 'NAME1', label: '当事人1', placeholder: '张三' },
      { key: 'ID1', label: '当事人1身份证', placeholder: '110101199001011234' },
      { key: 'NAME2', label: '当事人2', placeholder: '李四' },
      { key: 'ID2', label: '当事人2身份证', placeholder: '110101199002025678' },
      { key: 'DATE', label: '登记日期', placeholder: '2025年1月15日' },
      { key: 'NUMBER', label: '证件编号', placeholder: 'L123456789' },
    ],
    htmlTemplate: `
<div style="max-width: 400px; margin: 0 auto; background: #c62828; padding: 20px; border-radius: 8px; box-shadow: 0 8px 30px rgba(198,40,40,0.4); font-family: 'Georgia', 'Noto Serif SC', serif;">
  <!-- 书本容器 -->
  <div style="display: flex; gap: 4px; background: #8b1a1a; padding: 4px; border-radius: 4px;">
    <!-- 左页 -->
    <div style="flex: 1; background: #f5fff8; padding: 20px 16px; border-radius: 4px 0 0 4px; box-shadow: inset -2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 80px; margin: 0 auto 10px; background: #00b894; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 28px;">※</div>
        <div style="font-size: 12px; color: #999;">中华人民共和国</div>
        <div style="font-size: 18px; font-weight: bold; color: #00b894; margin-top: 4px;">离婚证</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME1}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID1}}</span></div>
        <div style="border-top: 1px dashed #ddd; margin: 12px 0;"></div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">姓名：</span>{{NAME2}}</div>
        <div><span style="color: #999;">身份证号：</span><span style="font-size: 10px;">{{ID2}}</span></div>
      </div>
    </div>
    
    <!-- 中缝 -->
    <div style="width: 2px; background: rgba(0,0,0,0.3); box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>
    
    <!-- 右页 -->
    <div style="flex: 1; background: #f5fff8; padding: 20px 16px; border-radius: 0 4px 4px 0; box-shadow: inset 2px 0 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="font-size: 13px; font-weight: bold; color: #2d3436;">登记信息</div>
      </div>
      <div style="font-size: 11px; line-height: 1.8; color: #666; margin-bottom: 16px;">
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记日期：</span>{{DATE}}</div>
        <div style="margin-bottom: 8px;"><span style="color: #999;">登记机关：</span>民政局</div>
        <div><span style="color: #999;">证件编号：</span>{{NUMBER}}</div>
      </div>
      <div style="background: white; padding: 10px; border-radius: 4px; text-align: center; margin-bottom: 12px;">
        <div style="font-size: 10px; color: #999; margin-bottom: 6px;">特此证明</div>
        <div style="font-size: 11px; color: #2d3436; line-height: 1.6;">双方自愿离婚，准予登记，发给此证</div>
      </div>
      <div style="text-align: center;">
        <div style="width: 50px; height: 50px; border: 2px solid #00b894; border-radius: 50%; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; color: #00b894;">印章</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },
  
  {
    id: 'apology_letter',
    name: '检讨书',
    keywords: ['检讨书', '检讨', '认错', '道歉信', '反省'],
    fields: [
      { key: 'TO_WHO', label: '写给谁', placeholder: '老师/领导/对象' },
      { key: 'MISTAKE', label: '错误内容', placeholder: '我做错了什么' },
      { key: 'REASON', label: '犯错原因', placeholder: '为什么会犯错' },
      { key: 'REFLECTION', label: '深刻反思', placeholder: '我的认识' },
      { key: 'PROMISE', label: '保证措施', placeholder: '以后怎么做' },
      { key: 'SIGNATURE', label: '署名', placeholder: '你的名字' },
      { key: 'DATE', label: '日期', placeholder: '2024年11月21日' },
    ],
    htmlTemplate: `
<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}.paper{width:100%;max-width:360px;background:#fff;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,0.08);overflow:hidden;border:1px solid #e5e5e5}.header{background:#fff;color:#2d3436;padding:20px;text-align:center;border-bottom:2px solid #f0f0f0}.header h1{font-size:20px;margin-bottom:8px;font-weight:600}.header p{font-size:12px;color:#999}.content{padding:20px}.section{margin-bottom:20px}.section-title{font-size:14px;color:#666;margin-bottom:8px;font-weight:600}.section-content{font-size:14px;line-height:1.8;color:#333;background:#f9f9f9;padding:12px;border-radius:6px;border-left:3px solid #2d3436;white-space:pre-wrap;word-wrap:break-word;opacity:0;animation:typing 2s steps(60,end) forwards,fadeIn 0.5s forwards}.footer{display:flex;justify-content:space-between;align-items:center;padding:0 20px 20px;font-size:13px;color:#666}.signature{text-align:right}.btn-group{padding:20px;border-top:1px solid #f0f0f0;display:flex;gap:10px}.btn{flex:1;padding:10px;border:none;border-radius:6px;font-size:14px;cursor:pointer;transition:all 0.3s}.btn-accept{background:#2d3436;color:#fff}.btn-accept:active{background:#1a1d1f;transform:scale(0.98)}.btn-reject{background:#f0f0f0;color:#666}.btn-reject:active{background:#e0e0e0;transform:scale(0.98)}@keyframes fadeIn{to{opacity:1}}@keyframes typing{from{max-height:0}to{max-height:500px}}.折叠{display:none}.展开按钮{text-align:center;padding:10px;color:#2d3436;cursor:pointer;font-size:13px;user-select:none}.展开按钮:active{opacity:0.7}input[type="checkbox"]{display:none}#toggle:checked~.content .折叠{display:block}#toggle:checked~.展开按钮 .展开文字{display:none}#toggle:checked~.展开按钮 .折叠文字{display:inline}#toggle:not(:checked)~.展开按钮 .折叠文字{display:none}</style></head><body><div class="paper"><div class="header"><h1>检讨书</h1><p>深刻反省 · 诚恳道歉</p></div><input type="checkbox" id="toggle"><label for="toggle" class="展开按钮"><span class="展开文字">▼ 点击展开完整内容</span><span class="折叠文字">▲ 点击收起</span></label><div class="content"><div class="section"><div class="section-title">致：{{TO_WHO}}</div></div><div class="section"><div class="section-title">我犯的错误</div><div class="section-content">{{MISTAKE}}</div></div><div class="section 折叠"><div class="section-title">犯错原因</div><div class="section-content" style="animation-delay:0.5s">{{REASON}}</div></div><div class="section 折叠"><div class="section-title">深刻反思</div><div class="section-content" style="animation-delay:1s">{{REFLECTION}}</div></div><div class="section 折叠"><div class="section-title">改正措施</div><div class="section-content" style="animation-delay:1.5s">{{PROMISE}}</div></div></div><div class="footer 折叠"><div class="signature">检讨人：{{SIGNATURE}}<br>{{DATE}}</div></div><div class="btn-group 折叠"><button class="btn btn-accept" onclick="this.textContent='已接受检讨';this.disabled=true">接受检讨</button><button class="btn btn-reject" onclick="this.textContent='不够深刻';this.disabled=true">需要重写</button></div></div></body></html>
    `.trim()
  },
  
  {
    id: 'watch_qq',
    name: '手表',
    keywords: ['手表', '旧消息', '已读未回'],
    fields: [
      { key: 'CHARACTER_NAME', label: '角色昵称', placeholder: '示例' },
      { key: 'DATE', label: '日期', placeholder: '2018-11-21' },
      { key: 'TIME', label: '时间', placeholder: '14:30' },
      { key: 'MSG1', label: '消息1', placeholder: '在吗' },
      { key: 'MSG2', label: '消息2', placeholder: '...' },
      { key: 'MSG3', label: '消息3', placeholder: '你还好吗' },
      { key: 'MSG4', label: '消息4', placeholder: '我一直在等你' },
    ],
    htmlTemplate: `
<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#e3f2fd;font-family:SimSun,serif;padding:10px}.qq-window{width:100%;max-width:380px;margin:0 auto;background:#fff;border:2px solid #4169e1;box-shadow:3px 3px 0 rgba(0,0,0,0.2);opacity:0.85}.title-bar{background:linear-gradient(180deg,#6495ed 0%,#4169e1 100%);padding:4px 8px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e3a8a}.title-text{color:#fff;font-size:12px;font-weight:bold}.title-buttons{display:flex;gap:4px}.title-btn{width:16px;height:16px;background:#ddd;border:1px solid #999;font-size:10px;line-height:14px;text-align:center;cursor:pointer}.menu-bar{background:#f0f0f0;padding:2px 4px;border-bottom:1px solid #ccc;font-size:11px;color:#333}.chat-info{background:#fffacd;padding:6px 8px;border-bottom:1px solid #ddd;font-size:11px;color:#666}.chat-content{background:#fff;padding:8px;min-height:200px;max-height:300px;overflow-y:auto}.msg{margin-bottom:8px;font-size:12px;line-height:1.6;text-align:left}.msg-time{color:#999;font-size:10px;text-align:center;margin:8px 0}.msg-sender{color:#00f;font-weight:bold}.msg-text{color:#000;margin-left:4px}.msg-unread{color:#f44336;font-size:10px;margin-left:6px;font-weight:bold}.input-bar{background:#f5f5f5;border-top:2px solid #ccc;padding:6px}.input-tools{background:#e8e8e8;padding:3px;border:1px solid #ccc;margin-bottom:4px;font-size:10px;color:#666}.input-box{background:#fff;border:1px solid #999;padding:6px;min-height:50px;font-size:12px;font-family:SimSun,serif}.send-btn{background:linear-gradient(180deg,#f0f0f0 0%,#d0d0d0 100%);border:1px solid #999;padding:4px 16px;font-size:12px;margin-top:4px;cursor:pointer;float:right}</style></head><body><div class="qq-window"><div class="title-bar"><div class="title-text">与 {{CHARACTER_NAME}} 聊天中</div><div class="title-buttons"><div class="title-btn">_</div><div class="title-btn">□</div><div class="title-btn">×</div></div></div><div class="menu-bar">消息(M) 查看(V) 工具(T) 帮助(H)</div><div class="chat-info">{{CHARACTER_NAME}} ({{DATE}} {{TIME}})</div><div class="chat-content"><div class="msg-time">{{DATE}} {{TIME}}</div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG1}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG2}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG3}}</span><span class="msg-unread">未读</span></div><div class="msg"><span class="msg-sender">{{CHARACTER_NAME}}:</span><span class="msg-text">{{MSG4}}</span><span class="msg-unread">未读</span></div></div><div class="input-bar"><div class="input-tools">字体 表情 截图 抖动窗口 发送文件</div><div class="input-box">对方长时间未回复...</div><button class="send-btn">发送(S)</button></div></div></body></html>
    `.trim()
  },

  {
    id: 'incognito_mode',
    name: '隐私浏览',
    keywords: ['无痕浏览', '隐私模式', '隐私浏览', '私密浏览'],
    fields: [
      { key: 'SITE1_TITLE', label: '网站1标题', placeholder: '成人内容网站' },
      { key: 'SITE1_URL', label: '网站1地址', placeholder: 'adult-site.com' },
      { key: 'SITE1_TIME', label: '访问时间1', placeholder: '23:15' },
      { key: 'SITE1_THOUGHT', label: '网站1心理活动', placeholder: '心跳加速，偷偷看了一眼门口，确认没人后点开...' },
      { key: 'SITE2_TITLE', label: '网站2标题', placeholder: '在线视频' },
      { key: 'SITE2_URL', label: '网站2地址', placeholder: 'video.com' },
      { key: 'SITE2_TIME', label: '访问时间2', placeholder: '23:42' },
      { key: 'SITE2_THOUGHT', label: '网站2心理活动', placeholder: '手心出汗，音量调到最低，耳朵警惕地听着外面的动静' },
      { key: 'SITE3_TITLE', label: '网站3标题', placeholder: '私密社区' },
      { key: 'SITE3_URL', label: '网站3地址', placeholder: 'secret.com' },
      { key: 'SITE3_TIME', label: '访问时间3', placeholder: '00:18' },
      { key: 'SITE3_THOUGHT', label: '网站3心理活动', placeholder: '呼吸变得急促，身体开始发热，手指颤抖着滑动屏幕' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#f2f2f7;border-radius:12px;overflow:hidden;font-family:-apple-system,'SF Pro Text','PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#fff;padding:14px 16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <div style="width:24px;height:24px;background:#ffd60a;border-radius:6px;display:flex;align-items:center;justify-content:center">
        <div style="width:10px;height:10px;border:2px solid #000;border-radius:2px"></div>
      </div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:600;color:#000">隐私浏览</div>
      </div>
      <div style="font-size:13px;color:#007aff;font-weight:500;cursor:pointer">清除</div>
    </div>
    <div style="background:#fff9e6;padding:10px;border-radius:8px;border-left:3px solid #ffd60a">
      <div style="font-size:12px;color:#8e8e93;line-height:1.5">Safari 不会记住你访问的网站、搜索历史或自动填充信息</div>
    </div>
  </div>
  
  <div style="background:#fff">
    <div style="padding:10px 16px;background:#f2f2f7">
      <div style="font-size:13px;font-weight:600;color:#8e8e93;text-transform:uppercase;letter-spacing:0.5px">今天晚上</div>
    </div>
    
    <div style="padding:12px 16px;border-bottom:0.5px solid #c6c6c8;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#ff3b30;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">A</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE1_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE1_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE1_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #ff3b30">
        <div style="font-size:11px;color:#ff3b30;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE1_THOUGHT}}</div>
      </div>
    </div>
    
    <div style="padding:12px 16px;border-bottom:0.5px solid #c6c6c8;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#ff9500;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">V</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE2_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE2_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE2_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #ff9500">
        <div style="font-size:11px;color:#ff9500;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE2_THOUGHT}}</div>
      </div>
    </div>
    
    <div style="padding:12px 16px;cursor:pointer" onclick="this.querySelector('.thought').style.display=this.querySelector('.thought').style.display==='block'?'none':'block'">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
        <div style="width:32px;height:32px;background:#af52de;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600">S</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:15px;font-weight:500;color:#000;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE3_TITLE}}</div>
          <div style="font-size:13px;color:#8e8e93;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{SITE3_URL}}</div>
        </div>
        <div style="font-size:13px;color:#8e8e93;flex-shrink:0">{{SITE3_TIME}}</div>
      </div>
      <div class="thought" style="display:none;background:#fff9e6;padding:10px;border-radius:6px;margin-top:8px;border-left:2px solid #af52de">
        <div style="font-size:11px;color:#af52de;font-weight:600;margin-bottom:4px">💭 心理活动</div>
        <div style="font-size:13px;color:#000;line-height:1.5">{{SITE3_THOUGHT}}</div>
      </div>
    </div>
  </div>
  
  <div style="background:#f2f2f7;padding:12px 16px;text-align:center">
    <div style="display:inline-flex;align-items:center;gap:6px;background:#fff;padding:8px 16px;border-radius:20px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
      <div style="font-size:13px;color:#ff3b30;font-weight:500">⚠</div>
      <div style="font-size:13px;color:#8e8e93">点击网站查看心理活动</div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'xiaohongshu_post',
    name: '小红书分享',
    keywords: ['小红书', '分享', '种草', '笔记'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '今天分享一个超好用的东西' },
      { key: 'CONTENT', label: '正文', placeholder: '姐妹们，这个真的太好用了...' },
      { key: 'AUTHOR', label: '作者', placeholder: '小红薯' },
      { key: 'LIKES', label: '点赞数', placeholder: '2.3万' },
      { key: 'COLLECTS', label: '收藏数', placeholder: '5678' },
      { key: 'COMMENTS_COUNT', label: '评论数', placeholder: '892' },
      { key: 'TIME', label: '发布时间', placeholder: '2小时前' },
      { key: 'COMMENT1_USER', label: '评论1用户', placeholder: '用户A' },
      { key: 'COMMENT1_TEXT', label: '评论1内容', placeholder: '太实用了姐妹！' },
      { key: 'COMMENT2_USER', label: '评论2用户', placeholder: '用户B' },
      { key: 'COMMENT2_TEXT', label: '评论2内容', placeholder: '已下单' },
      { key: 'COMMENT3_USER', label: '评论3用户', placeholder: '用户C' },
      { key: 'COMMENT3_TEXT', label: '评论3内容', placeholder: '求链接' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#fff;padding:12px 16px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:36px;height:36px;border-radius:50%;background:#ff2442;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:600;flex-shrink:0">{{AUTHOR_INITIAL}}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:600;color:#000">{{AUTHOR}}</div>
        <div style="font-size:12px;color:#8e8e93">{{TIME}}</div>
      </div>
      <div style="padding:4px 12px;background:#ff2442;border-radius:14px;font-size:12px;color:#fff;font-weight:500;cursor:pointer">+ 关注</div>
    </div>
  </div>
  
  <div style="padding:0 16px 12px 16px">
    <div style="font-size:16px;font-weight:600;color:#000;margin-bottom:8px;line-height:1.4">{{TITLE}}</div>
    <div style="font-size:14px;color:#000;line-height:1.6">{{CONTENT}}</div>
  </div>
  
  <div style="position:relative;padding-top:100%;background:#f5f5f5;margin:0 16px 12px 16px;border-radius:8px">
    <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#8e8e93;font-size:14px">
      [图片内容]
    </div>
  </div>
  
  <div style="padding:12px 16px;display:flex;justify-content:space-around;align-items:center;border-top:0.5px solid #f2f2f7">
    <div class="like-btn" style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px" onclick="var icon=this.querySelector('.like-icon');var count=this.querySelector('.like-count');if(icon.style.color==='rgb(255, 36, 66)'){icon.style.color='#8e8e93';icon.textContent='♡'}else{icon.style.color='#ff2442';icon.textContent='♥'}">
      <div class="like-icon" style="font-size:20px;color:#8e8e93;transition:all 0.2s">♡</div>
      <div class="like-count" style="font-size:13px;color:#8e8e93">{{LIKES}}</div>
    </div>
    <div style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="#8e8e93"/></svg>
      <div style="font-size:13px;color:#8e8e93">{{COLLECTS}}</div>
    </div>
    <div class="comment-btn" style="display:flex;align-items:center;gap:6px;cursor:pointer;padding:8px" onclick="this.parentElement.nextElementSibling.style.display=this.parentElement.nextElementSibling.style.display==='block'?'none':'block'">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 4C2 2.89543 2.89543 2 4 2H16C17.1046 2 18 2.89543 18 4V12C18 13.1046 17.1046 14 16 14H11L6 18V14H4C2.89543 14 2 13.1046 2 12V4Z" fill="#8e8e93"/></svg>
      <div style="font-size:13px;color:#8e8e93">{{COMMENTS_COUNT}}</div>
    </div>
    <div style="cursor:pointer;padding:8px">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M13 3L17 10L13 17M3 10H16" stroke="#8e8e93" stroke-width="2" stroke-linecap="round"/></svg>
    </div>
  </div>
  
  <div class="comments-section" style="display:none;background:#f9f9f9;padding:12px 16px;border-top:0.5px solid #e5e5e7">
    <div style="font-size:13px;font-weight:600;color:#000;margin-bottom:10px">评论</div>
    <div style="margin-bottom:8px">
      <div style="display:flex;gap:8px;margin-bottom:4px">
        <div style="font-size:13px;color:#8e8e93;font-weight:500">{{COMMENT1_USER}}:</div>
        <div style="font-size:13px;color:#000">{{COMMENT1_TEXT}}</div>
      </div>
    </div>
    <div style="margin-bottom:8px">
      <div style="display:flex;gap:8px;margin-bottom:4px">
        <div style="font-size:13px;color:#8e8e93;font-weight:500">{{COMMENT2_USER}}:</div>
        <div style="font-size:13px;color:#000">{{COMMENT2_TEXT}}</div>
      </div>
    </div>
    <div>
      <div style="display:flex;gap:8px">
        <div style="font-size:13px;color:#8e8e93;font-weight:500">{{COMMENT3_USER}}:</div>
        <div style="font-size:13px;color:#000">{{COMMENT3_TEXT}}</div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'sex_timer',
    name: '性爱时长',
    keywords: ['性爱时长', '性爱记录', '时长统计', '性生活'],
    fields: [
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'START_TIME', label: '开始时间', placeholder: '23:15' },
      { key: 'END_TIME', label: '结束时间', placeholder: '00:48' },
      { key: 'DURATION', label: '总时长', placeholder: '1小时33分' },
      { key: 'FOREPLAY', label: '前戏时长', placeholder: '18分钟' },
      { key: 'MAIN', label: '主要时长', placeholder: '45分钟' },
      { key: 'AFTERCARE', label: '后戏时长', placeholder: '30分钟' },
      { key: 'POSITION_COUNT', label: '体位数', placeholder: '5' },
      { key: 'RATING', label: '体验评分', placeholder: '9.5' },
      { key: 'PARTNER_RATING', label: '对方评分', placeholder: '9.8' },
      { key: 'CLIMAX', label: '高潮次数', placeholder: '3' },
      { key: 'LOCATION', label: '地点', placeholder: '卧室' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#000;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.3)">
  <div style="background:#ff3b30;padding:20px;text-align:center">
    <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-bottom:6px;font-weight:500">性爱记录</div>
    <div style="font-size:48px;font-weight:700;color:#fff;line-height:1;margin-bottom:10px;font-variant-numeric:tabular-nums">{{DURATION}}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.85)">{{DATE}}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:4px">{{START_TIME}} - {{END_TIME}}</div>
  </div>
  
  <div style="padding:16px;background:#1c1c1e">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#2c2c2e;padding:14px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#ff3b30;margin-bottom:4px;font-variant-numeric:tabular-nums">{{RATING}}</div>
        <div style="font-size:11px;color:#8e8e93;font-weight:500">我的评分</div>
      </div>
      <div style="background:#2c2c2e;padding:14px;border-radius:10px;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#ff3b30;margin-bottom:4px;font-variant-numeric:tabular-nums">{{PARTNER_RATING}}</div>
        <div style="font-size:11px;color:#8e8e93;font-weight:500">对方评分</div>
      </div>
    </div>
    
    <div style="background:#2c2c2e;padding:14px;border-radius:10px;margin-bottom:16px">
      <div style="font-size:12px;color:#8e8e93;margin-bottom:10px;font-weight:600">时长分布</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#fff">前戏</div>
        <div style="font-size:15px;color:#ff9500;font-weight:600">{{FOREPLAY}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#fff">主要过程</div>
        <div style="font-size:15px;color:#ff3b30;font-weight:600">{{MAIN}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;color:#fff">后戏</div>
        <div style="font-size:15px;color:#af52de;font-weight:600">{{AFTERCARE}}</div>
      </div>
    </div>
    
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:2px">{{POSITION_COUNT}}</div>
        <div style="font-size:10px;color:#8e8e93">体位</div>
      </div>
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:2px">{{CLIMAX}}</div>
        <div style="font-size:10px;color:#8e8e93">高潮</div>
      </div>
      <div style="background:#2c2c2e;padding:12px;border-radius:8px;text-align:center">
        <div style="font-size:11px;font-weight:600;color:#fff;margin-bottom:2px">{{LOCATION}}</div>
        <div style="font-size:10px;color:#8e8e93">地点</div>
      </div>
    </div>
    
    <div style="background:#2c2c2e;padding:10px;border-radius:8px;text-align:center">
      <div style="font-size:11px;color:#8e8e93">数据已加密保存</div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'private_album',
    name: '私密相册',
    keywords: ['私密相册', '加密相册', '隐藏相册', '私密照片'],
    fields: [
      { key: 'ALBUM_NAME', label: '相册名称', placeholder: '私密回忆' },
      { key: 'COUNT', label: '照片数量', placeholder: '18' },
      { key: 'DATE', label: '最后更新', placeholder: '昨天 23:42' },
      { key: 'SECRET_TEXT', label: '私密描述', placeholder: '与她的亲密瞬间' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#000;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.3)">
  <div style="background:#1c1c1e;padding:14px 16px">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
      <div style="font-size:22px;font-weight:700;color:#fff">{{ALBUM_NAME}}</div>
      <div style="width:28px;height:28px;background:rgba(255,255,255,0.1);border-radius:50%;display:flex;align-items:center;justify-content:center">
        <div style="width:12px;height:12px;border:2px solid #fff;border-radius:2px"></div>
      </div>
    </div>
    <div style="font-size:13px;color:#8e8e93">{{COUNT}} 张照片 · {{DATE}}</div>
  </div>
  
  <div style="padding:12px;background:#000">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-bottom:12px">
      <div style="position:relative;padding-top:100%;background:#2c2c2e;border-radius:4px;overflow:hidden">
        <div style="position:absolute;inset:0;background:rgba(255,59,48,0.3);backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center">
          <div style="text-align:center">
            <div style="width:32px;height:32px;border:2px solid #fff;border-radius:50%;margin:0 auto 6px;display:flex;align-items:center;justify-content:center">
              <div style="width:12px;height:12px;border:2px solid #fff;border-radius:2px"></div>
            </div>
            <div style="font-size:10px;color:#fff;font-weight:500">点击查看</div>
          </div>
        </div>
      </div>
      <div style="padding-top:100%;background:#2c2c2e;border-radius:4px"></div>
      <div style="padding-top:100%;background:#2c2c2e;border-radius:4px"></div>
      <div style="padding-top:100%;background:#2c2c2e;border-radius:4px"></div>
      <div style="padding-top:100%;background:#2c2c2e;border-radius:4px"></div>
      <div style="padding-top:100%;background:#2c2c2e;border-radius:4px"></div>
    </div>
  </div>
  
  <div style="padding:12px 16px;background:#1c1c1e">
    <div style="font-size:12px;color:#8e8e93;line-height:1.6;text-align:center">{{SECRET_TEXT}}</div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'hotel_booking',
    name: '酒店订单',
    keywords: ['酒店订单', '酒店预订', '开房记录', '订房'],
    fields: [
      { key: 'HOTEL_NAME', label: '酒店名称', placeholder: '希尔顿酒店' },
      { key: 'ROOM_TYPE', label: '房型', placeholder: '豪华大床房' },
      { key: 'CHECK_IN', label: '入住日期', placeholder: '11月21日' },
      { key: 'CHECK_OUT', label: '离店日期', placeholder: '11月22日' },
      { key: 'NIGHTS', label: '住宿晚数', placeholder: '1' },
      { key: 'GUEST_NAME', label: '入住人', placeholder: '张三' },
      { key: 'GUEST_PHONE', label: '手机号', placeholder: '138****1234' },
      { key: 'TOTAL_PRICE', label: '总价', placeholder: '599' },
      { key: 'ORDER_NO', label: '订单号', placeholder: 'HT20251121001' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#007aff;padding:20px 16px;text-align:center">
    <div style="font-size:11px;color:rgba(255,255,255,0.8);margin-bottom:8px;font-weight:500;letter-spacing:0.5px">预订成功</div>
    <div style="font-size:20px;font-weight:600;color:#fff;margin-bottom:8px">{{HOTEL_NAME}}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.9)">{{ROOM_TYPE}}</div>
  </div>
  
  <div style="padding:16px">
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:10px;font-weight:600">入住信息</div>
      <div style="background:#f2f2f7;padding:12px;border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:14px;color:#000">入住日期</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{CHECK_IN}}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:14px;color:#000">离店日期</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="font-size:14px;font-weight:500;color:#000">{{CHECK_OUT}}</div>
            <div style="background:#ff3b30;color:#fff;font-size:10px;padding:2px 6px;border-radius:10px;font-weight:500">{{NIGHTS}}晚</div>
          </div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="background:#f2f2f7;padding:12px;border-radius:8px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;color:#8e8e93">入住人</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{GUEST_NAME}}</div>
        </div>
        <div style="display:flex;justify-content:space-between">
          <div style="font-size:13px;color:#8e8e93">手机号</div>
          <div style="font-size:14px;font-weight:500;color:#000">{{GUEST_PHONE}}</div>
        </div>
      </div>
    </div>
    
    <div style="background:#f2f2f7;padding:14px;border-radius:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:13px;color:#8e8e93">订单总价</div>
        <div style="font-size:24px;font-weight:700;color:#ff3b30;font-variant-numeric:tabular-nums">¥{{TOTAL_PRICE}}</div>
      </div>
      <div style="font-size:11px;color:#8e8e93;text-align:right">订单号：{{ORDER_NO}}</div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'confession_board',
    name: '表白墙',
    keywords: ['表白墙', '表白', '告白墙', '论坛'],
    fields: [
      { key: 'TITLE', label: '标题', placeholder: '致我喜欢的女孩' },
      { key: 'CONTENT', label: '内容', placeholder: '我一直默默关注你很久了...' },
      { key: 'AUTHOR', label: '发帖人', placeholder: '匿名用户' },
      { key: 'TIME', label: '时间', placeholder: '2小时前' },
      { key: 'LIKE', label: '点赞数', placeholder: '128' },
      { key: 'COMMENT1', label: '评论1', placeholder: '祝福你们' },
      { key: 'COMMENT2', label: '评论2', placeholder: '好甜' },
      { key: 'COMMENT3', label: '评论3', placeholder: '加油！' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#fff;padding:16px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="width:38px;height:38px;border-radius:50%;background:#ff3b30;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600;flex-shrink:0">匿</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:14px;font-weight:600;color:#000">{{AUTHOR}}</div>
        <div style="font-size:12px;color:#8e8e93">{{TIME}}</div>
      </div>
    </div>
    
    <div style="font-size:17px;font-weight:600;color:#000;margin-bottom:10px">{{TITLE}}</div>
    <div style="font-size:15px;color:#000;line-height:1.6">{{CONTENT}}</div>
    
    <div style="display:flex;gap:20px;margin-top:14px;padding-top:12px">
      <div style="display:flex;align-items:center;gap:4px;font-size:13px;color:#8e8e93">
        <span style="color:#ff3b30">♡</span>
        <span>{{LIKE}}</span>
      </div>
      <div style="font-size:13px;color:#8e8e93">评论 3</div>
    </div>
  </div>
  
  <div style="background:#f9f9f9;padding:12px 16px">
    <div style="font-size:13px;font-weight:600;color:#000;margin-bottom:10px">评论</div>
    <div style="margin-bottom:8px;padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT1}}</div>
    </div>
    <div style="margin-bottom:8px;padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT2}}</div>
    </div>
    <div style="padding:10px;background:#fff;border-radius:8px">
      <div style="font-size:13px;color:#000;line-height:1.5">{{COMMENT3}}</div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'overtime_record',
    name: '加班记录',
    keywords: ['加班', '加班记录', '加班时长', '加班申请'],
    fields: [
      { key: 'APPLICANT', label: '申请人', placeholder: '张三' },
      { key: 'DEPARTMENT', label: '部门', placeholder: '技术部' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
      { key: 'START_TIME', label: '开始时间', placeholder: '18:30' },
      { key: 'END_TIME', label: '结束时间', placeholder: '22:00' },
      { key: 'HOURS', label: '加班时长', placeholder: '3.5小时' },
      { key: 'REASON', label: '加班事由', placeholder: '紧急项目上线需要完成代码部署及测试工作' },
      { key: 'APPROVER', label: '审批人', placeholder: '李经理' },
      { key: 'APPROVE_TIME', label: '审批时间', placeholder: '11-21 19:05' }
    ],
    htmlTemplate: `
<div style="max-width:320px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.12)">
  <div style="background:#007aff;padding:16px;text-align:center">
    <div style="font-size:18px;font-weight:600;color:#fff;margin-bottom:6px">加班申请单</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.85)">Overtime Application</div>
  </div>
  
  <div style="padding:16px">
    <div style="background:#f2f2f7;padding:12px;border-radius:10px;margin-bottom:16px">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:40px;height:40px;background:#007aff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:600;flex-shrink:0">{{APPLICANT_INITIAL}}</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;color:#000;margin-bottom:2px">{{APPLICANT}}</div>
          <div style="font-size:12px;color:#8e8e93">{{DEPARTMENT}}</div>
        </div>
        <div style="background:#34c759;color:#fff;padding:4px 10px;border-radius:12px;font-size:11px;font-weight:600">已批准</div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;font-weight:600">加班时间</div>
      <div style="background:#f2f2f7;border-radius:8px;padding:12px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <div style="font-size:13px;color:#8e8e93">{{DATE}}</div>
          <div style="font-size:14px;color:#000;font-weight:500">{{START_TIME}} - {{END_TIME}}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div style="font-size:14px;color:#000;font-weight:600">时长</div>
          <div style="font-size:20px;color:#007aff;font-weight:700;font-variant-numeric:tabular-nums">{{HOURS}}</div>
        </div>
      </div>
    </div>
    
    <div style="margin-bottom:16px">
      <div style="font-size:13px;color:#8e8e93;margin-bottom:8px;font-weight:600">加班事由</div>
      <div style="background:#f2f2f7;border-radius:8px;padding:12px">
        <div style="font-size:14px;color:#000;line-height:1.6">{{REASON}}</div>
      </div>
    </div>
    
    <div style="background:#f2f2f7;padding:12px;border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-size:13px;color:#8e8e93">审批人</div>
        <div style="font-size:14px;color:#000;font-weight:500">{{APPROVER}}</div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:13px;color:#8e8e93">{{APPROVE_TIME}}</div>
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:16px;height:16px;background:#34c759;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff">✓</div>
          <div style="font-size:13px;color:#34c759;font-weight:500">已批准</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'step_ranking',
    name: '步数排行',
    keywords: ['步数', '运动排行', '微信运动', '步数排行'],
    fields: [
      { key: 'DATE', label: '日期', placeholder: '2024年11月22日' },
      { key: 'MY_STEPS', label: '我的步数', placeholder: '12580' },
      { key: 'MY_RANK', label: '我的排名', placeholder: '3' },
      { key: 'RANK1_NAME', label: '第1名昵称', placeholder: '运动达人' },
      { key: 'RANK1_STEPS', label: '第1名步数', placeholder: '18520' },
      { key: 'RANK2_NAME', label: '第2名昵称', placeholder: '健康使者' },
      { key: 'RANK2_STEPS', label: '第2名步数', placeholder: '15230' },
      { key: 'RANK3_NAME', label: '第3名昵称', placeholder: '快乐行者' },
      { key: 'RANK3_STEPS', label: '第3名步数', placeholder: '12580' }
    ],
    htmlTemplate: `
<div style="max-width:360px;margin:0 auto;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:16px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 8px 32px rgba(102,126,234,0.4)">
  <div style="background:rgba(255,255,255,0.15);backdrop-filter:blur(10px);padding:20px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.1)">
    <div style="font-size:28px;margin-bottom:8px">👟</div>
    <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px">微信运动</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.8)">{{DATE}}</div>
  </div>
  <div style="padding:20px">
    <div style="background:rgba(255,255,255,0.95);border-radius:12px;padding:20px;text-align:center;margin-bottom:16px">
      <div style="font-size:14px;color:#999;margin-bottom:8px">我的步数</div>
      <div style="font-size:48px;font-weight:700;color:#667eea;margin-bottom:8px">{{MY_STEPS}}</div>
      <div style="font-size:14px;color:#ff6b6b;font-weight:600">排名第 {{MY_RANK}} 名</div>
    </div>
    <div style="background:rgba(255,255,255,0.95);border-radius:12px;padding:16px">
      <div style="font-size:15px;font-weight:600;color:#333;margin-bottom:12px">今日排行</div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:linear-gradient(90deg,#ffd700 0%,#ffed4e 100%);border-radius:10px;margin-bottom:8px">
        <div style="font-size:20px;font-weight:700;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.2)">🏆</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{RANK1_NAME}}</div>
          <div style="font-size:13px;color:#666">{{RANK1_STEPS}}步</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0f0f0;border-radius:10px;margin-bottom:8px">
        <div style="font-size:18px;font-weight:700;color:#c0c0c0">2</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{RANK2_NAME}}</div>
          <div style="font-size:13px;color:#666">{{RANK2_STEPS}}步</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f0f0f0;border-radius:10px">
        <div style="font-size:18px;font-weight:700;color:#cd7f32">3</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{RANK3_NAME}}</div>
          <div style="font-size:13px;color:#666">{{RANK3_STEPS}}步</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  },

  {
    id: 'screen_time',
    name: '屏幕时间',
    keywords: ['屏幕时间', '手机使用', '使用时长', '手机统计'],
    fields: [
      { key: 'DATE', label: '日期', placeholder: '2024年11月22日' },
      { key: 'TOTAL_TIME', label: '总使用时长', placeholder: '8小时32分' },
      { key: 'UNLOCK_COUNT', label: '解锁次数', placeholder: '156次' },
      { key: 'APP1_NAME', label: 'APP1名称', placeholder: '微信' },
      { key: 'APP1_TIME', label: 'APP1时长', placeholder: '3小时12分' },
      { key: 'APP2_NAME', label: 'APP2名称', placeholder: '抖音' },
      { key: 'APP2_TIME', label: 'APP2时长', placeholder: '2小时45分' },
      { key: 'APP3_NAME', label: 'APP3名称', placeholder: 'B站' },
      { key: 'APP3_TIME', label: 'APP3时长', placeholder: '1小时28分' }
    ],
    htmlTemplate: `
<div style="max-width:360px;margin:0 auto;background:#f5f5f7;border-radius:16px;overflow:hidden;font-family:-apple-system,'PingFang SC',sans-serif;box-shadow:0 4px 16px rgba(0,0,0,0.08)">
  <div style="background:linear-gradient(135deg,#00c6ff 0%,#0072ff 100%);padding:24px;text-align:center">
    <div style="font-size:32px;margin-bottom:12px">📱</div>
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:6px">屏幕时间</div>
    <div style="font-size:14px;color:rgba(255,255,255,0.9)">{{DATE}}</div>
  </div>
  <div style="padding:20px">
    <div style="background:#fff;border-radius:12px;padding:20px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div style="text-align:center;flex:1">
          <div style="font-size:14px;color:#999;margin-bottom:8px">总时长</div>
          <div style="font-size:24px;font-weight:700;color:#0072ff">{{TOTAL_TIME}}</div>
        </div>
        <div style="width:1px;background:#e5e5e5"></div>
        <div style="text-align:center;flex:1">
          <div style="font-size:14px;color:#999;margin-bottom:8px">解锁次数</div>
          <div style="font-size:24px;font-weight:700;color:#ff6b6b">{{UNLOCK_COUNT}}</div>
        </div>
      </div>
    </div>
    <div style="background:#fff;border-radius:12px;padding:16px">
      <div style="font-size:15px;font-weight:600;color:#333;margin-bottom:16px">最常使用</div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:10px">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#07c160 0%,#06ae56 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:600">{{APP1_NAME_INITIAL}}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{APP1_NAME}}</div>
          <div style="font-size:13px;color:#999">{{APP1_TIME}}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px;margin-bottom:10px">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#000 0%,#333 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:600">{{APP2_NAME_INITIAL}}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{APP2_NAME}}</div>
          <div style="font-size:13px;color:#999">{{APP2_TIME}}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f9f9f9;border-radius:8px">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#ff6699 0%,#ee5a6f 100%);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;font-weight:600">{{APP3_NAME_INITIAL}}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:600;color:#333">{{APP3_NAME}}</div>
          <div style="font-size:13px;color:#999">{{APP3_TIME}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
]

// 根据关键词查找模板（支持用户自定义关键词、独立开关和自定义模板）
export function findTemplateByKeyword(text: string): TheatreTemplate | null {
  // 获取每个模板的启用状态
  const enabledStr = localStorage.getItem('theatre_template_enabled')
  const templateEnabled: Record<string, boolean> = enabledStr ? JSON.parse(enabledStr) : {}
  
  // 获取用户自定义的关键词
  const customKeywordsStr = localStorage.getItem('theatre_custom_keywords')
  const customKeywords: Record<string, string[]> = customKeywordsStr ? JSON.parse(customKeywordsStr) : {}
  
  // 获取用户上传的自定义模板
  const customTemplatesStr = localStorage.getItem('theatre_custom_templates')
  const customTemplates: TheatreTemplate[] = customTemplatesStr ? JSON.parse(customTemplatesStr) : []
  
  // 合并内置模板和自定义模板
  const allTemplates = [...theatreTemplates, ...customTemplates]
  
  for (const template of allTemplates) {
    // 如果该模板未启用，跳过
    if (!templateEnabled[template.id]) {
      continue
    }
    
    // 优先使用用户自定义的关键词，否则使用默认关键词
    const keywords = customKeywords[template.id] || template.keywords
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return template
      }
    }
  }
  return null
}

// HTML转义函数，防止特殊字符破坏模板
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// 将AI输出的文本替换到HTML模板
export function fillTemplate(template: TheatreTemplate, aiOutput: string): string {
  let html = template.htmlTemplate
  
  // 解析AI输出，格式如：食物：炒饭\n价格：25
  const lines = aiOutput.split('\n')
  const data: Record<string, string> = {}
  
  for (const line of lines) {
    const match = line.match(/^(.+?)[：:]\s*(.+)$/)
    if (match) {
      const label = match[1].trim()
      const value = match[2].trim()
      
      // 根据label找到对应的key
      const field = template.fields.find(f => f.label === label)
      if (field) {
        data[field.key] = value
      }
    }
  }
  
  // 特殊处理：生成订单号
  if (template.id === 'receipt') {
    data['ORDER_NO'] = Date.now().toString().slice(-8)
  }
  
  // 特殊处理：生成快递单号
  if (template.id === 'express') {
    data['EXPRESS_NO'] = Date.now().toString().slice(-10)
  }
  
  // 特殊处理：私聊模板动态消息渲染
  if (template.id === 'private_chat') {
    const contactName = data['CONTACT_NAME'] || '对方'
    const contactInitial = contactName.charAt(contactName.length - 1)
    let messagesHtml = ''
    
    for (let i = 1; i <= 10; i++) {
      const sender = data[`MSG${i}_SENDER`]
      const content = data[`MSG${i}_CONTENT`]
      
      if (!content) continue // 跳过空消息
      
      const escapedContent = escapeHtml(content) // HTML转义
      
      if (sender === '我' || sender === 'me' || sender === 'Me' || sender === 'I') {
        // 我的消息（右侧绿色）
        messagesHtml += `
          <div style="margin-bottom: 10px; display: flex; justify-content: flex-end;">
            <div style="max-width: 70%; background: #95ec69; padding: 8px 11px; border-radius: 4px; font-size: 14px; color: #000; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              ${escapedContent}
            </div>
          </div>`
      } else {
        // 对方消息（左侧白色+头像）
        messagesHtml += `
          <div style="margin-bottom: 10px;">
            <div style="display: flex; align-items: flex-start; gap: 8px;">
              <div style="width: 38px; height: 38px; border-radius: 4px; background: #ff9a9e; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; font-weight: 600;">
                ${contactInitial}
              </div>
              <div style="max-width: 70%; background: #fff; padding: 8px 11px; border-radius: 4px; font-size: 14px; color: #000; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                ${escapedContent}
              </div>
            </div>
          </div>`
      }
    }
    
    html = html.replace('{{PRIVATE_CHAT_MESSAGES}}', messagesHtml)
  }
  
  // 特殊处理：群聊模板动态消息渲染
  if (template.id === 'group_chat') {
    const colors = ['#667eea', '#f093fb', '#4facfe', '#fa709a', '#30cfd0'] // 5种纯色循环
    let messagesHtml = ''
    
    for (let i = 1; i <= 25; i++) {
      const sender = data[`MSG${i}_SENDER`]
      const content = data[`MSG${i}_CONTENT`]
      
      if (!content) continue // 跳过空消息
      
      const senderInitial = sender ? sender.charAt(sender.length - 1) : '?'
      const colorIndex = (i - 1) % 5
      const bgColor = colors[colorIndex]
      
      const escapedSender = escapeHtml(sender || '') // HTML转义
      const escapedContent = escapeHtml(content) // HTML转义
      
      messagesHtml += `
        <div style="margin-bottom: 10px;">
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <div style="width: 38px; height: 38px; border-radius: 4px; background: ${bgColor}; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #fff; font-weight: 600;">
              ${senderInitial}
            </div>
            <div style="flex: 1; max-width: 70%;">
              <div style="font-size: 12px; color: #888; margin-bottom: 3px; font-weight: 500;">
                ${escapedSender}
              </div>
              <div style="background: #fff; padding: 8px 11px; border-radius: 4px; font-size: 14px; color: #000; line-height: 1.5; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                ${escapedContent}
              </div>
            </div>
          </div>
        </div>`
    }
    
    html = html.replace('{{GROUP_CHAT_MESSAGES}}', messagesHtml)
  }
  
  // 替换所有占位符
  for (const field of template.fields) {
    const value = data[field.key] || field.placeholder || ''
    const escapedValue = escapeHtml(value) // HTML转义
    html = html.replace(new RegExp(`{{${field.key}}}`, 'g'), escapedValue)
    
    // 自动生成昵称首字母（用于头像显示）
    if (field.key.includes('NAME') && !field.key.includes('GROUP_NAME')) {
      const nameValue = data[field.key] || field.placeholder || '?'
      const initial = nameValue.charAt(nameValue.length - 1) // 取最后一个字（中文名）
      html = html.replace(new RegExp(`{{${field.key}_INITIAL}}`, 'g'), initial)
    }
  }
  
  // 替换剩余的占位符（如ORDER_NO, EXPRESS_NO）
  html = html.replace(/{{ORDER_NO}}/g, data['ORDER_NO'] || '')
  html = html.replace(/{{EXPRESS_NO}}/g, data['EXPRESS_NO'] || '')
  
  return html
}
