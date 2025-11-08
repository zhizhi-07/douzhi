/**
 * 系统音效管理器
 */

// 内置默认音效
const DEFAULT_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3' // 柔和

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
  
  // 优先使用自定义音效，否则使用默认柔和音效
  const customSound = localStorage.getItem('custom_sound')
  const url = customSound || DEFAULT_SOUND_URL
  
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  currentAudio = playSound(url, 0.3)
}

/**
 * 播放消息发送音效
 */
export const playMessageSendSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const customSound = localStorage.getItem('custom_send_sound')
  const url = customSound || DEFAULT_SOUND_URL
  
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  currentAudio = playSound(url, 0.4)
}

/**
 * 播放消息通知音效
 */
export const playMessageNotifySound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const customSound = localStorage.getItem('custom_notify_sound')
  const url = customSound || DEFAULT_SOUND_URL
  
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  currentAudio = playSound(url, 0.5)
}

/**
 * 播放电话音效
 */
export const playCallSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return
  
  const customSound = localStorage.getItem('custom_call_sound')
  const url = customSound || DEFAULT_SOUND_URL
  
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  currentAudio = playSound(url, 0.5)
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
