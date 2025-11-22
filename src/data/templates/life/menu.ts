import { TheatreTemplate } from '../../theatreTemplates'

export const menuTemplate: TheatreTemplate = {
    id: 'menu',
    category: '生活消费',
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
  }
