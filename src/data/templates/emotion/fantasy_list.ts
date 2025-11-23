import { TheatreTemplate } from '../../theatreTemplates'

export const fantasyListTemplate: TheatreTemplate = {
    id: 'fantasy_list',
    category: '情感表达',
    name: '愿望清单',
    keywords: ['愿望', '清单', '计划', '梦想'],
    fields: [
      { key: 'TITLE', label: '清单标题', placeholder: '2025 愿望清单' },
      { key: 'ITEM1', label: '愿望1', placeholder: '去一次冰岛看极光' },
      { key: 'ITEM1_DETAIL', label: '愿望1详情', placeholder: '听说和爱的人一起看极光会幸福一辈子...' },
      { key: 'ITEM2', label: '愿望2', placeholder: '学会弹吉他' },
      { key: 'ITEM2_DETAIL', label: '愿望2详情', placeholder: '想在年会上表演一首《晴天》' },
      { key: 'ITEM3', label: '愿望3', placeholder: '存够10万块' },
      { key: 'ITEM3_DETAIL', label: '愿望3详情', placeholder: '为了明年的装修计划' },
      { key: 'ITEM4', label: '愿望4', placeholder: '带爸妈去旅游' },
      { key: 'ITEM4_DETAIL', label: '愿望4详情', placeholder: '他们辛苦了一辈子，该享受享受了' },
      { key: 'PROGRESS', label: '当前进度', placeholder: '1/4' },
    ],
    htmlTemplate: `
<div style="max-width: 340px; margin: 0 auto; background: #fff0f6; border-radius: 16px; padding: 25px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 8px 24px rgba(255, 192, 203, 0.3); position: relative; min-height: 400px;">
  <!-- 装饰胶带 -->
  <div style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 100px; height: 20px; background: rgba(255,255,255,0.6); transform: translateX(-50%) rotate(-2deg); box-shadow: 0 2px 5px rgba(0,0,0,0.1);"></div>

  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 22px; font-weight: bold; color: #d63384; letter-spacing: 1px; cursor: pointer;" data-title-click>✨ {{TITLE}} ✨</div>
    <div style="font-size: 12px; color: #e6a8bc; margin-top: 5px;">Click items for details</div>
  </div>

  <div style="display: flex; flex-direction: column; gap: 15px;">
    <!-- 愿望项 1 -->
    <div class="wish-item" data-item="1" style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); overflow: hidden; transition: all 0.3s;">
      <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
        <div class="check-box" style="width: 20px; height: 20px; border: 2px solid #ffadd2; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div class="check-mark" style="display: none; color: #d63384; font-weight: bold;">✓</div>
        </div>
        <div class="item-text" style="color: #555; font-size: 15px; flex-grow: 1;">{{ITEM1}}</div>
        <div style="color: #ffadd2; font-size: 12px;">▼</div>
      </div>
      <div class="item-detail" style="height: 0; padding: 0 16px; background: #fff5f7; color: #d63384; font-size: 13px; line-height: 1.5; transition: all 0.3s ease-in-out; opacity: 0;">
        <div style="padding: 10px 0;">{{ITEM1_DETAIL}}</div>
      </div>
    </div>

    <!-- 愿望项 2 -->
    <div class="wish-item" data-item="2" style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); overflow: hidden; transition: all 0.3s;">
      <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
        <div class="check-box" style="width: 20px; height: 20px; border: 2px solid #ffadd2; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div class="check-mark" style="display: none; color: #d63384; font-weight: bold;">✓</div>
        </div>
        <div class="item-text" style="color: #555; font-size: 15px; flex-grow: 1;">{{ITEM2}}</div>
        <div style="color: #ffadd2; font-size: 12px;">▼</div>
      </div>
      <div class="item-detail" style="height: 0; padding: 0 16px; background: #fff5f7; color: #d63384; font-size: 13px; line-height: 1.5; transition: all 0.3s ease-in-out; opacity: 0;">
        <div style="padding: 10px 0;">{{ITEM2_DETAIL}}</div>
      </div>
    </div>

    <!-- 愿望项 3 -->
    <div class="wish-item" data-item="3" style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); overflow: hidden; transition: all 0.3s;">
      <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
        <div class="check-box" style="width: 20px; height: 20px; border: 2px solid #ffadd2; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div class="check-mark" style="display: none; color: #d63384; font-weight: bold;">✓</div>
        </div>
        <div class="item-text" style="color: #555; font-size: 15px; flex-grow: 1;">{{ITEM3}}</div>
        <div style="color: #ffadd2; font-size: 12px;">▼</div>
      </div>
      <div class="item-detail" style="height: 0; padding: 0 16px; background: #fff5f7; color: #d63384; font-size: 13px; line-height: 1.5; transition: all 0.3s ease-in-out; opacity: 0;">
        <div style="padding: 10px 0;">{{ITEM3_DETAIL}}</div>
      </div>
    </div>

    <!-- 愿望项 4 -->
    <div class="wish-item" data-item="4" style="background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); overflow: hidden; transition: all 0.3s;">
      <div style="padding: 12px 16px; display: flex; align-items: center; gap: 12px; cursor: pointer;">
        <div class="check-box" style="width: 20px; height: 20px; border: 2px solid #ffadd2; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <div class="check-mark" style="display: none; color: #d63384; font-weight: bold;">✓</div>
        </div>
        <div class="item-text" style="color: #555; font-size: 15px; flex-grow: 1;">{{ITEM4}}</div>
        <div style="color: #ffadd2; font-size: 12px;">▼</div>
      </div>
      <div class="item-detail" style="height: 0; padding: 0 16px; background: #fff5f7; color: #d63384; font-size: 13px; line-height: 1.5; transition: all 0.3s ease-in-out; opacity: 0;">
        <div style="padding: 10px 0;">{{ITEM4_DETAIL}}</div>
      </div>
    </div>
  </div>

  <div style="margin-top: 25px; text-align: center;">
    <div style="display: inline-block; background: #ffeef0; padding: 6px 15px; border-radius: 20px; color: #d63384; font-size: 13px; font-weight: bold;">
      Progress: <span data-progress>{{PROGRESS}}</span>
    </div>
  </div>
</div>
    `.trim()
  }
