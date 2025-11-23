import { TheatreTemplate } from '../../theatreTemplates'

export const divorceCertificateTemplate: TheatreTemplate = {
    id: 'divorce_certificate',
    category: '证件文书',
    name: '离婚证',
    keywords: ['离婚证', '离婚', '离婚证明', '绿本本'],
    fields: [
      { key: 'HOLDER', label: '持证人', placeholder: '张三' },
      { key: 'REG_DATE', label: '登记日期', placeholder: '2025年01月15日' },
      { key: 'ID_CODE', label: '证件编号', placeholder: 'L110101-2025-000111' },
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'GENDER', label: '性别', placeholder: '男' },
      { key: 'NATIONALITY', label: '国籍', placeholder: '中国' },
      { key: 'BIRTH', label: '出生日期', placeholder: '1998年01月01日' },
      { key: 'ID_NUM', label: '身份证号', placeholder: '110101199801011234' },
    ],
    htmlTemplate: `
<div data-certificate style="max-width: 400px; margin: 0 auto; perspective: 1500px; cursor: pointer; user-select: none;">
  <div class="cert-book" style="position: relative; width: 100%; height: 280px; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
    
    <!-- 封面 (暗红色/紫红色) -->
    <div class="cert-cover" style="position: absolute; inset: 0; background: #722ed1; border-radius: 4px 8px 8px 4px; box-shadow: 2px 5px 15px rgba(0,0,0,0.3); z-index: 2; backface-visibility: hidden; transform-origin: left;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBvcGFjaXR5PSIwLjAzIiLz48L3N2Zz4='); pointer-events: none;"></div>
      <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffd700;">
        <div style="font-size: 60px; margin-bottom: 20px; text-shadow: 0 2px 2px rgba(0,0,0,0.3);">国</div>
        <div style="font-size: 24px; font-weight: bold; font-family: 'SimSun', 'Songti SC', serif; letter-spacing: 5px;">中华人民共和国</div>
        <div style="font-size: 36px; font-weight: bold; font-family: 'SimSun', 'Songti SC', serif; margin-top: 15px; letter-spacing: 8px;">离婚证</div>
      </div>
      <div style="position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,0.2);"></div>
    </div>

    <!-- 内页 -->
    <div class="cert-inner" style="position: absolute; inset: 0; background: #fdfbf7; border-radius: 4px 8px 8px 4px; transform: rotateY(180deg); backface-visibility: hidden; display: flex; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.05);">
      <!-- 背景花纹 -->
      <div style="position: absolute; inset: 0; opacity: 0.05; background: repeating-radial-gradient(circle at center, #722ed1 0, #722ed1 1px, transparent 2px, transparent 10px); pointer-events: none;"></div>
      
      <!-- 左页 (照片) -->
      <div style="flex: 1; padding: 15px; border-right: 1px solid rgba(0,0,0,0.1); position: relative;">
        <div style="border: 1px solid #ddd; height: 140px; margin-bottom: 10px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <div style="font-size: 40px; color: #ccc;">Photo</div>
          <div style="position: absolute; bottom: 5px; right: 5px; width: 40px; height: 40px; border: 2px solid rgba(114, 46, 209, 0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(114, 46, 209, 0.3); font-size: 10px; font-weight: bold; transform: rotate(-20deg);">钢印</div>
        </div>
        <div style="font-size: 10px; color: #333; line-height: 1.5;">
          <div><span style="color:#666">持证人：</span>{{HOLDER}}</div>
          <div><span style="color:#666">登记日期：</span>{{REG_DATE}}</div>
          <div><span style="color:#666">离婚证字号：</span></div>
          <div style="font-family: monospace;">{{ID_CODE}}</div>
        </div>
      </div>

      <!-- 右页 (信息) -->
      <div style="flex: 1.2; padding: 15px; position: relative;">
        <div style="font-size: 10px; line-height: 1.8; color: #333;">
          <div style="margin-bottom: 15px;">
            <div><span style="color:#666">姓名：</span>{{NAME}}</div>
            <div><span style="color:#666">性别：</span>{{GENDER}}</div>
            <div><span style="color:#666">国籍：</span>{{NATIONALITY}}</div>
            <div><span style="color:#666">出生日期：</span>{{BIRTH}}</div>
            <div><span style="color:#666">身份证号：</span>{{ID_NUM}}</div>
          </div>
          
          <div style="font-size: 11px; font-weight: bold; letter-spacing: 1px; margin-top: 20px;">
            双方自愿离婚，申请登记，<br>经审查，符合《中华人民<br>共和国民法典》关于离婚<br>的规定，准予登记，发给<br>此证。
          </div>
        </div>
        
        <div style="position: absolute; bottom: 15px; right: 15px; width: 60px; height: 60px; border: 2px solid #722ed1; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #722ed1; font-size: 10px; font-weight: bold; opacity: 0.6; transform: rotate(-15deg);">
          <div style="text-align: center;">婚姻登记<br>专用章</div>
        </div>
      </div>
    </div>
    
  </div>
  <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #999;">点击翻开查看</div>
</div>
    `.trim()
  }

