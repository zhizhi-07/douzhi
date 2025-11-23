import { TheatreTemplate } from '../../theatreTemplates'

export const adultShopTemplate: TheatreTemplate = {
    id: 'adult_shop',
    category: '生活消费',
    name: '情趣商城订单',
    keywords: ['情趣用品', '成人用品', '订单', '快递'],
    fields: [
      { key: 'PRODUCT1_NAME', label: '商品1名称', placeholder: '小怪兽远程遥控版' },
      { key: 'PRODUCT1_SPEC', label: '商品1规格', placeholder: '樱花粉 / 静音版' },
      { key: 'PRODUCT1_PRICE', label: '商品1价格', placeholder: '299' },
      { key: 'PRODUCT1_STATUS', label: '商品1状态', placeholder: '已拆封 - 昨晚试用' },
      { key: 'PRODUCT1_NOTE', label: '商品1体验/幻想', placeholder: '震动模式太惊喜了，完全没想到...期待下次试试远程功能。' },
      { key: 'PRODUCT2_NAME', label: '商品2名称（可选）', placeholder: '人体润滑液' },
      { key: 'PRODUCT2_SPEC', label: '商品2规格', placeholder: '200ml / 玻尿酸' },
      { key: 'PRODUCT2_PRICE', label: '商品2价格', placeholder: '59' },
      { key: 'PRODUCT2_STATUS', label: '商品2状态（可选）', placeholder: '全新未拆' },
      { key: 'PRODUCT2_NOTE', label: '商品2体验/幻想（可选）', placeholder: '囤货备用，据说这款保湿效果很好。' },
      { key: 'TOTAL_AMOUNT', label: '总金额', placeholder: '358' },
      { key: 'ORDER_NO', label: '订单号', placeholder: '882910234819' },
      { key: 'SHIPPING_METHOD', label: '配送方式', placeholder: '保密发货' },
      { key: 'DISCREET_LABEL', label: '面单品名（保密用）', placeholder: '日用品 / 办公耗材' }
    ],
    htmlTemplate: `
<div data-adult-shop style="max-width: 320px; margin: 0 auto; font-family: 'Courier New', monospace; perspective: 1000px; user-select: none;">
  <div class="box-container" style="position: relative; width: 100%; height: 420px; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);">
    
    <!-- 1. 外包装 (快递盒) -->
    <div class="package-box" style="position: absolute; inset: 0; background: #d4a373; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); display: flex; flex-direction: column; backface-visibility: hidden; z-index: 2;">
      <!-- 顶部面单 -->
      <div style="background: #fff; margin: 20px; padding: 15px; border-radius: 4px; font-family: sans-serif; position: relative; overflow: hidden;">
        <!-- 撕开条 -->
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 4px; background: repeating-linear-gradient(45deg, #ff4757, #ff4757 10px, #fff 10px, #fff 20px);"></div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #ccc; padding-bottom: 10px;">
          <div style="font-weight: bold; font-size: 16px;">顺丰速运</div>
          <div style="font-size: 12px; color: #666;">{{ORDER_NO}}</div>
        </div>
        <div style="font-size: 12px; color: #333; line-height: 1.6;">
          <div><span style="color:#999">寄件人：</span>严选仓储中心</div>
          <div><span style="color:#999">品名：</span><span style="font-weight:bold">{{DISCREET_LABEL}}</span></div>
          <div><span style="color:#999">备注：</span>{{SHIPPING_METHOD}} / 存放丰巢</div>
        </div>
        <div style="margin-top: 15px; text-align: center;">
          <svg width="100%" height="30" viewBox="0 0 200 30" preserveAspectRatio="none">
            <rect x="0" y="0" width="200" height="30" fill="url(#barcode)" />
            <defs>
              <pattern id="barcode" width="4" height="100%" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="2" height="100%" fill="#000" />
              </pattern>
            </defs>
          </svg>
        </div>
      </div>
      
      <!-- 封箱胶带 -->
      <div style="height: 40px; background: rgba(255,255,255,0.3); margin: 0 20px; transform: rotate(-2deg);"></div>
      
      <div style="margin-top: auto; padding: 20px; text-align: center; color: rgba(0,0,0,0.4); font-size: 12px;">
        Tap to Open Package
      </div>
    </div>

    <!-- 2. 内部清单 (背面) -->
    <div class="content-receipt" style="position: absolute; inset: 0; background: #fff; border-radius: 8px; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); transform: rotateY(180deg); backface-visibility: hidden; display: flex; flex-direction: column;">
      <div style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #eee; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; color: #2d3436;">购物清单</div>
        <div style="font-size: 12px; color: #b2bec3; margin-top: 5px;">私密发货 · 放心购物</div>
      </div>
      
      <div style="flex: 1; padding: 20px; overflow-y: auto; position: relative;">
        <!-- 商品列表 -->
        <div class="product-item" data-status="{{PRODUCT1_STATUS}}" data-note="{{PRODUCT1_NOTE}}" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #eee; cursor: pointer; position: relative;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div style="font-weight: bold; filter: blur(5px); transition: filter 0.5s;">{{PRODUCT1_NAME}}</div>
            <div>¥{{PRODUCT1_PRICE}}</div>
          </div>
          <div style="font-size: 12px; color: #666;">规格：{{PRODUCT1_SPEC}}</div>
          <div class="hint-text" style="font-size: 10px; color: #ff7675; opacity: 0; transform: translateY(5px); transition: all 0.3s;">Tap again for details</div>
        </div>
        
        <div class="product-item" data-status="{{PRODUCT2_STATUS}}" data-note="{{PRODUCT2_NOTE}}" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px dashed #eee; cursor: pointer; display: {{PRODUCT2_NAME}} ? 'block' : 'none';">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <div style="font-weight: bold; filter: blur(5px); transition: filter 0.5s;">{{PRODUCT2_NAME}}</div>
            <div>¥{{PRODUCT2_PRICE}}</div>
          </div>
          <div style="font-size: 12px; color: #666;">规格：{{PRODUCT2_SPEC}}</div>
          <div class="hint-text" style="font-size: 10px; color: #ff7675; opacity: 0; transform: translateY(5px); transition: all 0.3s;">Tap again for details</div>
        </div>

        <!-- 秘密便签 (默认隐藏) -->
        <div class="secret-note" style="position: absolute; bottom: 10px; left: 10px; right: 10px; background: #ffeaa7; padding: 15px; transform: rotate(-2deg) translateY(120%); transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: 0 5px 15px rgba(0,0,0,0.2); font-family: 'Segoe Print', 'Comic Sans MS', cursive; color: #2d3436; border-radius: 2px; z-index: 10;">
          <!-- 胶带效果 -->
          <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 40px; height: 20px; background: rgba(255,255,255,0.5);"></div>
          
          <div class="note-status" style="font-size: 12px; color: #e17055; margin-bottom: 5px; font-weight: bold;"></div>
          <div class="note-content" style="font-size: 14px; line-height: 1.5;"></div>
          
          <div class="close-note" style="position: absolute; top: 5px; right: 8px; cursor: pointer; font-size: 16px; opacity: 0.5;">×</div>
        </div>
      </div>
      
      <div style="background: #fff; padding: 20px; border-top: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
          <span>Total</span>
          <span style="color: #e17055;">¥{{TOTAL_AMOUNT}}</span>
        </div>
        <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #999;">
          点击商品查看隐藏的使用记录
        </div>
      </div>
    </div>
    
  </div>
</div>
    `.trim()
}
