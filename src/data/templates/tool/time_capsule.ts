import { TheatreTemplate } from '../../theatreTemplates'

export const timeCapsuleTemplate: TheatreTemplate = {
  id: 'time_capsule',
  category: '工具应用',
  name: '时间胶囊',
  keywords: ['时间胶囊', '给未来的信', '未来的自己', '时光信件', '封存'],
  fields: [
    { key: 'WRITE_DATE', label: '写信日期', placeholder: '2024年11月22日' },
    { key: 'OPEN_DATE', label: '开启日期', placeholder: '2025年11月22日' },
    { key: 'DAYS_LEFT', label: '剩余天数', placeholder: '365' },
    { key: 'TO_NAME', label: '收信人', placeholder: '一年后的我' },
    { key: 'LETTER_CONTENT', label: '信件内容', placeholder: '此刻的我正站在人生的十字路口，不知道未来会怎样。希望你能记住今天的心情，记住那些让你勇敢的瞬间。如果你看到这封信时已经实现了梦想，那就继续前行；如果还在路上，也不要气馁，至少你还记得出发时的模样。' },
    { key: 'CURRENT_MOOD', label: '当前心情', placeholder: '迷茫但充满期待' },
    { key: 'WISH', label: '许下的愿望', placeholder: '希望那时的你已经找到了自己的方向' },
    { key: 'SECRET', label: '藏在心底的话', placeholder: '其实我一直都知道你很努力，只是不敢承认自己的脆弱' }
  ],
  htmlTemplate: `
<div data-time-capsule style="max-width:340px;margin:0 auto;font-family:'Georgia','Songti SC',serif;perspective:1000px">
  
  <!-- 封闭的信封 -->
  <div data-capsule-sealed style="position:relative;cursor:pointer">
    
    <!-- 信封主体 -->
    <div style="position:relative;background:#f5e6d3;border-radius:4px;padding:0;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.15)">
      
      <!-- 信封封口（三角形） -->
      <div style="position:relative;height:0;border-left:170px solid transparent;border-right:170px solid transparent;border-top:120px solid #d4b896">
        <div style="position:absolute;top:-120px;left:-170px;width:0;height:0;border-left:170px solid transparent;border-right:170px solid transparent;border-top:120px solid #e8d4b8"></div>
      </div>
      
      <!-- 火漆印章 -->
      <div style="position:absolute;top:80px;left:50%;transform:translateX(-50%);width:60px;height:60px;background:#8b0000;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(139,0,0,0.4)">
        <div style="color:#d4af37;font-size:24px;font-weight:bold;font-family:serif">封</div>
      </div>
      
      <!-- 信封正面 -->
      <div style="background:#f5e6d3;padding:40px 30px 30px">
        
        <!-- 时间戳 -->
        <div style="text-align:center;margin-bottom:30px;padding:20px;background:rgba(212,184,150,0.2);border-radius:4px">
          <div style="font-size:48px;font-weight:bold;color:#8b4513;line-height:1;font-family:'Arial',sans-serif">{{DAYS_LEFT}}</div>
          <div style="font-size:13px;color:#8b4513;margin-top:8px;letter-spacing:2px">距离开启还有 · 天</div>
        </div>
        
        <!-- 收件信息 -->
        <div style="border:2px solid #d4b896;border-radius:4px;padding:16px;background:#fff;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;margin-bottom:12px">
            <div>
              <div style="font-size:11px;color:#999;margin-bottom:4px">寄出</div>
              <div style="font-size:13px;color:#333">{{WRITE_DATE}}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:11px;color:#999;margin-bottom:4px">送达</div>
              <div style="font-size:13px;color:#8b4513;font-weight:600">{{OPEN_DATE}}</div>
            </div>
          </div>
          <div style="border-top:1px dashed #e0e0e0;padding-top:12px">
            <div style="font-size:11px;color:#999;margin-bottom:4px">收件人</div>
            <div style="font-size:15px;color:#333;font-weight:500">{{TO_NAME}}</div>
          </div>
        </div>
        
        <!-- 当前状态 -->
        <div style="background:rgba(139,69,19,0.05);border-left:3px solid #8b4513;padding:12px;border-radius:2px">
          <div style="font-size:11px;color:#8b4513;margin-bottom:4px;letter-spacing:1px">寄出时的心情</div>
          <div style="font-size:13px;color:#333;line-height:1.6">{{CURRENT_MOOD}}</div>
        </div>
        
      </div>
      
      <!-- 底部提示 -->
      <div style="background:#d4b896;padding:12px;text-align:center">
        <div style="font-size:12px;color:#5d4e37;letter-spacing:1px">轻触信封查看完整内容</div>
      </div>
      
    </div>
  </div>
  
  <!-- 展开的信纸 -->
  <div data-capsule-opened style="display:none">
    
    <!-- 信纸 -->
    <div style="background:#fffef7;border:1px solid #e8d4b8;border-radius:4px;padding:30px 24px;box-shadow:0 4px 20px rgba(0,0,0,0.1);position:relative">
      
      <!-- 信纸纹理 -->
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:repeating-linear-gradient(transparent,transparent 25px,rgba(139,69,19,0.03) 25px,rgba(139,69,19,0.03) 26px);pointer-events:none"></div>
      
      <!-- 信纸内容 -->
      <div style="position:relative;z-index:1">
        
        <!-- 信头 -->
        <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #e8d4b8">
          <div style="font-size:11px;color:#999;letter-spacing:2px;margin-bottom:4px">TIME CAPSULE</div>
          <div style="font-size:16px;color:#8b4513;font-weight:600">时间胶囊</div>
        </div>
        
        <!-- 收信人 -->
        <div style="margin-bottom:20px">
          <div style="font-size:14px;color:#8b4513">亲爱的 {{TO_NAME}}：</div>
        </div>
        
        <!-- 正文 -->
        <div style="margin-bottom:24px;text-indent:2em;line-height:1.8;font-size:14px;color:#333;white-space:pre-wrap">{{LETTER_CONTENT}}</div>
        
        <!-- 愿望 -->
        <div style="margin-bottom:20px;padding:16px;background:rgba(255,235,205,0.5);border-left:3px solid #daa520;border-radius:2px">
          <div style="font-size:12px;color:#8b4513;margin-bottom:8px;font-weight:600">许下的愿望</div>
          <div style="font-size:13px;line-height:1.6;color:#333">{{WISH}}</div>
        </div>
        
        <!-- 秘密 -->
        <div style="margin-bottom:24px;padding:16px;background:rgba(245,230,211,0.6);border-radius:2px;border:1px dashed #d4b896">
          <div style="font-size:12px;color:#8b4513;margin-bottom:8px;font-style:italic">藏在心底的话</div>
          <div style="font-size:13px;line-height:1.6;color:#555;font-style:italic">{{SECRET}}</div>
        </div>
        
        <!-- 落款 -->
        <div style="text-align:right;margin-top:30px">
          <div style="font-size:13px;color:#666;margin-bottom:8px">过去的自己</div>
          <div style="font-size:14px;color:#8b4513;font-weight:500">{{WRITE_DATE}}</div>
        </div>
        
        <!-- 邮戳 -->
        <div style="position:absolute;top:20px;right:20px;width:80px;height:80px;border:3px solid rgba(139,0,0,0.3);border-radius:50%;display:flex;align-items:center;justify-content:center;transform:rotate(-15deg)">
          <div style="text-align:center">
            <div style="font-size:10px;color:rgba(139,0,0,0.5);font-weight:600">已送达</div>
            <div style="font-size:9px;color:rgba(139,0,0,0.4);margin-top:2px">{{OPEN_DATE}}</div>
          </div>
        </div>
        
      </div>
    </div>
  </div>
  
</div>
  `.trim()
}
