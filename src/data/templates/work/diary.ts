import { TheatreTemplate } from '../../theatreTemplates'

export const diaryTemplate: TheatreTemplate = {
    id: 'diary',
    category: '工作学习',
    name: '日记',
    keywords: ['日记', '记录'],
    fields: [
      { key: 'TITLE', label: '本周主题', placeholder: '美好的一周' },
      { key: 'MON_CONTENT', label: '周一记录（不少于50字）', placeholder: '新的一周开始了，充满干劲！早上起床后感觉精神特别好，阳光透过窗帘洒进来，心情也跟着明亮起来。今天的工作安排得很充实，上午开了个会，下午处理了几个重要的项目。晚上和朋友约了健身，出了一身汗，感觉整个人都轻松了。' },
      { key: 'TUE_CONTENT', label: '周二记录（不少于50字）', placeholder: '工作很顺利，晚上去健身了。今天完成了一个重要的任务，老板还特意表扬了我，心里美滋滋的。中午和同事一起吃了顿好吃的，聊了很多有趣的话题。下班后去了趟超市，买了些新鲜的水果和蔬菜，打算这周好好调理一下饮食。' },
      { key: 'WED_CONTENT', label: '周三记录（不少于50字）', placeholder: '和小美一起吃了晚饭，很开心。我们去了一家新开的餐厅，环境特别好，菜品也很精致。聊天的时候发现我们有很多共同的兴趣爱好，时间过得飞快。饭后我们还一起散了会儿步，夜晚的街道很安静，感觉特别惬意。' },
      { key: 'THU_CONTENT', label: '周四记录（不少于50字）', placeholder: '下雨了，在家里看书。外面淅淅沥沥地下着雨，我窝在沙发上，泡了一杯热茶，翻开了最近买的那本小说。雨声和书页翻动的声音交织在一起，特别有氛围。看累了就望望窗外的雨景，感觉这样的时光也很美好。' },
      { key: 'FRI_CONTENT', label: '周五记录（不少于50字）', placeholder: '终于周五了，期待周末！今天的工作效率特别高，把本周的任务都完成了。下班后和几个朋友约了聚餐，大家聊得很开心，还计划了周末的活动。回家的路上心情特别轻松，想着明天就可以睡个懒觉，整个人都放松下来了。' },
      { key: 'SAT_CONTENT', label: '周六记录（不少于50字）', placeholder: '去公园野餐，风景真好。早上起来天气特别晴朗，和朋友们约好了去公园。我们带了很多好吃的，铺开野餐垫，一边吃一边聊天。公园里的花开得正好，还有小朋友在放风筝，整个氛围特别温馨。下午我们还拍了很多照片，记录下这美好的一天。' },
      { key: 'SUN_CONTENT', label: '周日记录（不少于50字）', placeholder: '在家休息，准备迎接下周。今天没有安排太多事情，就想好好放松一下。上午睡了个懒觉，起来后做了顿丰盛的早午餐。下午整理了一下房间，把这周的衣服都洗了。晚上看了会儿电影，顺便规划了一下下周的工作安排，感觉充满了动力。' },
      { key: 'DOODLE', label: '涂鸦类型', placeholder: 'random' }, // cat, sun, coffee, heart, star, flower, cloud, smile, random
      { key: 'DATE_RANGE', label: '日期范围', placeholder: 'Nov 21 - Nov 27' },
    ],
    htmlTemplate: `
<div data-diary-book style="max-width: 400px; margin: 0 auto; perspective: 1500px; font-family: 'Comic Sans MS', 'Chalkboard SE', 'KaiTi', serif; user-select: none;">
  <div class="book" style="position: relative; width: 100%; height: 500px; transform-style: preserve-3d; transition: transform 0.5s;">
    
    <!-- 封面 -->
    <div class="page cover" style="position: absolute; width: 100%; height: 100%; background: #e74c3c; border-radius: 5px 15px 15px 5px; transform-origin: left; z-index: 20; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; box-shadow: inset 10px 0 20px rgba(0,0,0,0.2), 5px 5px 15px rgba(0,0,0,0.3);">
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 10px; text-shadow: 2px 2px 0 rgba(0,0,0,0.2);">MY DIARY</div>
      <div style="font-size: 14px; opacity: 0.8;">{{DATE_RANGE}}</div>
      <div style="margin-top: 40px; font-size: 18px; font-style: italic; border-bottom: 2px solid rgba(255,255,255,0.5); padding-bottom: 5px;">{{TITLE}}</div>
      <div style="position: absolute; bottom: 20px; font-size: 12px; opacity: 0.6;">Tap to Open</div>
      <!-- 封面纹理 -->
      <div style="position: absolute; inset: 0; background: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4='); pointer-events: none;"></div>
    </div>

    <!-- 内页容器 -->
    <div style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fff; border-radius: 3px 12px 12px 3px; box-shadow: inset 5px 0 10px rgba(0,0,0,0.1); z-index: 1;">
       <!-- 底页内容 (周日) -->
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #e74c3c; font-weight: bold; margin-bottom: 10px;">Sunday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{SUN_CONTENT}}</div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">7/7</div>
       </div>
    </div>

    <!-- 翻页层 (周六) -->
    <div class="page" data-page="6" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 2; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #e67e22; font-weight: bold; margin-bottom: 10px;">Saturday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{SAT_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 50px; right: 30px; width: 80px; height: 80px; opacity: 0.7; transform: rotate(-5deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">6/7</div>
       </div>
    </div>

    <!-- 翻页层 (周五) -->
    <div class="page" data-page="5" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 3; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #f1c40f; font-weight: bold; margin-bottom: 10px;">Friday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{FRI_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 60px; right: 25px; width: 70px; height: 70px; opacity: 0.75; transform: rotate(8deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">5/7</div>
       </div>
    </div>

    <!-- 翻页层 (周四) -->
    <div class="page" data-page="4" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 4; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #2ecc71; font-weight: bold; margin-bottom: 10px;">Thursday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{THU_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 55px; right: 35px; width: 75px; height: 75px; opacity: 0.8; transform: rotate(-8deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">4/7</div>
       </div>
    </div>

    <!-- 翻页层 (周三) -->
    <div class="page" data-page="3" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 5; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #1abc9c; font-weight: bold; margin-bottom: 10px;">Wednesday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{WED_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 50px; right: 30px; width: 90px; height: 90px; opacity: 0.8; transform: rotate(10deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">3/7</div>
       </div>
    </div>

    <!-- 翻页层 (周二) -->
    <div class="page" data-page="2" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 6; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #3498db; font-weight: bold; margin-bottom: 10px;">Tuesday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{TUE_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 45px; right: 28px; width: 85px; height: 85px; opacity: 0.75; transform: rotate(12deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">2/7</div>
       </div>
    </div>

    <!-- 翻页层 (周一) -->
    <div class="page" data-page="1" style="position: absolute; top: 5px; left: 5px; width: calc(100% - 5px); height: calc(100% - 10px); background: #fcfcfc; border-radius: 3px 12px 12px 3px; transform-origin: left; z-index: 7; transition: transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1); cursor: pointer; border-right: 1px solid #eee;">
       <div class="page-content" style="padding: 30px; height: 100%; box-sizing: border-box;">
          <div style="text-align: right; font-size: 24px; color: #9b59b6; font-weight: bold; margin-bottom: 10px;">Monday</div>
          <div style="font-size: 16px; line-height: 1.8; color: #333;">{{MON_CONTENT}}</div>
          <div data-doodle-container style="position: absolute; bottom: 52px; right: 32px; width: 78px; height: 78px; opacity: 0.8; transform: rotate(-10deg);">
            <div data-doodle-type="random"></div>
          </div>
          <div style="position: absolute; bottom: 20px; left: 20px; font-size: 12px; color: #999;">1/7</div>
       </div>
    </div>

  </div>
</div>
    `.trim()
  }
