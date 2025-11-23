import { TheatreTemplate } from '../../theatreTemplates'

export const checkInTemplate: TheatreTemplate = {
    id: 'check_in',
    category: '工作学习',
    name: '打卡记录',
    keywords: ['打卡', '签到', '上班打卡', '考勤'],
    fields: [
      { key: 'NAME', label: '姓名', placeholder: '张三' },
      { key: 'DEPARTMENT', label: '部门', placeholder: '产品部' },
      { key: 'DATE', label: '日期', placeholder: '2025.11.21' },
      { key: 'TIME', label: '时间', placeholder: '08:58:33' },
      { key: 'LOCATION', label: '地点', placeholder: '科技园A栋' },
      { key: 'DAYS_STREAK', label: '连续打卡', placeholder: '236' },
    ],
    htmlTemplate: `
<div style="max-width: 320px; margin: 0 auto; background: #f5f6f8; border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
  <!-- 顶部地图背景模拟 -->
  <div style="height: 180px; background: #e9ecef; position: relative; overflow: hidden;">
    <!-- 简单的地图网格线 -->
    <div style="position: absolute; width: 200%; height: 200%; background-image: linear-gradient(#d1d8e0 1px, transparent 1px), linear-gradient(90deg, #d1d8e0 1px, transparent 1px); background-size: 20px 20px; transform: perspective(500px) rotateX(60deg) translateY(-50px); opacity: 0.5;"></div>
    <!-- 地标图标 -->
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #3b82f6; border-radius: 50% 50% 0 50%; transform: rotate(-45deg); box-shadow: 0 4px 8px rgba(59, 130, 246, 0.4);"></div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
  </div>

  <!-- 打卡圆环主体 -->
  <div style="position: relative; margin-top: -60px; text-align: center; z-index: 10;">
    <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 130px; height: 130px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 50%; color: white; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.4); border: 4px solid white;">
      <div style="font-size: 18px; font-weight: bold; margin-bottom: 4px;">打卡成功</div>
      <div style="font-size: 20px; font-family: 'Monaco', monospace;">{{TIME}}</div>
    </div>
  </div>

  <!-- 信息卡片 -->
  <div style="padding: 20px; background: white; margin-top: -40px; padding-top: 50px; border-radius: 12px 12px 0 0;">
    <!-- 个人信息 -->
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="font-size: 18px; font-weight: bold; color: #1f2937;">{{NAME}}</div>
      <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">{{DEPARTMENT}}</div>
    </div>

    <!-- 详细列表 -->
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 20px; height: 20px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 12px;">📍</div>
        <div style="flex: 1;">
          <div style="font-size: 14px; color: #1f2937; font-weight: 500; line-height: 1.4;">{{LOCATION}}</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">已进入考勤范围</div>
        </div>
      </div>

      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 20px; height: 20px; background: #eff6ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #3b82f6; font-size: 12px;">📅</div>
        <div style="flex: 1;">
          <div style="font-size: 14px; color: #1f2937; font-weight: 500;">{{DATE}}</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">上班打卡</div>
        </div>
      </div>
      
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="width: 20px; height: 20px; background: #fffbeb; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #f59e0b; font-size: 12px;">🏆</div>
        <div style="flex: 1;">
          <div style="font-size: 14px; color: #1f2937; font-weight: 500;">连续打卡 <span style="color: #f59e0b; font-weight: bold; font-size: 16px;">{{DAYS_STREAK}}</span> 天</div>
          <div style="font-size: 12px; color: #9ca3af; margin-top: 2px;">击败了 99% 的同事</div>
        </div>
      </div>
    </div>

    <!-- 底部心情 -->
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; text-align: center;">
      <div style="font-size: 12px; color: #9ca3af;">早安，打工人！💪</div>
    </div>
  </div>
</div>
    `.trim()
  }
