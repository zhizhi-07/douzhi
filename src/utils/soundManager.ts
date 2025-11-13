/**
 * 系统音效管理器
 * 🎵 可爱音效系统
 */

// 🎵 可爱音效库 - 使用免费的可爱音效
const CUTE_SOUNDS = {
  // 点击音效 - 轻快可爱
  click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // 轻快点击

  // 发送消息 - 发送的感觉
  send: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // 发送音

  // 接收消息 - 通知的感觉
  notify: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // 柔和通知

  // 成功操作 - 完成的感觉
  success: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // 成功音

  // 错误提示 - 温柔的提示
  error: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', // 错误音

  // 长按 - 触发的感觉
  longPress: 'https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3', // 长按音

  // 加载更多 - 刷新的感觉
  loadMore: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3', // 加载音

  // 打开菜单 - 展开的感觉
  menuOpen: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // 菜单音

  // 关闭 - 收起的感觉
  close: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // 关闭音

  // 电话 - 来电的感觉
  call: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // 电话音
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
 * 🎵 播放系统音效（点击音效）
 */
export const playSystemSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_sound')
  const url = customSound || CUTE_SOUNDS.click

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(url, 0.25)
}

/**
 * 🎵 播放消息发送音效
 */
export const playMessageSendSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_send_sound')
  const url = customSound || CUTE_SOUNDS.send

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(url, 0.3)
}

/**
 * 🎵 播放消息通知音效
 */
export const playMessageNotifySound = () => {
  try {
    const enabled = localStorage.getItem('system_sound_enabled')
    if (enabled === 'false') return

    const customSound = localStorage.getItem('custom_notify_sound')
    const url = customSound || CUTE_SOUNDS.notify

    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    currentAudio = playSound(url, 0.35)
  } catch (error) {
    console.log('🎵 音效播放失败:', error)
  }
}

/**
 * 🎵 播放电话音效
 */
export const playCallSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_call_sound')
  const url = customSound || CUTE_SOUNDS.call

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(url, 0.4)
}

/**
 * 🎵 播放成功音效
 */
export const playSuccessSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.success, 0.3)
}

/**
 * 🎵 播放错误音效
 */
export const playErrorSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.error, 0.3)
}

/**
 * 🎵 播放长按音效
 */
export const playLongPressSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.longPress, 0.25)
}

/**
 * 🎵 播放加载更多音效
 */
export const playLoadMoreSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.loadMore, 0.25)
}

/**
 * 🎵 播放菜单打开音效
 */
export const playMenuOpenSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.menuOpen, 0.25)
}

/**
 * 🎵 播放关闭音效
 */
export const playCloseSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.close, 0.25)
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
