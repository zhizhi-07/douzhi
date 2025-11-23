import { TheatreTemplate } from '../../theatreTemplates'

export const menuTemplate: TheatreTemplate = {
    id: 'menu',
    category: '生活消费',
    name: '菜单',
    keywords: ['菜单', '点菜', '餐单'],
    fields: [
      { key: 'RESTAURANT', label: '餐厅名', placeholder: 'Lumière' },
      { key: 'STORY', label: '餐厅故事/欢迎语', placeholder: '始于1985年，我们致力于探索食材的本真味道。每一道菜肴都承载着主厨对季节的理解与对土地的敬意。' },
      { key: 'DISH1', label: '前菜', placeholder: '黑松露扇贝' },
      { key: 'DESC1', label: '前菜描述', placeholder: '北海道扇贝佐以佩里戈尔黑松露，搭配柠檬黄油泡沫，口感细腻层次丰富。' },
      { key: 'PRICE1', label: '价格1', placeholder: '128' },
      { key: 'DISH2', label: '主菜', placeholder: '惠灵顿牛排' },
      { key: 'DESC2', label: '主菜描述', placeholder: '严选M9及菲力牛排，包裹帕尔马火腿与蘑菇酱，酥皮金黄酥脆，肉汁丰盈。' },
      { key: 'PRICE2', label: '价格2', placeholder: '388' },
      { key: 'DISH3', label: '汤品', placeholder: '法式洋葱汤' },
      { key: 'DESC3', label: '汤品描述', placeholder: '长时间慢火熬制，覆盖格鲁耶尔芝士焗烤，香浓暖胃。' },
      { key: 'PRICE3', label: '价格3', placeholder: '58' },
      { key: 'DISH4', label: '副菜', placeholder: '香煎鹅肝' },
      { key: 'DESC4', label: '副菜描述', placeholder: '外焦里嫩的露杰鹅肝，搭配红酒无花果酱，入口即化。' },
      { key: 'PRICE4', label: '价格4', placeholder: '158' },
      { key: 'DISH5', label: '主食', placeholder: '黑松露烩饭' },
      { key: 'DESC5', label: '主食描述', placeholder: '意大利Arborio米，吸饱高汤精华，撒上新鲜黑松露片。' },
      { key: 'PRICE5', label: '价格5', placeholder: '88' },
      { key: 'DISH6', label: '甜点', placeholder: '熔岩巧克力' },
      { key: 'DESC6', label: '甜点描述', placeholder: '70%法芙娜黑巧制作，切开后热巧克力如熔岩般流出。' },
      { key: 'PRICE6', label: '价格6', placeholder: '68' },
    ],
    htmlTemplate: `
<div data-menu-book style="perspective: 1500px; width: 340px; margin: 0 auto; height: 520px; cursor: pointer;">
  <div data-book-inner style="position: relative; width: 100%; height: 100%; text-align: center; transition: transform 1.2s cubic-bezier(0.645, 0.045, 0.355, 1); transform-style: preserve-3d;">
    
    <!-- 封面 (Front) -->
    <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 4px 12px 12px 4px; background-color: #3e2723; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4='), linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 10%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.2) 100%); box-shadow: 10px 10px 30px rgba(0,0,0,0.4), inset 3px 0 5px rgba(0,0,0,0.3);">
      <!-- 封面装饰框 -->
      <div style="position: absolute; top: 20px; left: 20px; right: 20px; bottom: 20px; border: 2px solid #c5a065; border-radius: 2px;">
        <!-- 角落花纹 -->
        <div style="position: absolute; top: 4px; left: 4px; width: 40px; height: 40px; border-top: 2px solid #c5a065; border-left: 2px solid #c5a065;"></div>
        <div style="position: absolute; top: 4px; right: 4px; width: 40px; height: 40px; border-top: 2px solid #c5a065; border-right: 2px solid #c5a065;"></div>
        <div style="position: absolute; bottom: 4px; left: 4px; width: 40px; height: 40px; border-bottom: 2px solid #c5a065; border-left: 2px solid #c5a065;"></div>
        <div style="position: absolute; bottom: 4px; right: 4px; width: 40px; height: 40px; border-bottom: 2px solid #c5a065; border-right: 2px solid #c5a065;"></div>
      </div>
      
      <!-- 封面内容 -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 80%;">
        <div style="font-family: 'Times New Roman', serif; color: #c5a065; letter-spacing: 6px; font-size: 12px; margin-bottom: 20px;">EST. 1985</div>
        <div style="font-family: 'Playfair Display', serif; color: #e6c893; font-size: 42px; font-weight: bold; margin-bottom: 10px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">MENU</div>
        <div style="width: 60px; height: 2px; background: #c5a065; margin: 20px auto;"></div>
        <div style="font-family: 'Georgia', serif; color: #c5a065; font-size: 18px; font-style: italic;">{{RESTAURANT}}</div>
      </div>
      
      <div style="position: absolute; bottom: 40px; width: 100%; text-align: center; color: rgba(197, 160, 101, 0.6); font-size: 10px; letter-spacing: 2px;">TAP TO OPEN</div>
    </div>

    <!-- 内页 (Back) -->
    <div style="position: absolute; width: 100%; height: 100%; backface-visibility: hidden; transform: rotateY(180deg); border-radius: 4px 12px 12px 4px; background-color: #fdfbf7; background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZDdkM2NhIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8L3N2Zz4='), linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 5%, rgba(0,0,0,0) 95%, rgba(0,0,0,0.05) 100%); box-shadow: -10px 10px 30px rgba(0,0,0,0.2); color: #2c1e1e; font-family: 'Georgia', serif; overflow: hidden; display: flex; flex-direction: column;">
      
      <!-- 内页装饰 -->
      <div style="position: absolute; left: 0; top: 0; bottom: 0; width: 24px; background: linear-gradient(to right, rgba(0,0,0,0.1), transparent); border-right: 1px solid rgba(0,0,0,0.05);"></div>
      
      <!-- 内页内容容器 -->
      <div style="padding: 32px 24px 24px 36px; text-align: left; height: 100%; box-sizing: border-box; display: flex; flex-direction: column;">
        <!-- 餐厅名与故事 -->
        <div style="text-align: center; margin-bottom: 24px; border-bottom: 1px double rgba(44, 30, 30, 0.2); padding-bottom: 16px;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 8px; letter-spacing: 1px;">{{RESTAURANT}}</div>
          <div style="font-size: 11px; color: rgba(44, 30, 30, 0.7); line-height: 1.6; font-style: italic;">
            “{{STORY}}”
          </div>
        </div>

        <!-- 菜品列表 -->
        <div style="flex: 1; overflow-y: auto; padding-right: 4px;">
          <!-- 菜品 1 -->
          <div data-menu-item="1" data-price="{{PRICE1}}" style="margin-bottom: 20px; cursor: pointer; group">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH1}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE1}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC1}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="1" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>

          <!-- 菜品 2 -->
          <div data-menu-item="2" data-price="{{PRICE2}}" style="margin-bottom: 20px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH2}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE2}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC2}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="2" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>

          <!-- 菜品 3 -->
          <div data-menu-item="3" data-price="{{PRICE3}}" style="margin-bottom: 20px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH3}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE3}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC3}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="3" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>

          <!-- 菜品 4 -->
          <div data-menu-item="4" data-price="{{PRICE4}}" style="margin-bottom: 20px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH4}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE4}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC4}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="4" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>

          <!-- 菜品 5 -->
          <div data-menu-item="5" data-price="{{PRICE5}}" style="margin-bottom: 20px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH5}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE5}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC5}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="5" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>

          <!-- 菜品 6 -->
          <div data-menu-item="6" data-price="{{PRICE6}}" style="margin-bottom: 20px; cursor: pointer;">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
              <div style="font-size: 16px; font-weight: bold; border-bottom: 1px solid transparent; transition: border-color 0.3s;">{{DISH6}}</div>
              <div style="font-size: 16px; font-weight: bold;">¥{{PRICE6}}</div>
            </div>
            <div style="font-size: 11px; color: rgba(44, 30, 30, 0.65); line-height: 1.4; margin-bottom: 6px; text-align: justify;">
              {{DESC6}}
            </div>
            <div style="display: flex; justify-content: flex-end; height: 20px; align-items: center;">
              <div data-qty="6" style="font-size: 11px; color: #fff; background: #8d6e63; padding: 1px 8px; border-radius: 10px; opacity: 0; transform: translateY(5px); transition: all 0.3s;">已选 0</div>
            </div>
          </div>
        </div>

        <!-- 底部合计 -->
        <div style="border-top: 1px solid rgba(44, 30, 30, 0.15); padding-top: 16px; margin-top: auto;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: rgba(44, 30, 30, 0.6);">Total Amount</div>
            <div data-total style="font-size: 24px; font-weight: bold; color: #3e2723;">¥0</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
    `.trim()
  }
