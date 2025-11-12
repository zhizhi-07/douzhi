/**
 * 虚拟城市地名数据
 * 可以自由修改、添加地名
 */

export interface VirtualPlace {
  lat: number
  lng: number
  name: string
  type: 'district' | 'major' | 'commercial' | 'residential' | 'culture' | 'school' | 'park' | 'street' | 'transport' | 'hospital' | 'restaurant' | 'shop'
  size: string
}

// 虚拟城市：晨光市
export const virtualCityPlaces: VirtualPlace[] = [
  // ==================== 区域标注 ====================
  { lat: 39.9200, lng: 116.4074, name: '北区', type: 'district', size: '24px' },
  { lat: 39.9042, lng: 116.3900, name: '西区', type: 'district', size: '24px' },
  { lat: 39.9042, lng: 116.4250, name: '东区', type: 'district', size: '24px' },
  { lat: 39.8850, lng: 116.4074, name: '南区', type: 'district', size: '24px' },
  
  // ==================== 中心城区 ====================
  { lat: 39.9042, lng: 116.4074, name: '星河广场', type: 'major', size: '20px' },
  { lat: 39.9062, lng: 116.4094, name: '天际购物中心', type: 'commercial', size: '16px' },
  { lat: 39.9022, lng: 116.4054, name: '繁华大道', type: 'street', size: '14px' },
  
  // ==================== 北区（商业教育中心）====================
  { lat: 39.9182, lng: 116.4114, name: '市医院', type: 'hospital', size: '15px' },
  { lat: 39.9142, lng: 116.4094, name: '希望中学', type: 'school', size: '15px' },
  { lat: 39.9162, lng: 116.4034, name: '湖畔公园', type: 'park', size: '16px' },
  { lat: 39.9122, lng: 116.4154, name: '市图书馆', type: 'culture', size: '15px' },
  { lat: 39.9152, lng: 116.4074, name: '学府路', type: 'street', size: '13px' },
  { lat: 39.9192, lng: 116.4054, name: '智慧小学', type: 'school', size: '14px' },
  { lat: 39.9172, lng: 116.4134, name: '博雅书店', type: 'shop', size: '13px' },
  { lat: 39.9132, lng: 116.4114, name: '文艺咖啡馆', type: 'restaurant', size: '13px' },
  
  // ==================== 东区（新兴商业区）====================
  { lat: 39.9082, lng: 116.4224, name: '东方明珠商场', type: 'commercial', size: '16px' },
  { lat: 39.9042, lng: 116.4274, name: '科技园', type: 'commercial', size: '15px' },
  { lat: 39.9102, lng: 116.4254, name: '创新大街', type: 'street', size: '14px' },
  { lat: 39.9062, lng: 116.4294, name: '东城医院', type: 'hospital', size: '14px' },
  { lat: 39.9002, lng: 116.4234, name: '阳光小学', type: 'school', size: '14px' },
  { lat: 39.9122, lng: 116.4294, name: '数字广场', type: 'commercial', size: '14px' },
  { lat: 39.8982, lng: 116.4274, name: '未来公园', type: 'park', size: '15px' },
  { lat: 39.9142, lng: 116.4234, name: '蓝天超市', type: 'shop', size: '13px' },
  
  // ==================== 西区（文化居住区）====================
  { lat: 39.9082, lng: 116.3924, name: '艺术中心', type: 'culture', size: '15px' },
  { lat: 39.9042, lng: 116.3874, name: '市博物馆', type: 'culture', size: '15px' },
  { lat: 39.9102, lng: 116.3884, name: '云溪花园', type: 'residential', size: '14px' },
  { lat: 39.9002, lng: 116.3904, name: '枫林小区', type: 'residential', size: '14px' },
  { lat: 39.9122, lng: 116.3844, name: '文化路', type: 'street', size: '13px' },
  { lat: 39.9062, lng: 116.3824, name: '戏剧院', type: 'culture', size: '14px' },
  { lat: 39.8982, lng: 116.3864, name: '晨曦苑', type: 'residential', size: '14px' },
  { lat: 39.9142, lng: 116.3904, name: '墨香书社', type: 'shop', size: '13px' },
  { lat: 39.8942, lng: 116.3924, name: '雅韵茶馆', type: 'restaurant', size: '13px' },
  
  // ==================== 南区（休闲娱乐区）====================
  { lat: 39.8902, lng: 116.4094, name: '城市站', type: 'transport', size: '16px' },
  { lat: 39.8942, lng: 116.4174, name: '欢乐广场', type: 'commercial', size: '15px' },
  { lat: 39.8862, lng: 116.4134, name: '南湖公园', type: 'park', size: '16px' },
  { lat: 39.8922, lng: 116.4054, name: '启明小学', type: 'school', size: '14px' },
  { lat: 39.8882, lng: 116.4014, name: '和谐小区', type: 'residential', size: '14px' },
  { lat: 39.8822, lng: 116.4074, name: '南门市场', type: 'commercial', size: '14px' },
  { lat: 39.8962, lng: 116.4114, name: '美食街', type: 'street', size: '14px' },
  { lat: 39.8842, lng: 116.4154, name: '星空影院', type: 'culture', size: '14px' },
  { lat: 39.8902, lng: 116.4174, name: '游乐场', type: 'culture', size: '14px' },
  
  // ==================== 居住区细节 ====================
  { lat: 39.9022, lng: 116.3974, name: '锦绣家园', type: 'residential', size: '13px' },
  { lat: 39.9062, lng: 116.3954, name: '翠竹苑', type: 'residential', size: '13px' },
  { lat: 39.8962, lng: 116.4014, name: '花语城', type: 'residential', size: '13px' },
  { lat: 39.8982, lng: 116.4134, name: '春晓园', type: 'residential', size: '13px' },
  { lat: 39.9102, lng: 116.4134, name: '紫薇居', type: 'residential', size: '13px' },
  { lat: 39.9142, lng: 116.4154, name: '银杏里', type: 'residential', size: '13px' },
  
  // ==================== 商业街区 ====================
  { lat: 39.9082, lng: 116.4124, name: '时尚大道', type: 'street', size: '13px' },
  { lat: 39.9022, lng: 116.4144, name: '购物街', type: 'street', size: '13px' },
  { lat: 39.8962, lng: 116.4094, name: '商业路', type: 'street', size: '13px' },
  { lat: 39.9102, lng: 116.4014, name: '静安街', type: 'street', size: '13px' },
  
  // ==================== 餐饮店铺 ====================
  { lat: 39.9052, lng: 116.4064, name: '云端咖啡', type: 'restaurant', size: '12px' },
  { lat: 39.9032, lng: 116.4104, name: '星巴客', type: 'restaurant', size: '12px' },
  { lat: 39.9072, lng: 116.4084, name: '味蕾餐厅', type: 'restaurant', size: '12px' },
  { lat: 39.9012, lng: 116.4084, name: '老友记火锅', type: 'restaurant', size: '12px' },
  { lat: 39.9092, lng: 116.4044, name: '甜蜜蛋糕店', type: 'shop', size: '12px' },
  { lat: 39.8992, lng: 116.4044, name: '鲜果店', type: 'shop', size: '12px' },
  { lat: 39.9052, lng: 116.4024, name: '便利店', type: 'shop', size: '12px' },
  { lat: 39.9052, lng: 116.4144, name: '书香文具', type: 'shop', size: '12px' },
  
  // ==================== 公园景点 ====================
  { lat: 39.9002, lng: 116.4154, name: '中央公园', type: 'park', size: '16px' },
  { lat: 39.8922, lng: 116.3944, name: '西山森林公园', type: 'park', size: '14px' },
  { lat: 39.9182, lng: 116.4184, name: '樱花园', type: 'park', size: '14px' },
  { lat: 39.8842, lng: 116.4214, name: '湿地公园', type: 'park', size: '14px' },
]

// 地点类型颜色配置
export const placeColors: Record<string, string> = {
  district: '#000000',      // 区域 - 黑色
  major: '#1a1a1a',         // 主要地标 - 深黑
  commercial: '#2563eb',    // 商业 - 蓝色
  residential: '#059669',   // 居住 - 绿色
  culture: '#7c3aed',       // 文化 - 紫色
  school: '#dc2626',        // 学校 - 红色
  park: '#16a34a',          // 公园 - 深绿
  street: '#4b5563',        // 街道 - 灰色
  transport: '#ea580c',     // 交通 - 橙色
  hospital: '#dc2626',      // 医院 - 红色
  restaurant: '#f59e0b',    // 餐饮 - 黄色
  shop: '#8b5cf6'           // 商店 - 浅紫
}
