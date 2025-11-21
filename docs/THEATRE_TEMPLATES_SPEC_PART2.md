# 小剧场模板字段规范文档 - 第二部分

## 🍔 生活服务类

### 13. 外卖评价
**模板ID**: `delivery_review`
**关键词**: 外卖评价、骑手评分
**字段**:
- `ORDER_NO` - 订单号
- `RESTAURANT` - 商家名称
- `RIDER_NAME` - 骑手姓名
- `STAR_RATING` - 星级评分（1-5星）
- `DELIVERY_TIME` - 送达时间
- `REVIEW_TEXT` - 评价内容
- `REWARD_AMOUNT` - 赏金金额（可选）

### 14. 导航路线
**模板ID**: `navigation`
**关键词**: 导航、路线、地图
**字段**:
- `FROM_LOCATION` - 起点
- `TO_LOCATION` - 终点
- `DISTANCE` - 距离（如：8.5公里）
- `DURATION` - 预计时间（如：23分钟）
- `ROUTE_TYPE` - 路线类型（推荐路线/最快路线/少收费）
- `TRAFFIC_STATUS` - 路况（畅通/缓行/拥堵）

### 15. 加油记录
**模板ID**: `gas_record`
**关键词**: 加油、油费
**字段**:
- `STATION_NAME` - 加油站名称
- `OIL_TYPE` - 油品类型（92/95/98号汽油）
- `PRICE_PER_LITER` - 单价
- `LITERS` - 加油升数
- `TOTAL_AMOUNT` - 总金额
- `DATE_TIME` - 加油时间
- `MILEAGE` - 当前里程

## 🎮 社交/游戏类

### 16. 好友列表
**模板ID**: `friend_list`
**关键词**: 好友列表、在线好友
**字段**:
- `FRIEND1_NAME` - 好友1昵称
- `FRIEND1_STATUS` - 好友1状态（在线/离开/忙碌）
- `FRIEND2_NAME` - 好友2昵称
- `FRIEND2_STATUS` - 好友2状态
（可支持10个好友）
- `TOTAL_ONLINE` - 在线总数
- `TOTAL_FRIENDS` - 好友总数

### 17. 评论区
**模板ID**: `comment_section`
**关键词**: 评论、热评
**字段**:
- `POST_TITLE` - 帖子标题
- `COMMENT1_USER` - 评论1用户
- `COMMENT1_CONTENT` - 评论1内容
- `COMMENT1_LIKES` - 评论1点赞数
- `COMMENT2_USER` - 评论2用户
- `COMMENT2_CONTENT` - 评论2内容
- `COMMENT2_LIKES` - 评论2点赞数
（可支持5条评论）

### 18. 排行榜
**模板ID**: `leaderboard`
**关键词**: 排行榜、排名
**字段**:
- `BOARD_NAME` - 榜单名称
- `MY_RANK` - 我的排名
- `MY_SCORE` - 我的分数
- `RANK1_NAME` - 第1名昵称
- `RANK1_SCORE` - 第1名分数
- `RANK2_NAME` - 第2名昵称
- `RANK2_SCORE` - 第2名分数
（可支持前10名）

## 📦 电商/物流类

### 19. 物流跟踪
**模板ID**: `logistics_tracking`
**关键词**: 物流、快递跟踪
**字段**:
- `EXPRESS_NO` - 快递单号
- `COURIER` - 快递公司
- `STATUS` - 当前状态（运输中/派送中/已签收）
- `RECORD1_TIME` - 记录1时间
- `RECORD1_DESC` - 记录1描述
- `RECORD2_TIME` - 记录2时间
- `RECORD2_DESC` - 记录2描述
（可支持5条物流记录）

### 20. 退款申请
**模板ID**: `refund_request`
**关键词**: 退款、售后
**字段**:
- `ORDER_NO` - 订单号
- `PRODUCT_NAME` - 商品名称
- `REFUND_AMOUNT` - 退款金额
- `REFUND_REASON` - 退款原因
- `STATUS` - 当前状态（审核中/已同意/已拒绝）
- `APPLY_TIME` - 申请时间
- `PROCESS_TIME` - 预计处理时间

## 💌 情感/表达类

### 21. 时间胶囊
**模板ID**: `time_capsule`
**关键词**: 时间胶囊、给未来的信
**字段**:
- `WRITE_DATE` - 写信日期
- `OPEN_DATE` - 开启日期
- `TO_WHO` - 收信人
- `TITLE` - 信件标题
- `CONTENT` - 信件内容
- `WISH` - 愿望/期待

### 22. 树洞
**模板ID**: `confession_wall`
**关键词**: 树洞、匿名倾诉
**字段**:
- `POST_ID` - 帖子编号
- `ANONYMOUS_NAME` - 匿名昵称（如：匿名用户#1234）
- `CONTENT` - 倾诉内容
- `POST_TIME` - 发布时间
- `LIKE_COUNT` - 点赞数
- `COMMENT_COUNT` - 评论数

### 23. 表白墙
**模板ID**: `confession_board`
**关键词**: 表白墙、匿名表白
**字段**:
- `TO_WHO` - 表白对象
- `FROM_WHO` - 发起人（可匿名）
- `CONTENT` - 表白内容
- `DATE` - 发布日期
- `SCHOOL_OR_PLACE` - 学校/地点
- `RESPONSE` - 回应状态（未回应/已查看/已回应）

### 24. 闹钟
**模板ID**: `alarm_clock`
**关键词**: 闹钟、提醒
**字段**:
- `ALARM1_TIME` - 闹钟1时间
- `ALARM1_LABEL` - 闹钟1标签
- `ALARM1_ENABLED` - 闹钟1启用状态
- `ALARM2_TIME` - 闹钟2时间
- `ALARM2_LABEL` - 闹钟2标签
- `ALARM2_ENABLED` - 闹钟2启用状态
（可支持5个闹钟）

## 🏨 酒店/住宿类

### 25. 酒店预订
**模板ID**: `hotel_booking`
**关键词**: 酒店预订、住宿
**字段**:
- `HOTEL_NAME` - 酒店名称
- `ROOM_TYPE` - 房型（大床房/标准间/套房）
- `CHECK_IN` - 入住日期
- `CHECK_OUT` - 退房日期
- `NIGHTS` - 住宿天数
- `GUEST_NAME` - 入住人姓名
- `TOTAL_PRICE` - 总价
- `CONTACT` - 联系电话
- `ORDER_NO` - 订单号

### 26. 情侣酒店
**模板ID**: `couple_hotel`
**关键词**: 情侣酒店、情趣酒店、大床房
**字段**:
- `HOTEL_NAME` - 酒店名称
- `ROOM_TYPE` - 房型（情侣大床房/圆床房/主题房）
- `SPECIAL_FEATURES` - 特色（如：浴缸/镜面天花板/情趣椅）
- `CHECK_IN` - 入住时间
- `CHECK_OUT` - 退房时间
- `PRICE` - 房价
- `GUEST_NAME` - 入住人
- `ORDER_NO` - 订单号

## 🛍️ 成人消费类

### 27. 情趣商城订单
**模板ID**: `adult_shop`
**关键词**: 情趣用品、成人用品
**字段**:
- `PRODUCT1_NAME` - 商品1名称
- `PRODUCT1_SPEC` - 商品1规格
- `PRODUCT1_PRICE` - 商品1价格
- `PRODUCT2_NAME` - 商品2名称（可选）
- `PRODUCT2_SPEC` - 商品2规格
- `PRODUCT2_PRICE` - 商品2价格
- `TOTAL_AMOUNT` - 总金额
- `ORDER_NO` - 订单号
- `SHIPPING_METHOD` - 配送方式（隐私包装）

### 28. 婚恋网
**模板ID**: `dating_profile`
**关键词**: 婚恋、相亲、征婚
**字段**:
- `NAME` - 姓名
- `AGE` - 年龄
- `HEIGHT` - 身高
- `EDUCATION` - 学历
- `JOB` - 职业
- `INCOME` - 收入
- `HOMETOWN` - 籍贯
- `HOBBIES` - 兴趣爱好
- `REQUIREMENTS` - 择偶要求

文档已保存到：`docs/THEATRE_TEMPLATES_SPEC_PART2.md`

继续第三部分？
