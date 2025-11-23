import { TheatreTemplate } from '../../theatreTemplates'

export const postcardTemplate: TheatreTemplate = {
    id: 'postcard',
    category: '情感关系',
    name: '明信片',
    keywords: ['明信片', '寄明信片', '风景明信片'],
    fields: [
      { key: 'CONTENT', label: '正文', placeholder: '见信如晤，展信舒颜。\n\n最近这里的风景很好，想寄一份给你。\n愿你一切安好。' },
      { key: 'TO_NAME', label: '收件人', placeholder: '致亲爱的你' },
      { key: 'FROM_NAME', label: '寄件人', placeholder: '远方的朋友' },
      { key: 'ADDRESS', label: '地址', placeholder: '北京市朝阳区...' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.23' },
    ],
    htmlTemplate: `
<div onclick="this.classList.toggle('flipped')" style="width: 100%; max-width: 560px; aspect-ratio: 3/2; margin: 0 auto; perspective: 1500px; cursor: pointer; user-select: none; font-family: 'Georgia', 'SimSun', serif;">
  <div class="postcard-inner" style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.2);">
    
    <!-- 正面：封面 -->
    <div class="postcard-front" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: #fff; border-radius: 2px; overflow: hidden;">
      <!-- 画面区域：使用CSS艺术图案 -->
      <div style="position: absolute; inset: 10px; bottom: 50px; background: #e0e0e0; overflow: hidden; border: 1px solid #ddd;">
         <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%); position: relative;">
            <!-- 抽象山川 -->
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60%; background: #8b9d83; clip-path: polygon(0% 100%, 30% 40%, 60% 80%, 80% 30%, 100% 100%); opacity: 0.8;"></div>
            <div style="position: absolute; bottom: 0; left: 0; width: 100%; height: 40%; background: #5a6d52; clip-path: polygon(0% 100%, 20% 60%, 50% 90%, 100% 50%, 100% 100%); opacity: 0.9;"></div>
            <!-- 太阳 -->
            <div style="position: absolute; top: 20%; right: 20%; width: 40px; height: 40px; background: #d4c5a9; border-radius: 50%; opacity: 0.6;"></div>
         </div>
         <div style="position: absolute; inset: 0; box-shadow: inset 0 0 20px rgba(0,0,0,0.1);"></div>
      </div>
      
      <!-- 底部文字 -->
      <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 50px; display: flex; align-items: center; justify-content: center; letter-spacing: 4px; color: #555; font-size: 14px; text-transform: uppercase;">
        The Beauty of Nature
      </div>
      
      <!-- 纸张纹理 -->
      <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4='); pointer-events: none; mix-blend-mode: multiply;"></div>
    </div>

    <!-- 背面：写字面 -->
    <div class="postcard-back" style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); background: #fcfcf9; border-radius: 2px; padding: 20px 24px; display: flex; flex-direction: column; color: #2c3e50;">
      <!-- 纸张纹理 -->
      <div style="position: absolute; inset: 0; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNjY2MiIG9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4='); pointer-events: none; opacity: 0.6;"></div>
      
      <!-- 顶部区域 -->
      <div style="height: 80px; position: relative; margin-bottom: 10px;">
         <!-- 邮票 -->
         <div style="position: absolute; top: 0; right: 0; width: 50px; height: 60px; padding: 4px; background: white; box-shadow: 1px 1px 2px rgba(0,0,0,0.15); transform: rotate(1deg);">
           <div style="width: 100%; height: 100%; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; background: radial-gradient(circle, #8b9d83 1px, transparent 1.5px) 0 0/4px 4px;">
             <span style="font-size: 10px; color: #5a6d52; font-weight: bold;">80分</span>
           </div>
         </div>
         
         <!-- 邮戳 -->
         <div style="position: absolute; top: 10px; right: 35px; width: 70px; height: 70px; border: 2px solid rgba(50, 50, 50, 0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; transform: rotate(-12deg); pointer-events: none; opacity: 0.7;">
           <div style="text-align: center; font-size: 9px; line-height: 1.2; font-weight: bold; color: rgba(50, 50, 50, 0.8);">
             POST<br>
             <span style="font-size: 11px;">{{DATE}}</span><br>
             OFFICE
           </div>
         </div>
      </div>

      <!-- 下部区域：分栏 -->
      <div style="flex: 1; display: flex; position: relative; z-index: 1;">
        <!-- 分隔线 -->
        <div style="position: absolute; left: 56%; top: 10px; bottom: 10px; width: 1px; background: #e0e0e0;"></div>

        <!-- 左侧：内容 -->
        <div style="flex: 1.3; padding-right: 25px; display: flex; flex-direction: column;">
          <div style="font-size: 15px; line-height: 1.8; text-align: left; white-space: pre-wrap; font-family: 'KaiTi', 'STKaiti', serif;">{{CONTENT}}</div>
          <div style="margin-top: auto; text-align: right; padding-top: 15px;">
             <div style="font-size: 14px; font-family: 'KaiTi', 'STKaiti', serif;">—— {{FROM_NAME}}</div>
          </div>
        </div>

        <!-- 右侧：地址 -->
        <div style="flex: 1; padding-left: 20px; padding-top: 40px; display: flex; flex-direction: column; gap: 28px;">
          <div style="position: relative; border-bottom: 1px solid #ddd; height: 24px;">
             <span style="position: absolute; bottom: 4px; left: 0; font-size: 15px; font-weight: bold;">TO: {{TO_NAME}}</span>
          </div>
          <div style="position: relative; border-bottom: 1px solid #ddd; height: 24px;">
             <span style="position: absolute; bottom: 4px; left: 0; font-size: 13px; width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ADDRESS}}</span>
          </div>
          <div style="border-bottom: 1px solid #ddd; height: 24px;"></div>
          <div style="border-bottom: 1px solid #ddd; height: 24px;"></div>
        </div>
      </div>
    </div>

  </div>
</div>
<style>
.flipped .postcard-inner {
  transform: rotateY(180deg);
}
</style>
    `.trim()
  }
