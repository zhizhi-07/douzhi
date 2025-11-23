import { TheatreTemplate } from '../../theatreTemplates'

export const marriageCertificateTemplate: TheatreTemplate = {
    id: 'marriage_certificate',
    category: '证件文书',
    name: '结婚证',
    keywords: ['结婚证', '结婚', '领证', '婚姻', '红本本'],
    fields: [
      { key: 'HOLDER', label: '持证人', placeholder: '张三' },
      { key: 'REG_DATE', label: '登记日期', placeholder: '2024年05月20日' },
      { key: 'ID_CODE', label: '证件编号', placeholder: 'J110101-2024-000520' },
      { key: 'NAME1', label: '姓名(男)', placeholder: '张三' },
      { key: 'GENDER1', label: '性别(男)', placeholder: '男' },
      { key: 'NATIONALITY1', label: '国籍(男)', placeholder: '中国' },
      { key: 'BIRTH1', label: '出生(男)', placeholder: '1998年01月01日' },
      { key: 'ID_NUM1', label: '身份证(男)', placeholder: '110101199801011234' },
      { key: 'NAME2', label: '姓名(女)', placeholder: '李四' },
      { key: 'GENDER2', label: '性别(女)', placeholder: '女' },
      { key: 'NATIONALITY2', label: '国籍(女)', placeholder: '中国' },
      { key: 'BIRTH2', label: '出生(女)', placeholder: '1999年02月02日' },
      { key: 'ID_NUM2', label: '身份证(女)', placeholder: '110101199902025678' },
    ],
    htmlTemplate: `
<div data-certificate style="max-width: 400px; margin: 0 auto; perspective: 1500px; cursor: pointer; user-select: none;">
  <div class="cert-book" style="position: relative; width: 100%; height: 280px; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
    
    <!-- 封面 -->
    <div class="cert-cover" style="position: absolute; inset: 0; background: #a31d1d; border-radius: 4px 8px 8px 4px; box-shadow: 2px 5px 15px rgba(0,0,0,0.3); z-index: 2; backface-visibility: hidden; transform-origin: left;">
      <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBvcGFjaXR5PSIwLjAzIiLz48L3N2Zz4='); pointer-events: none;"></div>
      <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #ffd700;">
        <div style="font-size: 60px; margin-bottom: 20px; text-shadow: 0 2px 2px rgba(0,0,0,0.3);">国</div>
        <div style="font-size: 24px; font-weight: bold; font-family: 'SimSun', 'Songti SC', serif; letter-spacing: 5px;">中华人民共和国</div>
        <div style="font-size: 36px; font-weight: bold; font-family: 'SimSun', 'Songti SC', serif; margin-top: 15px; letter-spacing: 8px;">结婚证</div>
      </div>
      <div style="position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: rgba(0,0,0,0.2);"></div>
    </div>

    <!-- 内页 -->
    <div class="cert-inner" style="position: absolute; inset: 0; background: #fdfbf7; border-radius: 4px 8px 8px 4px; transform: rotateY(180deg); backface-visibility: hidden; display: flex; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.05);">
      <!-- 背景花纹 -->
      <div style="position: absolute; inset: 0; opacity: 0.05; background: repeating-radial-gradient(circle at center, #e74c3c 0, #e74c3c 1px, transparent 2px, transparent 10px); pointer-events: none;"></div>
      
      <!-- 左页 (照片) -->
      <div style="flex: 1; padding: 15px; border-right: 1px solid rgba(0,0,0,0.1); position: relative;">
        <div style="border: 1px solid #ddd; height: 140px; margin-bottom: 10px; background: #eee; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <div style="font-size: 40px; color: #ccc;">Photo</div>
          <div style="position: absolute; bottom: 5px; right: 5px; width: 40px; height: 40px; border: 2px solid rgba(255,0,0,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(255,0,0,0.3); font-size: 10px; font-weight: bold; transform: rotate(-20deg);">钢印</div>
        </div>
        <div style="font-size: 10px; color: #333; line-height: 1.5;">
          <div><span style="color:#666">持证人：</span>{{HOLDER}}</div>
          <div><span style="color:#666">登记日期：</span>{{REG_DATE}}</div>
          <div><span style="color:#666">结婚证字号：</span></div>
          <div style="font-family: monospace;">{{ID_CODE}}</div>
        </div>
      </div>

      <!-- 右页 (信息) -->
      <div style="flex: 1.2; padding: 15px; position: relative;">
        <div style="font-size: 10px; line-height: 1.6; color: #333;">
          <div style="margin-bottom: 8px;">
            <div><span style="color:#666">姓名：</span>{{NAME1}}</div>
            <div><span style="color:#666">性别：</span>{{GENDER1}} &nbsp; <span style="color:#666">国籍：</span>{{NATIONALITY1}}</div>
            <div><span style="color:#666">出生日期：</span>{{BIRTH1}}</div>
            <div><span style="color:#666">身份证号：</span>{{ID_NUM1}}</div>
          </div>
          <div style="border-top: 1px dashed #ccc; margin: 5px 0;"></div>
          <div>
            <div><span style="color:#666">姓名：</span>{{NAME2}}</div>
            <div><span style="color:#666">性别：</span>{{GENDER2}} &nbsp; <span style="color:#666">国籍：</span>{{NATIONALITY2}}</div>
            <div><span style="color:#666">出生日期：</span>{{BIRTH2}}</div>
            <div><span style="color:#666">身份证号：</span>{{ID_NUM2}}</div>
          </div>
        </div>
        
        <div style="position: absolute; bottom: 15px; right: 15px; width: 60px; height: 60px; border: 2px solid #ff0000; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ff0000; font-size: 10px; font-weight: bold; opacity: 0.6; transform: rotate(-15deg);">
          <div style="text-align: center;">婚姻登记<br>专用章</div>
        </div>
      </div>
    </div>
    
  </div>
  <div style="text-align: center; margin-top: 10px; font-size: 12px; color: #999;">点击翻开查看</div>
</div>
    `.trim()
  }

