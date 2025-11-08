/**
 * 系统音效管理器
 */

// 音效URL映射
const SOUND_URLS: Record<string, string> = {
  tap: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  pop: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3',
  swoosh: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'
}

let currentAudio: HTMLAudioElement | null = null

/**
 * 播放系统音效
 */
export const playSystemSound = () => {
  // 检查是否启用音效
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') {
    return
  }
  
  // 获取当前音效类型
  const soundType = localStorage.getItem('system_sound_type') || 'tap'
  const url = SOUND_URLS[soundType]
  
  if (!url) {
    return
  }
  
  // 停止之前的音效
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }
  
  // 播放新音效
  try {
    const audio = new Audio(url)
    audio.volume = 0.3
    audio.play().catch(err => {
      // 静默处理播放失败（可能是用户未交互导致的浏览器限制）
      console.log('音效播放失败:', err)
    })
    currentAudio = audio
  } catch (err) {
    console.error('创建音频失败:', err)
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
