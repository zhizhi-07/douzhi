import { 
  ChatIcon, 
  MusicIcon, 
  SettingsIcon, 
  FileIcon,
  PhoneIcon,
  CalendarIcon,
  ForumIcon
} from '../components/Icons'
import { AppItem } from '../components/AppGrid'

// 第一页应用配置
export const page1Apps: AppItem[] = [
  { 
    id: 'wechat-app', 
    name: '微信', 
    icon: ChatIcon, 
    color: 'glass-card', 
    route: '/wechat' 
  },
  { 
    id: 'preset', 
    name: '预设', 
    icon: SettingsIcon, 
    color: 'glass-card', 
    route: '/preset' 
  },
  { 
    id: 'worldbook', 
    name: '世界书', 
    icon: FileIcon, 
    color: 'glass-card', 
    route: '/worldbook' 
  },
  { 
    id: 'music-app', 
    name: '音乐', 
    icon: MusicIcon, 
    color: 'glass-card', 
    route: '/music-player' 
  },
  { 
    id: 'settings', 
    name: '系统设置', 
    icon: SettingsIcon, 
    color: 'glass-card', 
    route: '/settings' 
  },
]

// 第二页应用配置
export const page2Apps: AppItem[] = [
  { 
    id: 'forum', 
    name: '论坛', 
    icon: ForumIcon, 
    color: 'glass-card', 
    route: '/forum' 
  },
  { 
    id: 'aiphone', 
    name: '查手机', 
    icon: PhoneIcon, 
    color: 'glass-card', 
    route: '/ai-phone-select' 
  },
  { 
    id: 'calendar', 
    name: '日历', 
    icon: CalendarIcon, 
    color: 'glass-card', 
    route: '/calendar' 
  },
]

// Dock应用配置
export const dockApps: AppItem[] = [
  { 
    id: 'api-config', 
    name: 'API', 
    icon: SettingsIcon, 
    color: 'glass-card', 
    route: '/api-list' 
  },
  { 
    id: 'offline', 
    name: '线下', 
    icon: ChatIcon, 
    color: 'glass-card', 
    route: '/offline-chat' 
  },
  { 
    id: 'customize', 
    name: '美化', 
    icon: SettingsIcon, 
    color: 'glass-card', 
    route: '/customize' 
  },
  { 
    id: 'worldbook', 
    name: '世界书', 
    icon: FileIcon, 
    color: 'glass-card', 
    route: '/worldbook' 
  },
]
