# 小剧场模板字段规范文档

## 📱 生活统计类

### 1. 步数排行
**模板ID**: `step_ranking`
**关键词**: 步数、运动排行、微信运动
**字段**:
- `DATE` - 日期（如：2024年11月21日）
- `MY_STEPS` - 我的步数
- `MY_RANK` - 我的排名
- `RANK1_NAME` - 第1名昵称
- `RANK1_STEPS` - 第1名步数
- `RANK2_NAME` - 第2名昵称
- `RANK2_STEPS` - 第2名步数
- `RANK3_NAME` - 第3名昵称
- `RANK3_STEPS` - 第3名步数
- `RANK4_NAME` - 第4名昵称
- `RANK4_STEPS` - 第4名步数
- `RANK5_NAME` - 第5名昵称
- `RANK5_STEPS` - 第5名步数

### 2. 屏幕时间
**模板ID**: `screen_time`
**关键词**: 屏幕时间、手机使用
**字段**:
- `DATE` - 日期
- `TOTAL_TIME` - 总使用时长（如：8小时32分）
- `UNLOCK_COUNT` - 解锁次数
- `APP1_NAME` - 最常用APP1名称
- `APP1_TIME` - APP1使用时长
- `APP2_NAME` - 最常用APP2名称
- `APP2_TIME` - APP2使用时长
- `APP3_NAME` - 最常用APP3名称
- `APP3_TIME` - APP3使用时长

### 3. 消费分析（支付宝年度账单）
**模板ID**: `yearly_bill`
**关键词**: 年度账单、消费分析
**字段**:
- `YEAR` - 年份
- `TOTAL_SPEND` - 总支出
- `TOTAL_INCOME` - 总收入
- `TOP_CATEGORY` - 最多消费类目
- `TOP_AMOUNT` - 该类目金额
- `FOOD_AMOUNT` - 餐饮金额
- `SHOPPING_AMOUNT` - 购物金额
- `TRANSPORT_AMOUNT` - 交通金额
- `ENTERTAINMENT_AMOUNT` - 娱乐金额

## 🧠 测试类

### 4. 人格测试（MBTI）
**模板ID**: `mbti_test`
**关键词**: MBTI、人格测试、性格测试
**字段**:
- `RESULT_TYPE` - 结果类型（如：INFP）
- `TYPE_NAME` - 类型名称（如：调停者）
- `INTRO_SCORE` - 内向分数（%）
- `SENSING_SCORE` - 感觉分数（%）
- `FEELING_SCORE` - 情感分数（%）
- `JUDGING_SCORE` - 判断分数（%）
- `DESCRIPTION` - 性格描述
- `STRENGTH` - 优势特点
- `WEAKNESS` - 弱点特点

## 🎓 证件类

### 5. 学生证
**模板ID**: `student_card`
**关键词**: 学生证、校园卡
**字段**:
- `SCHOOL_NAME` - 学校名称
- `STUDENT_NAME` - 学生姓名
- `STUDENT_ID` - 学号
- `MAJOR` - 专业
- `CLASS` - 班级
- `ENTRANCE_YEAR` - 入学年份
- `PHOTO` - 照片（默认用首字母）

### 6. 会员卡
**模板ID**: `vip_card`
**关键词**: 会员卡、VIP
**字段**:
- `CARD_NAME` - 卡片名称（如：黄金会员）
- `MEMBER_NAME` - 会员姓名
- `CARD_NO` - 卡号
- `LEVEL` - 等级
- `POINTS` - 积分
- `EXPIRE_DATE` - 到期日期
- `BENEFITS` - 会员权益

## 🛍️ 电商类

### 7. 砍价页面
**模板ID**: `bargain`
**关键词**: 砍价、帮忙砍
**字段**:
- `PRODUCT_NAME` - 商品名称
- `ORIGINAL_PRICE` - 原价
- `CURRENT_PRICE` - 当前价格
- `TARGET_PRICE` - 目标价格
- `HELPED_COUNT` - 已帮砍人数
- `NEED_COUNT` - 还需人数
- `MY_CUT` - 本次砍掉金额

### 8. 拼团
**模板ID**: `group_buy`
**关键词**: 拼团、拼多多
**字段**:
- `PRODUCT_NAME` - 商品名称
- `GROUP_PRICE` - 拼团价
- `ORIGINAL_PRICE` - 原价
- `GROUP_SIZE` - 成团人数
- `CURRENT_SIZE` - 当前人数
- `TIME_LEFT` - 剩余时间
- `INITIATOR` - 发起人

## 📱 手机功能类

### 9. 浏览历史
**模板ID**: `browser_history`
**关键词**: 浏览历史、浏览记录
**字段**:
- `RECORD1_TITLE` - 记录1标题
- `RECORD1_URL` - 记录1网址
- `RECORD1_TIME` - 记录1时间
- `RECORD2_TITLE` - 记录2标题
- `RECORD2_URL` - 记录2网址
- `RECORD2_TIME` - 记录2时间
（以此类推，可支持10条）

### 10. 充话费
**模板ID**: `phone_recharge`
**关键词**: 充话费、充值
**字段**:
- `PHONE_NUMBER` - 手机号
- `AMOUNT` - 充值金额
- `OPERATOR` - 运营商（移动/联通/电信）
- `ORDER_NO` - 订单号
- `PAY_TIME` - 支付时间
- `STATUS` - 状态（充值成功）

## 💤 健康类

### 11. 睡眠报告
**模板ID**: `sleep_report`
**关键词**: 睡眠、睡眠报告
**字段**:
- `DATE` - 日期
- `SLEEP_TIME` - 入睡时间
- `WAKE_TIME` - 醒来时间
- `TOTAL_HOURS` - 总时长
- `DEEP_SLEEP` - 深睡时长
- `LIGHT_SLEEP` - 浅睡时长
- `AWAKE_TIMES` - 醒来次数
- `SLEEP_SCORE` - 睡眠得分

### 12. 体检报告
**模板ID**: `health_checkup`
**关键词**: 体检、体检报告
**字段**:
- `NAME` - 姓名
- `DATE` - 体检日期
- `HEIGHT` - 身高
- `WEIGHT` - 体重
- `BMI` - BMI指数
- `BLOOD_PRESSURE` - 血压
- `HEART_RATE` - 心率
- `BLOOD_SUGAR` - 血糖
- `RESULT` - 总体结论

文档已保存到：`docs/THEATRE_TEMPLATES_SPEC.md`

由于模板数量较多（约30+个），我先创建了前12个的详细规范。需要我继续完成剩余的模板吗？
