import { TheatreTemplate } from '../../theatreTemplates'

export const studentCardTemplate: TheatreTemplate = {
  id: 'student_card',
  category: '工作学习',
  name: '学生证',
  keywords: ['学生证', '校园卡', '身份'],
  fields: [
    { key: 'SCHOOL_NAME', label: '学校', placeholder: '清华大学' },
    { key: 'STUDENT_NAME', label: '姓名', placeholder: '李华' },
    { key: 'STUDENT_ID', label: '学号', placeholder: '20240101' },
    { key: 'MAJOR', label: '专业', placeholder: '计算机科学与技术' },
    { key: 'CLASS', label: '班级', placeholder: '计科2401' },
    { key: 'ENTRANCE_YEAR', label: '入学', placeholder: '2024' },
    { key: 'PHOTO', label: '照片字', placeholder: '李' },
  ],
  htmlTemplate: `
<div data-student-card style="background: #fff; width: 100%; max-width: 320px; height: 200px; margin: 0 auto; font-family: sans-serif; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); position: relative; border: 1px solid #eee;">
  <!-- Header -->
  <div style="height: 70px; background: linear-gradient(135deg, #722ed1 0%, #b37feb 100%); display: flex; align-items: center; padding: 0 20px;">
    <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; color: white; font-weight: bold; margin-right: 10px;">🏫</div>
    <div style="color: white; font-size: 18px; font-weight: bold; letter-spacing: 1px;">{{SCHOOL_NAME}}</div>
  </div>
  
  <!-- Content -->
  <div style="padding: 15px 20px; display: flex; align-items: flex-start;">
    <div style="width: 80px; height: 100px; background: #f0f0f0; border-radius: 4px; margin-right: 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; color: #999; font-weight: bold; border: 1px solid #ddd;">
      {{PHOTO}}
    </div>
    <div style="flex: 1; font-size: 12px; line-height: 1.8; color: #333;">
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">{{STUDENT_NAME}}</div>
      <div>学号：{{STUDENT_ID}}</div>
      <div>专业：{{MAJOR}}</div>
      <div>班级：{{CLASS}}</div>
      <div>入学：{{ENTRANCE_YEAR}}</div>
    </div>
  </div>
  
  <!-- Watermark -->
  <div style="position: absolute; bottom: -20px; right: -20px; width: 150px; height: 150px; border-radius: 50%; border: 10px solid rgba(114, 46, 209, 0.05); display: flex; align-items: center; justify-content: center; font-size: 24px; color: rgba(114, 46, 209, 0.05); font-weight: bold; transform: rotate(-30deg);">
    STUDENT
  </div>
</div>
  `.trim()
}
