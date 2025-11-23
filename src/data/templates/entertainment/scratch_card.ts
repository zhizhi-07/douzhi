import { TheatreTemplate } from '../../theatreTemplates'

export const scratchCardTemplate: TheatreTemplate = {
    id: 'scratch_card',
    category: '娱乐休闲',
    name: '停车票刮刮乐',
    keywords: ['刮刮乐', '停车票', '罚单', '贴条', '恶搞'],
    fields: [
      { key: 'DATE', label: '时间', placeholder: '2025-11-23 14:30' },
      { key: 'LOCATION', label: '地点', placeholder: '你的心里' },
      { key: 'PLATE', label: '车牌号', placeholder: '京A·52013' },
      { key: 'REASON', label: '违停原因', placeholder: '长期占用我心里的位置' },
      { key: 'PRIZE', label: '处罚决定', placeholder: '罚亲亲一百次' },
      { key: 'CODE', label: '编号', placeholder: 'NO.888888' },
    ],
    htmlTemplate: `
<div data-scratch-card style="max-width: 320px; margin: 0 auto; background: #fff; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: 'SimHei', sans-serif; overflow: hidden; border: 1px solid #e0e0e0;">
  <!-- 顶部红条 -->
  <div style="background: #e53935; padding: 16px 0; text-align: center; position: relative;">
    <div style="color: #fff; font-size: 20px; font-weight: bold; letter-spacing: 2px; border: 2px solid #fff; display: inline-block; padding: 4px 12px;">告知单</div>
    <div style="color: rgba(255,255,255,0.8); font-size: 10px; margin-top: 6px; letter-spacing: 1px;">机动车停放提醒</div>
  </div>
  
  <!-- 票据内容 -->
  <div style="padding: 20px 20px 10px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px dashed #ccc; padding-bottom: 12px;">
      <div style="font-size: 12px; color: #666;">编号 NO.</div>
      <div style="font-size: 14px; font-family: monospace; color: #333; font-weight: bold;">{{CODE}}</div>
    </div>
    
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">车牌号码</div>
      <div style="font-size: 16px; color: #333; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">{{PLATE}}</div>
    </div>
    
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">停放地点</div>
      <div style="font-size: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px;">{{LOCATION}}</div>
    </div>
    
    <div style="margin-bottom: 12px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">停放时间</div>
      <div style="font-size: 15px; color: #333; border-bottom: 1px solid #eee; padding-bottom: 4px;">{{DATE}}</div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <div style="font-size: 12px; color: #999; margin-bottom: 4px;">违规行为</div>
      <div style="font-size: 15px; color: #e53935; font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px;">{{REASON}}</div>
    </div>
    
    <!-- 刮奖区域 (模拟处罚结果) -->
    <div style="margin-top: 8px;">
      <div style="font-size: 13px; color: #333; font-weight: bold; margin-bottom: 8px; display: flex; align-items: center;">
        <span style="width: 4px; height: 14px; background: #e53935; margin-right: 6px; display: inline-block;"></span>
        处理结果 (刮开查看)
      </div>
      
      <div style="position: relative; height: 80px; border-radius: 4px; overflow: hidden; border: 1px dashed #999;">
        <!-- 结果内容（底层） -->
        <div data-prize-content style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: #fffdf0; color: #e53935; font-size: 20px; font-weight: bold; padding: 0 10px; text-align: center; line-height: 1.2;">
          {{PRIZE}}
        </div>
        
        <!-- Canvas刮层（顶层覆盖） -->
        <canvas 
          data-scratch-canvas
          width="280" 
          height="80"
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair;"
        ></canvas>
      </div>
    </div>
  </div>
  
  <!-- 底部印章装饰 -->
  <div style="padding: 10px 20px 20px; text-align: right;">
    <div style="display: inline-block; width: 80px; height: 80px; border: 3px solid rgba(229, 57, 53, 0.3); border-radius: 50%; position: relative; transform: rotate(-15deg); margin-top: -40px; pointer-events: none;">
      <div style="position: absolute; width: 100%; top: 50%; transform: translateY(-50%); text-align: center; color: rgba(229, 57, 53, 0.3); font-size: 12px; font-weight: bold;">恋爱执法大队</div>
      <div style="position: absolute; width: 100%; bottom: 15px; text-align: center; color: rgba(229, 57, 53, 0.3); font-size: 10px;">专用章</div>
    </div>
  </div>
</div>
    `.trim()
  }
