import { TheatreTemplate } from '../../theatreTemplates'

export const screenTimeTemplate: TheatreTemplate = {
  id: 'screen_time',
  category: '健康医疗',
  name: '屏幕时间',
  keywords: ['屏幕时间', '手机使用', '使用时长', '手机统计'],
  fields: [
    { key: 'TIME', label: '时间', placeholder: '15:30' },
    { key: 'DATE', label: '日期', placeholder: '11月22日' },
    { key: 'TOTAL_TIME', label: '总使用时长', placeholder: '8小时32分' },
    { key: 'COMPARE_TEXT', label: '对比上周', placeholder: '↑ 25%' },
    { key: 'UNLOCK_COUNT', label: '解锁次数', placeholder: '156' },
    { key: 'FIRST_UNLOCK', label: '首次拿起', placeholder: '07:30' },
    { key: 'MOOD', label: '心理状态', placeholder: '今天手机用太久了...感觉时间都浪费了，明天要控制一下。但是真的好难啊！' },
    // 10个APP
    { key: 'APP1_NAME', label: 'APP1', placeholder: '微信' },
    { key: 'APP1_TIME', label: 'APP1时长', placeholder: '3小时12分' },
    { key: 'APP1_DETAIL', label: 'APP1详情', placeholder: '她怎么还不回我消息啊，都两个小时了...算了不等了睡觉。诶她回了！' },
    { key: 'APP2_NAME', label: 'APP2', placeholder: '王者荣耀' },
    { key: 'APP2_TIME', label: 'APP2时长', placeholder: '2小时45分' },
    { key: 'APP2_DETAIL', label: 'APP2详情', placeholder: '妈的气死我了全都连跪，幸好后面赢了不然卸载了' },
    { key: 'APP3_NAME', label: 'APP3', placeholder: 'B站' },
    { key: 'APP3_TIME', label: 'APP3时长', placeholder: '1小时28分' },
    { key: 'APP3_DETAIL', label: 'APP3详情', placeholder: '刷着刷着就到凌晨了，明天又要熬夜补觉...这个UP主是真的好笑哈哈哈' },
    { key: 'APP4_NAME', label: 'APP4', placeholder: '小红书' },
    { key: 'APP4_TIME', label: 'APP4时长', placeholder: '1小时15分' },
    { key: 'APP4_DETAIL', label: 'APP4详情', placeholder: '哇这个小姐姐好漂亮...收藏！这个妆容也太好看了吧，明天试试' },
    { key: 'APP5_NAME', label: 'APP5', placeholder: '抖音' },
    { key: 'APP5_TIME', label: 'APP5时长', placeholder: '58分钟' },
    { key: 'APP5_DETAIL', label: 'APP5详情', placeholder: '本来只想看一个就睡的...这个算法太懂我了，越刷越精神' },
    { key: 'APP6_NAME', label: 'APP6', placeholder: '淘宝' },
    { key: 'APP6_TIME', label: 'APP6时长', placeholder: '45分钟' },
    { key: 'APP6_DETAIL', label: 'APP6详情', placeholder: '又到月底了钱包空了，但这个确实便宜...算了加购吧双11再买' },
    { key: 'APP7_NAME', label: 'APP7', placeholder: 'QQ' },
    { key: 'APP7_TIME', label: 'APP7时长', placeholder: '38分钟' },
    { key: 'APP7_DETAIL', label: 'APP7详情', placeholder: '群里聊得好嗨，突然发现作业还没写...溜了溜了' },
    { key: 'APP8_NAME', label: 'APP8', placeholder: '知乎' },
    { key: 'APP8_TIME', label: 'APP8时长', placeholder: '32分钟' },
    { key: 'APP8_DETAIL', label: 'APP8详情', placeholder: '本来想搜个问题，结果看了半天故事会...这届网友真的太能编了' },
    { key: 'APP9_NAME', label: 'APP9', placeholder: '微博' },
    { key: 'APP9_TIME', label: 'APP9时长', placeholder: '28分钟' },
    { key: 'APP9_DETAIL', label: 'APP9详情', placeholder: '又在吃瓜...这瓜真大，评论区笑死我了哈哈哈' },
    { key: 'APP10_NAME', label: 'APP10', placeholder: '网易云音乐' },
    { key: 'APP10_TIME', label: 'APP10时长', placeholder: '22分钟' },
    { key: 'APP10_DETAIL', label: 'APP10详情', placeholder: '单曲循环这首歌，心情好多了...评论区的故事看哭了' },
    // 最近3条记录
    { key: 'RECENT1_APP', label: '最近1APP', placeholder: '微信' },
    { key: 'RECENT1_TIME', label: '最近1时间', placeholder: '15:20-15:45' },
    { key: 'RECENT1_ACTIVITY', label: '最近1活动', placeholder: '终于等到她回消息了...聊着聊着就半小时过去了，心情好多了' },
    { key: 'RECENT2_APP', label: '最近2APP', placeholder: '抖音' },
    { key: 'RECENT2_TIME', label: '最近2时间', placeholder: '14:30-15:10' },
    { key: 'RECENT2_ACTIVITY', label: '最近2活动', placeholder: '本来只想看一个，结果停不下来...这算法真的绝了，每个都想看' },
    { key: 'RECENT3_APP', label: '最近3APP', placeholder: 'B站' },
    { key: 'RECENT3_TIME', label: '最近3时间', placeholder: '13:45-14:15' },
    { key: 'RECENT3_ACTIVITY', label: '最近3活动', placeholder: '这个UP主更新了！立马点进来看，弹幕都是老熟人哈哈哈' }
  ],
  htmlTemplate: `
<style>
[data-item]:hover,[data-play-btn]:hover,.theatre-content > *:hover{transform:none!important;box-shadow:none!important;background:transparent!important}
*{transition:none!important}
</style>
<div style="max-width:375px;margin:0 auto;background:#000;font-family:-apple-system,sans-serif">
  <div style="background:#000;padding:8px 16px;display:flex;justify-content:space-between;font-size:12px;color:#fff">
    <div>{{TIME}}</div>
    <div>100%</div>
  </div>
  
  <div style="background:#1c1c1e;padding:10px 16px;border-bottom:0.5px solid #38383a">
    <span style="font-size:15px;font-weight:600;color:#fff">屏幕时间</span>
  </div>
  
  <div style="background:#000;padding:16px">
    <div style="text-align:center;color:#fff;font-size:16px;font-weight:600;margin-bottom:16px">{{DATE}}</div>
    
    <div style="background:#1c1c1e;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px">
      <div style="font-size:48px;font-weight:700;color:#fff;margin-bottom:4px">{{TOTAL_TIME}}</div>
      <div style="font-size:14px;color:#8e8e93;margin-bottom:8px">总使用时长</div>
      <div style="font-size:13px;color:#ff9500">{{COMPARE_TEXT}}</div>
    </div>
    
    <div style="background:#1c1c1e;border-radius:12px;padding:16px;display:flex;margin-bottom:16px">
      <div style="flex:1;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#fff">{{UNLOCK_COUNT}}</div>
        <div style="font-size:12px;color:#8e8e93">拿起次数</div>
      </div>
      <div style="width:1px;background:#38383a;margin:0 12px"></div>
      <div style="flex:1;text-align:center">
        <div style="font-size:28px;font-weight:700;color:#fff">{{FIRST_UNLOCK}}</div>
        <div style="font-size:12px;color:#8e8e93">首次拿起</div>
      </div>
    </div>
    
    <div onclick="var d=this.querySelector('.mood-detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:16px;cursor:pointer;margin-bottom:16px">
      <div style="font-size:14px;color:#ff9500;margin-bottom:4px">⚠️ 心理分析</div>
      <div class="mood-detail" style="display:none;font-size:15px;color:#fff;line-height:1.6;margin-top:8px">{{MOOD}}</div>
    </div>
    
    <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:12px">最常使用</div>
    
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#07c160,#06ae56);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#fff">{{APP1_NAME}}</div>
          <div style="font-size:14px;color:#8e8e93">{{APP1_TIME}}</div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP1_DETAIL}}</div>
    </div>
    
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#000,#333);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#fff">{{APP2_NAME}}</div>
          <div style="font-size:14px;color:#8e8e93">{{APP2_TIME}}</div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP2_DETAIL}}</div>
    </div>
    
    <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#00a1d6,#0084c8);flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:600;color:#fff">{{APP3_NAME}}</div>
          <div style="font-size:14px;color:#8e8e93">{{APP3_TIME}}</div>
        </div>
      </div>
      <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP3_DETAIL}}</div>
    </div>
    
    <div id="moreApps" style="display:none">
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#ff2442,#ff6b6b);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP4_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP4_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP4_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#12b7f5,#0099e0);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP5_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP5_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP5_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#ff8200,#e56f00);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP6_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP6_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP6_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#ff6a00,#ee5a00);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP7_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP7_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP7_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#0084ff,#0066cc);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP8_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP8_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP8_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#007aff,#0051d5);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP9_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP9_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP9_DETAIL}}</div>
      </div>
      
      <div onclick="var d=this.querySelector('.detail');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:14px;margin-bottom:8px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:50px;height:50px;border-radius:12px;background:linear-gradient(135deg,#d43c33,#c62b21);flex-shrink:0"></div>
          <div style="flex:1">
            <div style="font-size:16px;font-weight:600;color:#fff">{{APP10_NAME}}</div>
            <div style="font-size:14px;color:#8e8e93">{{APP10_TIME}}</div>
          </div>
        </div>
        <div class="detail" style="display:none;margin-top:12px;padding-top:12px;border-top:1px solid #2c2c2e;font-size:13px;color:#8e8e93;line-height:1.6">{{APP10_DETAIL}}</div>
      </div>
    </div>
    
    <div onclick="var m=document.getElementById('moreApps');m.style.display=m.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:12px;text-align:center;cursor:pointer;margin-bottom:16px">
      <span style="font-size:14px;color:#8e8e93">···</span>
    </div>
    
    <div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:12px">最近使用</div>
    <div onclick="var d=this.querySelector('.recent-list');d.style.display=d.style.display==='block'?'none':'block'" style="background:#1c1c1e;border-radius:12px;padding:16px;cursor:pointer">
      <div style="font-size:14px;color:#8e8e93">点击查看</div>
      <div class="recent-list" style="display:none;margin-top:12px">
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #2c2c2e">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:15px;font-weight:600;color:#fff">{{RECENT1_APP}}</span>
            <span style="font-size:13px;color:#8e8e93">{{RECENT1_TIME}}</span>
          </div>
          <div style="font-size:13px;color:#8e8e93;line-height:1.5">{{RECENT1_ACTIVITY}}</div>
        </div>
        <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #2c2c2e">
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:15px;font-weight:600;color:#fff">{{RECENT2_APP}}</span>
            <span style="font-size:13px;color:#8e8e93">{{RECENT2_TIME}}</span>
          </div>
          <div style="font-size:13px;color:#8e8e93;line-height:1.5">{{RECENT2_ACTIVITY}}</div>
        </div>
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:15px;font-weight:600;color:#fff">{{RECENT3_APP}}</span>
            <span style="font-size:13px;color:#8e8e93">{{RECENT3_TIME}}</span>
          </div>
          <div style="font-size:13px;color:#8e8e93;line-height:1.5">{{RECENT3_ACTIVITY}}</div>
        </div>
      </div>
    </div>
  </div>
</div>
  `.trim()
}
