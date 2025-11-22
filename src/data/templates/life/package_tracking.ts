import { TheatreTemplate } from '../../theatreTemplates'

export const packageTrackingTemplate: TheatreTemplate = {
  id: 'package_tracking',
  category: '生活消费',
  name: '物流跟踪',
  keywords: ['快递', '物流', '包裹', '等快递', '快递到哪了'],
  fields: [
    // 包裹1
    { key: 'PKG1_NAME', label: '包裹1名称', placeholder: '新款蓝牙耳机' },
    { key: 'PKG1_STATUS', label: '包裹1状态', placeholder: '运输中' },
    { key: 'PKG1_LOCATION', label: '包裹1位置', placeholder: '已到达【北京朝阳区】' },
    { key: 'PKG1_TIME', label: '包裹1更新时间', placeholder: '10分钟前' },
    { key: 'PKG1_CONTENT', label: '包裹1内容', placeholder: '旧耳机坏了，上班路上没音乐听太无聊了。好着急啊！明天就能到了吧？早上起床第一件事就是刷物流。到了先充满电，然后测试降噪效果。通勤路上终于可以安静听歌了' },
    
    // 包裹2
    { key: 'PKG2_NAME', label: '包裹2名称', placeholder: '网红零食大礼包' },
    { key: 'PKG2_STATUS', label: '包裹2状态', placeholder: '派送中' },
    { key: 'PKG2_LOCATION', label: '包裹2位置', placeholder: '快递小哥正在派送' },
    { key: 'PKG2_TIME', label: '包裹2更新时间', placeholder: '1小时前' },
    { key: 'PKG2_CONTENT', label: '包裹2内容', placeholder: '看到直播间的试吃好诱人，忍不住下单了。今天就能到！中午能收到吗？下午茶有着落了哈哈。拆开后先拍照发朋友圈，然后慢慢品尝每一样。晚上追剧的时候吃正好' },
    
    // 包裹3
    { key: 'PKG3_NAME', label: '包裹3名称', placeholder: '护肤品套装' },
    { key: 'PKG3_STATUS', label: '包裹3状态', placeholder: '已揽收' },
    { key: 'PKG3_LOCATION', label: '包裹3位置', placeholder: '商家已发货' },
    { key: 'PKG3_TIME', label: '包裹3更新时间', placeholder: '今天 09:23' },
    { key: 'PKG3_CONTENT', label: '包裹3内容', placeholder: '最近皮肤状态不太好，想试试这个牌子。闺蜜推荐说效果很好。希望真的有效果...这次花了不少钱，有点心疼但又很期待。到了先测试是否过敏，然后按照说明书每天坚持用。期待一个月后能看到改善' },
  ],
  htmlTemplate: `
<style>
[data-item]:hover,[data-play-btn]:hover,.theatre-content > *:hover{transform:none!important;box-shadow:none!important;background:transparent!important}
*{transition:none!important}
</style>
<div style="max-width:375px;margin:0 auto;background:#f5f5f5;font-family:-apple-system,sans-serif">
  <div style="background:linear-gradient(135deg,#FF6B35 0%,#F7931E 100%);padding:12px 16px;color:#fff">
    <div style="font-size:18px;font-weight:600;margin-bottom:4px">我的包裹</div>
    <div style="font-size:12px;opacity:0.9">正在等待的快递</div>
  </div>
  
  <div style="padding:12px">
    <!-- 包裹1 -->
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,#FFE5E0,#FFD5CC);border-radius:8px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500;color:#333;margin-bottom:4px">{{PKG1_NAME}}</div>
          <div style="display:inline-block;padding:3px 8px;background:#FFF3E0;color:#FF6B35;font-size:11px;border-radius:4px;margin-bottom:6px">{{PKG1_STATUS}}</div>
          <div style="font-size:13px;color:#666">{{PKG1_LOCATION}}</div>
        </div>
        <div style="font-size:11px;color:#999">{{PKG1_TIME}}</div>
      </div>
      <div style="padding:10px;background:#F8F9FA;border-radius:8px;border-left:3px solid #FF6B35">
        <div style="font-size:12px;color:#999;margin-bottom:4px">物流进度</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:#FF6B35"></div>
          <div style="flex:1;height:2px;background:#E0E0E0"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#E0E0E0"></div>
          <div style="flex:1;height:2px;background:#E0E0E0"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#E0E0E0"></div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0">
        <div style="font-size:13px;color:#666;line-height:1.8">{{PKG1_CONTENT}}</div>
      </div>
    </div>
    
    <!-- 包裹2 -->
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,#E8F5E9,#C8E6C9);border-radius:8px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500;color:#333;margin-bottom:4px">{{PKG2_NAME}}</div>
          <div style="display:inline-block;padding:3px 8px;background:#E8F5E9;color:#4CAF50;font-size:11px;border-radius:4px;margin-bottom:6px">{{PKG2_STATUS}}</div>
          <div style="font-size:13px;color:#666">{{PKG2_LOCATION}}</div>
        </div>
        <div style="font-size:11px;color:#999">{{PKG2_TIME}}</div>
      </div>
      <div style="padding:10px;background:#F8F9FA;border-radius:8px;border-left:3px solid #4CAF50">
        <div style="font-size:12px;color:#999;margin-bottom:4px">物流进度</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:#4CAF50"></div>
          <div style="flex:1;height:2px;background:#4CAF50"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#4CAF50"></div>
          <div style="flex:1;height:2px;background:#4CAF50"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#4CAF50"></div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0">
        <div style="font-size:13px;color:#666;line-height:1.8">{{PKG2_CONTENT}}</div>
      </div>
    </div>
    
    <!-- 包裹3 -->
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#fff;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
      <div style="display:flex;gap:12px;margin-bottom:12px">
        <div style="width:60px;height:60px;background:linear-gradient(135deg,#FCE4EC,#F8BBD0);border-radius:8px;flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:500;color:#333;margin-bottom:4px">{{PKG3_NAME}}</div>
          <div style="display:inline-block;padding:3px 8px;background:#FFF3E0;color:#FF9800;font-size:11px;border-radius:4px;margin-bottom:6px">{{PKG3_STATUS}}</div>
          <div style="font-size:13px;color:#666">{{PKG3_LOCATION}}</div>
        </div>
        <div style="font-size:11px;color:#999">{{PKG3_TIME}}</div>
      </div>
      <div style="padding:10px;background:#F8F9FA;border-radius:8px;border-left:3px solid #FF9800">
        <div style="font-size:12px;color:#999;margin-bottom:4px">物流进度</div>
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:#FF9800"></div>
          <div style="flex:1;height:2px;background:#E0E0E0"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#E0E0E0"></div>
          <div style="flex:1;height:2px;background:#E0E0E0"></div>
          <div style="width:8px;height:8px;border-radius:50%;background:#E0E0E0"></div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #f0f0f0">
        <div style="font-size:13px;color:#666;line-height:1.8">{{PKG3_CONTENT}}</div>
      </div>
    </div>
    
    <div style="text-align:center;padding:16px 0;color:#999;font-size:12px">
      点击包裹查看详细信息
    </div>
  </div>
</div>
  `.trim()
}
