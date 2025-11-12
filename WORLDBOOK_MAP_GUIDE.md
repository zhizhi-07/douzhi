# 世界书 + 地图联动系统设计

## 概念
通过在世界书中定义地点，地图自动读取并生成标注，AI也能识别这些地点。

## 使用方法

### 1. 在世界书中定义地点

创建世界书条目，使用特定格式：

**条目标题格式**：`[地点] 地点名称`

**条目内容格式**：
```
类型: 商业/居住/文化/学校/公园/交通/医院/餐饮
坐标: 39.9042,116.4074
描述: 这里是市中心最繁华的商业广场...
```

### 2. 示例世界书条目

#### 示例1：商业区
```
标题：[地点] 星河广场
内容：
类型: 商业
坐标: 39.9042,116.4074
描述: 城市中心的大型购物中心，有各种商店、餐厅和咖啡馆。是年轻人最喜欢的聚会场所。
```

#### 示例2：公园
```
标题：[地点] 中央公园
内容：
类型: 公园
坐标: 39.9002,116.4154
描述: 城市最大的公园，有湖泊、树林和健身设施。周末经常有人来这里散步、跑步。
```

#### 示例3：学校
```
标题：[地点] 希望中学
内容：
类型: 学校
坐标: 39.9142,116.4094
描述: 市重点中学，教学质量优秀。学生们在这里度过青春时光。
```

## 系统实现（待开发）

### 阶段1：手动测试 ✅
- [x] 地图基础功能
- [x] 5个测试地点
- [x] AI位置标记

### 阶段2：世界书读取
```typescript
// 从世界书读取地点
function loadPlacesFromWorldBook() {
  const worldBookEntries = worldBookService.getAll()
  const places = worldBookEntries
    .filter(entry => entry.title.startsWith('[地点]'))
    .map(entry => parseLocationEntry(entry))
  
  return places
}

// 解析地点条目
function parseLocationEntry(entry) {
  const lines = entry.content.split('\n')
  const type = lines.find(l => l.startsWith('类型:'))?.split(':')[1].trim()
  const coords = lines.find(l => l.startsWith('坐标:'))?.split(':')[1].trim()
  const [lat, lng] = coords.split(',').map(Number)
  
  return {
    name: entry.title.replace('[地点]', '').trim(),
    type,
    lat,
    lng
  }
}
```

### 阶段3：AI识别
```typescript
// 在聊天prompt中注入地点信息
const availablePlaces = loadPlacesFromWorldBook()
const placesList = availablePlaces.map(p => p.name).join('、')

const systemPrompt = `
你生活的城市有以下地点：${placesList}

当你想去某个地方时，请在回复中使用格式：
[去] 地点名称

系统会自动更新你的位置。
`
```

### 阶段4：自动位置更新
```typescript
// 监听AI消息，识别移动意图
chatService.on('message', (message) => {
  const moveMatch = message.content.match(/\[去\]\s*(.+)/)
  if (moveMatch) {
    const placeName = moveMatch[1]
    const place = findPlaceByName(placeName)
    
    if (place) {
      locationService.recordLocation({
        characterId: message.characterId,
        lat: place.lat,
        lng: place.lng,
        areaName: place.name,
        activity: `到达${place.name}`,
        source: 'ai'
      })
    }
  }
})
```

## 快速开始

1. **先刷新页面看看地图** - 现在有5个测试地点
2. **试试添加测试数据** - 点击按钮添加AI位置
3. **等我实现世界书联动** - 然后就能自动生成地图了

## 下一步计划

1. ✅ 地图基础显示
2. ✅ 测试地点标注
3. ⏳ 世界书读取功能
4. ⏳ AI移动指令识别
5. ⏳ 自动位置更新

---

**现在你可以：**
- 先看看地图效果
- 试试添加测试数据
- 告诉我你想要什么功能
