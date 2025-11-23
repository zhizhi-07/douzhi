import { TheatreTemplate } from '../../theatreTemplates'

export const mbtiTestTemplate: TheatreTemplate = {
    id: 'mbti_test',
    category: '测试娱乐',
    name: 'MBTI人格测试',
    keywords: ['MBTI', '人格测试', '性格分析', '16型人格'],
    fields: [
      { key: 'RESULT_TYPE', label: '结果类型', placeholder: 'ENFP-A' },
      { key: 'TYPE_NAME', label: '类型名称', placeholder: '竞选者' },
      { key: 'INTRO_SCORE', label: '内向分数', placeholder: '65' },
      { key: 'SENSING_SCORE', label: '直觉分数', placeholder: '42' },
      { key: 'FEELING_SCORE', label: '情感分数', placeholder: '78' },
      { key: 'JUDGING_SCORE', label: '展望分数', placeholder: '33' },
      { key: 'DESCRIPTION', label: '性格描述', placeholder: '竞选者（ENFP）是真正富有自由精神的人...' },
      { key: 'ANALYSIS', label: '详细分析', placeholder: '你的能量来源于与人交往，直觉让你能敏锐地捕捉到他人的情绪变化...' },
      { key: 'CAREER_ADVICE', label: '职业建议', placeholder: '适合职业：心理咨询师、创意总监、公关专员、记者。' },
      { key: 'RELATIONSHIP_ADVICE', label: '情感建议', placeholder: '你渴望深度的灵魂共鸣，适合与INTJ或INFJ类型的伴侣相处。' },
      { key: 'TAGS', label: '标签', placeholder: '#充满热情 #独立 #富有魅力' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: #1e1e2e; border-radius: 20px; overflow: hidden; font-family: 'Segoe UI', sans-serif; color: white; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
  <!-- 顶部光效 -->
  <div style="position: absolute; top: -50px; left: 50%; transform: translateX(-50%); width: 200px; height: 100px; background: #2ecc71; filter: blur(60px); opacity: 0.4;"></div>
  
  <div style="padding: 30px 20px; position: relative; z-index: 1;">
    <div style="text-align: center; margin-bottom: 30px; cursor: pointer;" data-action="show-type-detail">
      <div style="font-size: 12px; letter-spacing: 2px; color: rgba(255,255,255,0.6); margin-bottom: 5px;">PERSONALITY TEST</div>
      <div style="font-size: 42px; font-weight: 900; background: linear-gradient(45deg, #2ecc71, #3498db); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">{{RESULT_TYPE}}</div>
      <div style="font-size: 18px; margin-top: 5px; font-weight: bold;">{{TYPE_NAME}} <span style="font-size:12px; opacity:0.5">ℹ️</span></div>
      <div style="margin-top: 10px; font-size: 12px; color: #2ecc71; border: 1px solid #2ecc71; display: inline-block; padding: 2px 8px; border-radius: 10px;">稀有度: 前 5%</div>
    </div>

    <!-- 维度进度条 -->
    <div style="display: flex; flex-direction: column; gap: 15px;">
      <!-- 维度 E/I -->
      <div style="cursor: pointer;" data-action="show-dim-detail" data-dim="ei">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="color: #3498db;">Extroverted</span>
          <span style="color: #95a5a6;">Introverted</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; position: relative;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: {{INTRO_SCORE}}%; background: #3498db; border-radius: 4px; transition: width 1s ease-out;"></div>
        </div>
      </div>

      <!-- 维度 N/S -->
      <div style="cursor: pointer;" data-action="show-dim-detail" data-dim="ns">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="color: #f1c40f;">Intuitive</span>
          <span style="color: #95a5a6;">Observant</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; position: relative;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: {{SENSING_SCORE}}%; background: #f1c40f; border-radius: 4px; transition: width 1s ease-out;"></div>
        </div>
      </div>

      <!-- 维度 T/F -->
      <div style="cursor: pointer;" data-action="show-dim-detail" data-dim="tf">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="color: #e74c3c;">Thinking</span>
          <span style="color: #95a5a6;">Feeling</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; position: relative;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: {{FEELING_SCORE}}%; background: #e74c3c; border-radius: 4px; transition: width 1s ease-out;"></div>
        </div>
      </div>

      <!-- 维度 J/P -->
      <div style="cursor: pointer;" data-action="show-dim-detail" data-dim="jp">
        <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 6px;">
          <span style="color: #9b59b6;">Judging</span>
          <span style="color: #95a5a6;">Prospecting</span>
        </div>
        <div style="height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden; position: relative;">
          <div style="position: absolute; left: 0; top: 0; height: 100%; width: {{JUDGING_SCORE}}%; background: #9b59b6; border-radius: 4px; transition: width 1s ease-out;"></div>
        </div>
      </div>
    </div>

    <!-- 描述 -->
    <div style="margin-top: 25px; font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; cursor: pointer;" data-action="show-desc-detail">
      {{DESCRIPTION}}
      <div style="text-align: right; font-size: 10px; opacity: 0.5; margin-top: 5px;">点击查看深度解析</div>
    </div>
    
    <div style="margin-top: 15px; font-size: 12px; color: #2ecc71; font-style: italic;">
      {{TAGS}}
    </div>
  </div>
  
  <!-- 隐藏数据 -->
  <div hidden data-analysis>{{ANALYSIS}}</div>
  <div hidden data-career>{{CAREER_ADVICE}}</div>
  <div hidden data-relationship>{{RELATIONSHIP_ADVICE}}</div>
</div>
    `.trim()
  }
