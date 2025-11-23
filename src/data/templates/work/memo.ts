import { TheatreTemplate } from '../../theatreTemplates'

export const memoTemplate: TheatreTemplate = {
    id: 'memo',
    category: '工作学习',
    name: '备忘录',
    keywords: ['备忘录', '待办', '提醒', '记事'],
    fields: [
      { key: 'TITLE', label: '列表标题', placeholder: '备忘录' },
      { key: 'COUNT', label: '总数', placeholder: '3' },
      
      { key: 'ITEM1_TITLE', label: '事项1标题', placeholder: '超市采购' },
      { key: 'ITEM1_TIME', label: '事项1时间', placeholder: '昨天' },
      { key: 'ITEM1_PREVIEW', label: '事项1预览', placeholder: '牛奶、鸡蛋、全麦面包、还要买点水果...' },
      { key: 'ITEM1_DETAIL', label: '事项1详情(原因)', placeholder: '冰箱空了，明天早餐没着落，必须今晚去买，不然明天得饿肚子去上班。顺便看看有没有打折的牛排。' },
      
      { key: 'ITEM2_TITLE', label: '事项2标题', placeholder: '还信用卡' },
      { key: 'ITEM2_TIME', label: '事项2时间', placeholder: '星期五' },
      { key: 'ITEM2_PREVIEW', label: '事项2预览', placeholder: '招商银行 12500元，最后还款日...' },
      { key: 'ITEM2_DETAIL', label: '事项2详情(原因)', placeholder: '上个月买太多游戏和手办了，这次必须全额还清，不然利息太高。记得设置自动还款。' },
      
      { key: 'ITEM3_TITLE', label: '事项3标题', placeholder: '项目周报' },
      { key: 'ITEM3_TIME', label: '事项3时间', placeholder: '2025/11/20' },
      { key: 'ITEM3_PREVIEW', label: '事项3预览', placeholder: '本周完成了API接口对接，下周计划...' },
      { key: 'ITEM3_DETAIL', label: '事项3详情(原因)', placeholder: '老板周一早上就要看，必须在周日晚上发出去。重点突出一下性能优化的成果，那是我的KPI。' },
    ],
    htmlTemplate: `
<div data-ios-memo style="max-width: 320px; margin: 0 auto; background: #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif; border-radius: 20px; overflow: hidden; position: relative; height: 500px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
  
  <!-- 状态栏占位 -->
  <div style="height: 44px; width: 100%;"></div>

  <!-- 顶部导航 -->
  <div style="padding: 0 16px 10px; display: flex; justify-content: space-between; align-items: center; color: #007aff;">
    <div style="display: flex; align-items: center; font-size: 17px; font-weight: 400;">
      <span style="font-size: 22px; margin-right: 4px;">‹</span> 文件夹
    </div>
    <div style="font-size: 17px;">...</div>
  </div>

  <!-- 大标题与搜索框 -->
  <div style="padding: 0 16px 16px;">
    <div style="font-size: 34px; font-weight: 800; color: #000; margin-bottom: 10px; letter-spacing: -0.5px;">{{TITLE}}</div>
    
    <!-- 搜索框 -->
    <div style="background: #e3e3e8; border-radius: 10px; height: 36px; display: flex; align-items: center; padding: 0 10px; color: #8e8e93;">
      <span style="margin-right: 6px;">🔍</span>
      <span style="font-size: 17px;">搜索</span>
    </div>
  </div>

  <!-- 列表容器 -->
  <div style="margin: 0 16px; background: #fff; border-radius: 10px; overflow: hidden;">
    
    <!-- 事项1 -->
    <div data-memo-item="1" style="padding: 12px 16px; position: relative; cursor: pointer; active:background-color: #e5e5ea;">
      <div style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 4px;">{{ITEM1_TITLE}}</div>
      <div style="font-size: 15px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        <span style="margin-right: 6px;">{{ITEM1_TIME}}</span>
        <span>{{ITEM1_PREVIEW}}</span>
      </div>
      <!-- 分割线 -->
      <div style="position: absolute; bottom: 0; left: 16px; right: 0; height: 1px; background: #c6c6c8; transform: scaleY(0.5);"></div>
      <!-- 隐藏详情数据 -->
      <div data-detail-content style="display: none;">{{ITEM1_DETAIL}}</div>
      <div data-full-title style="display: none;">{{ITEM1_TITLE}}</div>
      <div data-full-time style="display: none;">{{ITEM1_TIME}}</div>
    </div>

    <!-- 事项2 -->
    <div data-memo-item="2" style="padding: 12px 16px; position: relative; cursor: pointer;">
      <div style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 4px;">{{ITEM2_TITLE}}</div>
      <div style="font-size: 15px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        <span style="margin-right: 6px;">{{ITEM2_TIME}}</span>
        <span>{{ITEM2_PREVIEW}}</span>
      </div>
      <!-- 分割线 -->
      <div style="position: absolute; bottom: 0; left: 16px; right: 0; height: 1px; background: #c6c6c8; transform: scaleY(0.5);"></div>
      <div data-detail-content style="display: none;">{{ITEM2_DETAIL}}</div>
      <div data-full-title style="display: none;">{{ITEM2_TITLE}}</div>
      <div data-full-time style="display: none;">{{ITEM2_TIME}}</div>
    </div>

    <!-- 事项3 -->
    <div data-memo-item="3" style="padding: 12px 16px; position: relative; cursor: pointer;">
      <div style="font-size: 16px; font-weight: 600; color: #000; margin-bottom: 4px;">{{ITEM3_TITLE}}</div>
      <div style="font-size: 15px; color: #8e8e93; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        <span style="margin-right: 6px;">{{ITEM3_TIME}}</span>
        <span>{{ITEM3_PREVIEW}}</span>
      </div>
      <div data-detail-content style="display: none;">{{ITEM3_DETAIL}}</div>
      <div data-full-title style="display: none;">{{ITEM3_TITLE}}</div>
      <div data-full-time style="display: none;">{{ITEM3_TIME}}</div>
    </div>

  </div>
  
  <!-- 底部工具栏 -->
  <div style="position: absolute; bottom: 0; width: 100%; height: 83px; background: #f2f2f7; border-top: 1px solid #c6c6c8; display: flex; justify-content: space-between; align-items: flex-start; padding: 12px 20px; box-sizing: border-box; color: #e0b120;">
    <div style="font-size: 11px; color: #000; width: 100%; text-align: center; position: absolute; left: 0; top: 14px; pointer-events: none;">{{COUNT}} 个备忘录</div>
    <div style="font-size: 24px;">⊞</div>
    <div style="font-size: 24px;">✎</div>
  </div>

  <!-- 详情弹窗覆盖层 -->
  <div data-detail-modal style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: #fff; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); z-index: 100; display: flex; flex-direction: column;">
    <!-- 详情页导航 -->
    <div style="padding: 44px 16px 10px; display: flex; justify-content: space-between; align-items: center; color: #e0b120;">
      <div data-back-btn style="display: flex; align-items: center; font-size: 17px; font-weight: 400; cursor: pointer;">
        <span style="font-size: 22px; margin-right: 4px;">‹</span> 备忘录
      </div>
      <div style="font-size: 17px;">完成</div>
    </div>
    
    <!-- 详情页内容 -->
    <div style="padding: 10px 20px; flex: 1; overflow-y: auto;">
      <div data-modal-time style="font-size: 12px; color: #8e8e93; text-align: center; margin-bottom: 16px;"></div>
      <div data-modal-title style="font-size: 24px; font-weight: 800; color: #000; margin-bottom: 16px;"></div>
      <div data-modal-text style="font-size: 17px; line-height: 1.5; color: #000; white-space: pre-wrap;"></div>
    </div>
  </div>

</div>
    `.trim()
  }
