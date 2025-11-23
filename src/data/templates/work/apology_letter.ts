import { TheatreTemplate } from '../../theatreTemplates'

export const apologyLetterTemplate: TheatreTemplate = {
    id: 'apology_letter',
    category: '工作学习',
    name: '检讨书',
    keywords: ['检讨书', '检讨', '认错', '道歉信', '反省'],
    fields: [
      { key: 'TO_WHO', label: '致', placeholder: '亲爱的老婆 / 尊敬的领导' },
      { key: 'MISTAKE', label: '错误事项', placeholder: '昨天晚上回来晚了，还没接电话' },
      { key: 'REASON', label: '原因分析', placeholder: '和朋友聚会玩太嗨了，手机静音没听到' },
      { key: 'REFLECTION', label: '深刻反思', placeholder: '我深刻认识到自己的错误，这种行为极其不负责任，让你担心了，损害了我们之间的信任。' },
      { key: 'PROMISE', label: '整改措施', placeholder: '以后出门提前报备，手机永远开响铃，晚上10点前准时回家。如有再犯，自愿承包一个月家务。' },
      { key: 'SIGNATURE', label: '检讨人', placeholder: '爱你的老公' },
      { key: 'DATE', label: '日期', placeholder: '2025年11月21日' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; perspective: 1000px;">
  <!-- 纸张主体 -->
  <div style="
    background-color: #fdfbf7;
    background-image: repeating-linear-gradient(transparent, transparent 31px, #a2d9f5 32px);
    width: 100%;
    min-height: 500px;
    padding: 40px 24px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05), 0 10px 30px rgba(0,0,0,0.1);
    font-family: 'Kaiti SC', 'KaiTi', 'STKaiti', 'AR PL UKai CN', serif;
    color: #2c3e50;
    line-height: 32px;
    font-size: 18px;
    position: relative;
    transform-origin: top center;
    border-radius: 2px;
  ">
    <!-- 顶部红线 -->
    <div style="position: absolute; top: 40px; left: 20px; right: 20px; height: 2px; background: #e74c3c; opacity: 0.3;"></div>
    
    <!-- 标题 -->
    <div style="text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 20px; letter-spacing: 8px; color: #e74c3c; transform: scale(1, 1.1);">检讨书</div>
    
    <!-- 称呼 -->
    <div style="margin-bottom: 10px;">
      <span style="font-weight: bold;">{{TO_WHO}}：</span>
    </div>
    
    <!-- 正文内容 -->
    <div style="text-indent: 2em; text-align: justify;">
      对不起！关于<span style="text-decoration: underline; text-decoration-color: #e74c3c; padding: 0 4px;">{{MISTAKE}}</span>这件事情，我进行了深刻的自我反省。
    </div>
    
    <div style="text-indent: 2em; text-align: justify;">
      错误原因主要是：<span style="border-bottom: 1px dashed #7f8c8d;">{{REASON}}</span>。{{REFLECTION}}
    </div>
    
    <div style="text-indent: 2em; text-align: justify;">
      为了表达我的悔过之心，我保证：<span style="font-weight: bold; color: #c0392b;">{{PROMISE}}</span>
    </div>
    
    <div style="text-indent: 2em; margin-top: 10px;">
      请看我的实际行动！
    </div>
    
    <!-- 落款 -->
    <div style="margin-top: 40px; text-align: right; padding-right: 20px;">
      <div style="margin-bottom: 5px;">
        <span>检讨人：</span>
        <span style="font-size: 22px; font-family: 'Brush Script MT', cursive, 'KaiTi';">{{SIGNATURE}}</span>
        <!-- 模拟手印 -->
        <div style="display: inline-block; width: 30px; height: 40px; background: rgba(231, 76, 60, 0.4); border-radius: 50%; transform: rotate(15deg) translate(-10px, 5px); filter: blur(1px); vertical-align: middle;"></div>
      </div>
      <div style="font-size: 16px;">{{DATE}}</div>
    </div>
    
    <!-- 纸张折痕/污渍装饰 -->
    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 40%, rgba(0,0,0,0.02) 100%); pointer-events: none;"></div>
    <div style="position: absolute; bottom: 0; right: 0; width: 60px; height: 60px; background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%); border-radius: 0 0 2px 0; pointer-events: none;"></div>

  </div>
</div>
    `.trim()
  }
