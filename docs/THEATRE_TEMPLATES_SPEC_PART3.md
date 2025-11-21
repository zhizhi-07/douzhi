# 小剧场模板字段规范文档 - 第三部分（成人向）

## 🔞 成人向模板

### 29. 开房记录
**模板ID**: `checkin_record`
**关键词**: 开房记录、入住登记
**字段**:
- `HOTEL_NAME` - 酒店名称
- `GUEST1_NAME` - 入住人1姓名
- `GUEST1_ID` - 入住人1身份证号（后4位）
- `GUEST2_NAME` - 入住人2姓名（可选）
- `GUEST2_ID` - 入住人2身份证号（后4位）
- `ROOM_NO` - 房间号
- `CHECKIN_TIME` - 入住时间
- `CHECKOUT_TIME` - 退房时间
- `STAY_HOURS` - 住宿时长

### 30. 酒吧账单
**模板ID**: `bar_bill`
**关键词**: 酒吧、夜店、消费
**字段**:
- `BAR_NAME` - 酒吧名称
- `TABLE_NO` - 桌号/包厢号
- `DRINK1_NAME` - 酒水1名称
- `DRINK1_QUANTITY` - 酒水1数量
- `DRINK1_PRICE` - 酒水1单价
- `DRINK2_NAME` - 酒水2名称（可选）
- `DRINK2_QUANTITY` - 酒水2数量
- `DRINK2_PRICE` - 酒水2单价
- `SERVICE_FEE` - 服务费
- `TOTAL_AMOUNT` - 总金额
- `TIME` - 消费时间

### 31. 夜店门票
**模板ID**: `club_ticket`
**关键词**: 夜店、电音节、派对
**字段**:
- `EVENT_NAME` - 活动名称
- `VENUE` - 场地
- `DATE` - 日期
- `TIME` - 时间
- `TICKET_TYPE` - 票种（普通票/VIP票）
- `PRICE` - 价格
- `TICKET_NO` - 票号
- `DRESS_CODE` - 着装要求

### 32. 高端消费
**模板ID**: `luxury_purchase`
**关键词**: 奢侈品、高端消费
**字段**:
- `STORE_NAME` - 店铺名称（如：LV/Gucci/Hermès）
- `PRODUCT_NAME` - 商品名称
- `PRODUCT_MODEL` - 型号/款式
- `PRICE` - 价格
- `ORDER_NO` - 订单号
- `PURCHASE_DATE` - 购买日期
- `VIP_LEVEL` - VIP等级

### 33. 会所会员
**模板ID**: `spa_membership`
**关键词**: 会所、SPA、养生
**字段**:
- `CLUB_NAME` - 会所名称
- `MEMBER_NAME` - 会员姓名
- `CARD_NO` - 会员卡号
- `LEVEL` - 会员等级（金卡/白金卡/钻石卡）
- `BALANCE` - 余额
- `SERVICES` - 可享受服务
- `EXPIRE_DATE` - 有效期

### 34. 成人游戏
**模板ID**: `adult_game`
**关键词**: 18+游戏、成人游戏、黄油
**字段**:
- `GAME_NAME` - 游戏名称
- `PLATFORM` - 平台（Steam/DLsite）
- `PLAY_TIME` - 游戏时长
- `PROGRESS` - 进度（%）
- `ACHIEVEMENT` - 已解锁成就
- `CG_UNLOCK` - 已解锁CG数量
- `CHARACTER` - 当前角色

### 35. 付费内容
**模板ID**: `paid_content`
**关键词**: 付费内容、会员解锁
**字段**:
- `PLATFORM_NAME` - 平台名称
- `CONTENT_TYPE` - 内容类型（视频/图片/小说/漫画）
- `CONTENT_TITLE` - 内容标题
- `PRICE` - 价格
- `PAYMENT_METHOD` - 支付方式
- `ORDER_NO` - 订单号
- `PURCHASE_TIME` - 购买时间

### 36. 直播打赏
**模板ID**: `live_donation`
**关键词**: 直播打赏、刷礼物
**字段**:
- `PLATFORM` - 平台（斗鱼/虎牙/B站）
- `STREAMER_NAME` - 主播昵称
- `GIFT_NAME` - 礼物名称
- `GIFT_QUANTITY` - 礼物数量
- `GIFT_VALUE` - 礼物价值
- `TOTAL_AMOUNT` - 总金额
- `MESSAGE` - 留言
- `TIME` - 打赏时间

### 37. 加班记录
**模板ID**: `overtime_record`
**关键词**: 加班、996、打卡
**字段**:
- `DATE` - 日期
- `CLOCK_IN` - 上班打卡时间
- `CLOCK_OUT` - 下班打卡时间
- `TOTAL_HOURS` - 总工时
- `OVERTIME_HOURS` - 加班时长
- `LOCATION` - 打卡地点
- `STATUS` - 状态（正常/迟到/早退）

### 38. 离婚协议
**模板ID**: `divorce_agreement`
**关键词**: 离婚、离婚协议
**字段**:
- `HUSBAND_NAME` - 男方姓名
- `WIFE_NAME` - 女方姓名
- `MARRIAGE_DATE` - 结婚日期
- `DIVORCE_DATE` - 离婚日期
- `CHILDREN` - 子女抚养
- `PROPERTY` - 财产分割
- `REASON` - 离婚原因

### 39. 成人网站会员
**模板ID**: `adult_site_membership`
**关键词**: 成人网站、某Hub
**字段**:
- `SITE_NAME` - 网站名称（打码显示）
- `USERNAME` - 用户名
- `MEMBERSHIP_TYPE` - 会员类型（Premium/VIP）
- `START_DATE` - 开始日期
- `EXPIRE_DATE` - 到期日期
- `PRICE` - 价格
- `FEATURES` - 会员特权

### 40. 隐私浏览
**模板ID**: `incognito_mode`
**关键词**: 无痕模式、隐私浏览
**字段**:
- `BROWSER_NAME` - 浏览器名称
- `MODE` - 模式（无痕模式/隐私模式）
- `NOTICE_TEXT` - 提示文字
- `PROTECTED_ITEMS` - 不会保存的内容（浏览历史/Cookie/搜索记录）

## 🔞 约会/社交类

### 41. 约会软件配对
**模板ID**: `dating_match`
**关键词**: 探探、陌陌、约炮
**字段**:
- `APP_NAME` - APP名称
- `MATCH_NAME` - 配对对象昵称
- `AGE` - 年龄
- `DISTANCE` - 距离（如：距离你500米）
- `PROFILE_TEXT` - 个人简介
- `MATCH_TIME` - 配对时间
- `COMMON_INTERESTS` - 共同兴趣

### 42. 性病检测报告
**模板ID**: `std_test`
**关键词**: 性病检测、HIV、梅毒
**字段**:
- `PATIENT_NAME` - 姓名
- `TEST_DATE` - 检测日期
- `HIV_RESULT` - HIV检测结果（阴性/阳性）
- `SYPHILIS_RESULT` - 梅毒检测结果
- `GONORRHEA_RESULT` - 淋病检测结果
- `OVERALL_CONCLUSION` - 总体结论

### 43. 私密照片相册
**模板ID**: `private_album`
**关键词**: 私密照片、隐藏相册
**字段**:
- `ALBUM_NAME` - 相册名称
- `PHOTO_COUNT` - 照片数量
- `LAST_UPDATE` - 最后更新时间
- `LOCKED` - 是否加密
- `SIZE` - 占用空间
- `NOTICE` - 提示（不显示具体内容，仅显示相册信息）

### 44. 浏览历史（成人向）
**模板ID**: `adult_browser_history`
**关键词**: 浏览记录、成人网站历史
**字段**:
- `RECORD1_SITE` - 网站1（打码显示）
- `RECORD1_TIME` - 访问时间1
- `RECORD2_SITE` - 网站2（打码显示）
- `RECORD2_TIME` - 访问时间2
（可支持5-10条记录）
- `TOTAL_VISITS` - 总访问次数
- `LAST_CLEAR` - 上次清除时间

### 45. 性爱时长记录
**模板ID**: `sex_timer`
**关键词**: 性爱时长、计时器
**字段**:
- `DATE` - 日期
- `START_TIME` - 开始时间
- `END_TIME` - 结束时间
- `DURATION` - 持续时长
- `ROUNDS` - 回合数
- `AVERAGE_TIME` - 平均时长
- `LONGEST_RECORD` - 最长记录

### 46. 性爱日记
**模板ID**: `sex_diary`
**关键词**: 性爱日记、房事记录
**字段**:
- `DATE` - 日期
- `PARTNER` - 对象
- `LOCATION` - 地点
- `DURATION` - 时长
- `POSITIONS` - 体位
- `RATING` - 满意度评分
- `NOTES` - 备注/感受

### 47. 性幻想清单
**模板ID**: `fantasy_list`
**关键词**: 性幻想、愿望清单
**字段**:
- `ITEM1_NAME` - 项目1名称
- `ITEM1_STATUS` - 项目1状态（想尝试/已完成/进行中）
- `ITEM2_NAME` - 项目2名称
- `ITEM2_STATUS` - 项目2状态
（可支持10个项目）
- `COMPLETED_COUNT` - 已完成数量
- `TOTAL_COUNT` - 总数量

---

## 📋 使用说明

### 字段命名规范
- 全大写+下划线：`FIELD_NAME`
- 驼峰命名也可接受：`FieldName`

### 占位符格式
在HTML模板中使用：`{{FIELD_NAME}}`

### AI输出格式
```
字段1：值1
字段2：值2
字段3：值3
```

### 注意事项
1. 所有成人向模板需要打码/暗示，不显示露骨内容
2. 隐私信息需要脱敏处理（如：身份证号只显示后4位）
3. 尺度把握：暧昧暗示 > 直白露骨

文档已完成！共47个模板详细规范。
