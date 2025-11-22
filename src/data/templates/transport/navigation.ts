import { TheatreTemplate } from '../../theatreTemplates'

export const navigationTemplate: TheatreTemplate = {
  id: 'navigation',
  category: '交通出行',
  name: '导航路线',
  keywords: ['导航', '路线', '去哪了', '行程记录', '地图'],
  fields: [
    { key: 'DATE', label: '日期', placeholder: '今天 14:23' },
    { key: 'FROM_NAME', label: '出发地名称', placeholder: '中关村创业大街' },
    { key: 'FROM_ADDR', label: '出发地地址', placeholder: '北京市海淀区中关村大街1号' },
    { key: 'TO_NAME', label: '目的地名称', placeholder: '三里屯太古里' },
    { key: 'TO_ADDR', label: '目的地地址', placeholder: '北京市朝阳区三里屯路19号' },
    { key: 'DISTANCE', label: '距离(km)', placeholder: '8.5' },
    { key: 'DURATION', label: '用时', placeholder: '25分钟' },
    { key: 'ARRIVE_TIME', label: '预计到达', placeholder: '14:48' },
    { key: 'TRANSPORT', label: '出行方式', placeholder: '驾车' },
    { key: 'STEP1', label: '路线步骤1', placeholder: '从中关村大街向东行驶' },
    { key: 'STEP2', label: '路线步骤2', placeholder: '进入知春路，直行1.2公里' },
    { key: 'STEP3', label: '路线步骤3', placeholder: '右转进入北四环东路' },
    { key: 'STEP4', label: '路线步骤4', placeholder: '沿三环路行驶4.3公里' },
    { key: 'STEP5', label: '路线步骤5', placeholder: '到达目的地三里屯太古里' },
    { key: 'REASON', label: '为什么去', placeholder: '约了朋友下午茶，好久没见了，选了她最喜欢的那家店' },
    { key: 'MOOD', label: '此刻心情', placeholder: '有点小激动，路上买束花吧' },
  ],
  htmlTemplate: `
<style>
[data-item]:hover,[data-play-btn]:hover,.theatre-content > *:hover{transform:none!important;box-shadow:none!important;background:transparent!important}
*{transition:none!important}
</style>
<div style="max-width:375px;margin:0 auto;background:#fff;font-family:-apple-system,sans-serif">
  
  <!-- 顶部搜索栏 -->
  <div style="background:#fff;padding:12px 16px;border-bottom:1px solid #e5e5e5">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="width:20px;height:20px;border:2px solid #3A8FF5;border-radius:50%;position:relative">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:6px;height:6px;background:#3A8FF5;border-radius:50%"></div>
      </div>
      <div style="flex:1;font-size:14px;color:#999">搜索地点</div>
      <div style="font-size:12px;color:#3A8FF5">{{DATE}}</div>
    </div>
  </div>

  <!-- 地图区域 -->
  <div style="height:180px;background:linear-gradient(135deg,#E8F4FD 0%,#D1E9F6 50%,#C5E3F4 100%);position:relative;overflow:hidden">
    <!-- 模拟地图网格 -->
    <div style="position:absolute;inset:0;opacity:0.15;background-image:repeating-linear-gradient(0deg,#000 0,#000 1px,transparent 1px,transparent 20px),repeating-linear-gradient(90deg,#000 0,#000 1px,transparent 1px,transparent 20px)"></div>
    
    <!-- 路线线条 -->
    <svg style="position:absolute;inset:0;width:100%;height:100%">
      <path d="M 60 160 Q 120 120, 180 100 T 300 40" stroke="#3A8FF5" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M 60 160 Q 120 120, 180 100 T 300 40" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-dasharray="8,6"/>
    </svg>
    
    <!-- 起点标记 -->
    <div style="position:absolute;left:50px;bottom:20px;display:flex;flex-direction:column;align-items:center">
      <div style="width:32px;height:32px;background:#5AB05B;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(90,176,91,0.4)">
        <div style="width:12px;height:12px;background:#fff;border-radius:50%"></div>
      </div>
      <div style="margin-top:4px;background:rgba(255,255,255,0.95);padding:4px 8px;border-radius:4px;font-size:11px;color:#333;box-shadow:0 2px 4px rgba(0,0,0,0.1)">起点</div>
    </div>
    
    <!-- 终点标记 -->
    <div style="position:absolute;right:30px;top:30px;display:flex;flex-direction:column;align-items:center">
      <div style="width:36px;height:36px;background:#FF5F57;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(255,95,87,0.4)">
        <div style="width:10px;height:10px;background:#fff;border-radius:50%;transform:rotate(45deg)"></div>
      </div>
      <div style="margin-top:8px;background:rgba(255,255,255,0.95);padding:4px 8px;border-radius:4px;font-size:11px;color:#333;box-shadow:0 2px 4px rgba(0,0,0,0.1)">终点</div>
    </div>
  </div>

  <!-- 路线信息卡片 -->
  <div style="margin:12px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
    
    <!-- 出行方式和时间 -->
    <div style="background:linear-gradient(135deg,#3A8FF5,#2B7FE5);padding:14px 16px;color:#fff">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="background:rgba(255,255,255,0.25);padding:4px 10px;border-radius:20px;font-size:12px">{{TRANSPORT}}</div>
          <div style="font-size:24px;font-weight:600">{{DURATION}}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:0.85">预计到达</div>
          <div style="font-size:16px;font-weight:500">{{ARRIVE_TIME}}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;opacity:0.9">
        <span>{{DISTANCE}} 公里</span>
        <span>·</span>
        <span>路况良好</span>
      </div>
    </div>

    <!-- 起点终点 -->
    <div style="padding:16px">
      <!-- 起点 -->
      <div style="display:flex;gap:12px;margin-bottom:14px">
        <div style="display:flex;flex-direction:column;align-items:center;padding-top:4px">
          <div style="width:10px;height:10px;border:3px solid #5AB05B;border-radius:50%;background:#fff"></div>
          <div style="width:2px;flex:1;background:#E0E0E0;margin:4px 0"></div>
        </div>
        <div style="flex:1;padding-bottom:8px">
          <div style="font-size:15px;font-weight:500;color:#333;margin-bottom:2px">{{FROM_NAME}}</div>
          <div style="font-size:12px;color:#999">{{FROM_ADDR}}</div>
        </div>
      </div>
      
      <!-- 终点 -->
      <div style="display:flex;gap:12px">
        <div style="display:flex;flex-direction:column;align-items:center;padding-top:4px">
          <div style="width:10px;height:10px;background:#FF5F57;border-radius:50%"></div>
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500;color:#333;margin-bottom:2px">{{TO_NAME}}</div>
          <div style="font-size:12px;color:#999">{{TO_ADDR}}</div>
        </div>
      </div>
    </div>

    <!-- 详细路线步骤（可展开） -->
    <div style="border-top:1px solid #F0F0F0">
      <div onclick="var d=this.nextElementSibling;d.style.display=d.style.display==='block'?'none':'block'" style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;cursor:pointer;background:#FAFAFA">
        <div style="font-size:14px;color:#666;font-weight:500">详细路线</div>
        <div style="font-size:12px;color:#3A8FF5">展开 ▼</div>
      </div>
      <div style="display:none;padding:12px 16px;background:#FAFAFA">
        <div style="display:flex;gap:10px;margin-bottom:10px">
          <div style="font-size:12px;color:#3A8FF5;width:20px">1</div>
          <div style="font-size:13px;color:#666;flex:1">{{STEP1}}</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:10px">
          <div style="font-size:12px;color:#3A8FF5;width:20px">2</div>
          <div style="font-size:13px;color:#666;flex:1">{{STEP2}}</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:10px">
          <div style="font-size:12px;color:#3A8FF5;width:20px">3</div>
          <div style="font-size:13px;color:#666;flex:1">{{STEP3}}</div>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:10px">
          <div style="font-size:12px;color:#3A8FF5;width:20px">4</div>
          <div style="font-size:13px;color:#666;flex:1">{{STEP4}}</div>
        </div>
        <div style="display:flex;gap:10px">
          <div style="font-size:12px;color:#3A8FF5;width:20px">5</div>
          <div style="font-size:13px;color:#666;flex:1">{{STEP5}}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 心理活动卡片 -->
  <div style="margin:0 12px 16px;background:#FFF9E6;border-radius:12px;padding:14px;border-left:3px solid #FFB800">
    <div style="font-size:13px;color:#999;margin-bottom:6px">此行目的</div>
    <div style="font-size:14px;color:#666;line-height:1.6;margin-bottom:10px">{{REASON}}</div>
    <div style="font-size:13px;color:#999;margin-bottom:6px">此刻心情</div>
    <div style="font-size:14px;color:#666;line-height:1.6">{{MOOD}}</div>
  </div>

  <!-- 底部操作按钮 -->
  <div style="padding:0 12px 16px;display:flex;gap:10px">
    <div style="flex:1;background:#3A8FF5;color:#fff;text-align:center;padding:12px;border-radius:8px;font-size:15px;font-weight:500">开始导航</div>
    <div style="width:48px;border:1px solid #E0E0E0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;color:#666">⋯</div>
  </div>

</div>
  `.trim()
}
