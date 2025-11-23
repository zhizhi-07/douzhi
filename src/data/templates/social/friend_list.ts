import { TheatreTemplate } from '../../theatreTemplates'

export const friendListTemplate: TheatreTemplate = {
  id: 'friend_list',
  category: '社交通讯',
  name: '好友列表',
  keywords: ['好友', '列表', '在线'],
  fields: [
    { key: 'TOTAL_ONLINE', label: '在线人数', placeholder: '3' },
    { key: 'TOTAL_FRIENDS', label: '好友总数', placeholder: '128' },
    { key: 'FRIEND1_NAME', label: '好友1', placeholder: '小明' },
    { key: 'FRIEND1_STATUS', label: '状态1', placeholder: '在线' },
    { key: 'FRIEND2_NAME', label: '好友2', placeholder: '小红' },
    { key: 'FRIEND2_STATUS', label: '状态2', placeholder: '忙碌' },
    { key: 'FRIEND3_NAME', label: '好友3', placeholder: '老王' },
    { key: 'FRIEND3_STATUS', label: '状态3', placeholder: '离开' },
  ],
  htmlTemplate: `
<div data-friend-list style="background: #f0f2f5; width: 100%; max-width: 300px; margin: 0 auto; font-family: sans-serif; border-radius: 8px; overflow: hidden; border: 1px solid #ddd;">
  <div style="padding: 15px; background: #fff; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
    <div style="font-weight: bold; color: #333;">我的好友</div>
    <div style="font-size: 12px; color: #999;">{{TOTAL_ONLINE}}/{{TOTAL_FRIENDS}}</div>
  </div>
  
  <div style="background: #fff;">
    <!-- Friend 1 -->
    <div style="padding: 12px 15px; display: flex; align-items: center; border-bottom: 1px solid #f5f5f5; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">
      <div style="position: relative; margin-right: 12px;">
        <div style="width: 40px; height: 40px; background: #87d068; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">M</div>
        <div style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #52c41a; border-radius: 50%; border: 2px solid #fff;"></div>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 14px; font-weight: 500; color: #333;">{{FRIEND1_NAME}}</div>
        <div style="font-size: 12px; color: #999;">[4G] {{FRIEND1_STATUS}}</div>
      </div>
    </div>
    
    <!-- Friend 2 -->
    <div style="padding: 12px 15px; display: flex; align-items: center; border-bottom: 1px solid #f5f5f5; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">
      <div style="position: relative; margin-right: 12px;">
        <div style="width: 40px; height: 40px; background: #ff85c0; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">H</div>
        <div style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #faad14; border-radius: 50%; border: 2px solid #fff;"></div>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 14px; font-weight: 500; color: #333;">{{FRIEND2_NAME}}</div>
        <div style="font-size: 12px; color: #999;">{{FRIEND2_STATUS}}</div>
      </div>
    </div>
    
    <!-- Friend 3 -->
    <div style="padding: 12px 15px; display: flex; align-items: center; border-bottom: 1px solid #f5f5f5; transition: background 0.2s;" onmouseover="this.style.background='#f9f9f9'" onmouseout="this.style.background='#fff'">
      <div style="position: relative; margin-right: 12px;">
        <div style="width: 40px; height: 40px; background: #5cdbd3; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px;">W</div>
        <div style="position: absolute; bottom: -2px; right: -2px; width: 10px; height: 10px; background: #bfbfbf; border-radius: 50%; border: 2px solid #fff;"></div>
      </div>
      <div style="flex: 1;">
        <div style="font-size: 14px; font-weight: 500; color: #333;">{{FRIEND3_NAME}}</div>
        <div style="font-size: 12px; color: #999;">{{FRIEND3_STATUS}}</div>
      </div>
    </div>
  </div>
  
  <div style="padding: 10px; text-align: center; background: #f9f9f9; color: #666; font-size: 12px; cursor: pointer;">
    展开全部分组 ▾
  </div>
</div>
  `.trim()
}
