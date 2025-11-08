/**
 * 系统音效管理器
 */

// 音效URL映射
const SOUND_URLS: Record<string, string> = {
  tap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  swoosh: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  send1: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  send2: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3',
  notify1: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3',
  notify2: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3',
  call1: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  call2: 'https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3'
}

let currentAudio: HTMLAudioElement | null = null

/**
 * 播放音效的通用函数
 */
const playSound = (url: string, volume: number = 0.3) => {
  try {
    const audio = new Audio(url)
    audio.volume = volume
    audio.play().catch(err => {
      console.log('音效播放失败:', err)
    })
    return audio
  } catch (err) {
    console.error('创建音频失败:', err)
    return null
  }
}

/**
 * 播放系统音效（点击音效）
 */
export const playSystemSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const soundType = localStorage.getItem('system_sound_type') || 'tap'
  const url = SOUND_URLS[soundType]
  if (!url) return
  
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  currentAudio = playSound(url)
}

/**
 * 播放消息发送音效
 */
export const playMessageSendSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const customSound = localStorage.getItem('custom_sound')
  if (customSound) {
    playSound(customSound, 0.4)
    return
  }
  
  const soundType = localStorage.getItem('message_send_sound') || 'send1'
  const url = SOUND_URLS[soundType]
  if (url) {
    playSound(url, 0.4)
  }
}

/**
 * 播放消息通知音效
 */
export const playMessageNotifySound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const soundType = localStorage.getItem('message_notify_sound') || 'notify1'
  const url = SOUND_URLS[soundType]
  if (url) {
    playSound(url, 0.5)
  }
}

/**
 * 播放视频通话音效
 */
export const playVideoCallSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const soundType = localStorage.getItem('video_call_sound') || 'call1'
  const url = SOUND_URLS[soundType]
  if (url) {
    playSound(url, 0.5)
  }
}

/**
 * 为元素添加点击音效
 */
export const addClickSound = (element: HTMLElement) => {
  element.addEventListener('click', playSystemSound)
}

/**
 * 移除元素的点击音效
 */
export const removeClickSound = (element: HTMLElement) => {
  element.removeEventListener('click', playSystemSound)
}
