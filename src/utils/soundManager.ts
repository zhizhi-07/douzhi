/**
 * 系统音效管理器
 * 🎵 可爱音效系统 - 多样化音效
 */

// 🎵 可爱音效库 - 软糯可爱的音效
const CUTE_SOUNDS = {
  // 🔘 点击音效 - 软糯可爱的泡泡音
  clickSoft: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 柔和泡泡音
  clickBright: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 明亮泡泡音
  clickPop: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // 可爱弹出音
  clickTap: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 轻柔点击

  // 🎯 导航音效 - 轻快的切换音
  navSwitch: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 导航切换
  pageEnter: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 页面进入
  pageBack: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // 返回（轻柔）

  // 💬 消息音效 - 温柔的提示音
  send: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 发送消息
  notify: 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3', // 接收消息（保留）
  typing: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 正在输入

  // 📋 菜单音效 - 柔和的弹出音
  menuOpen: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // 打开菜单
  menuClose: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 关闭菜单
  menuSelect: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 选择菜单项

  // 🎨 模态框音效
  modalOpen: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // 打开模态框
  modalClose: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 关闭模态框

  // 👆 长按音效
  longPressStart: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 长按开始
  longPressEnd: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 长按结束

  // 🔄 加载音效
  loadMore: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 加载更多
  refresh: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // 刷新

  // ✅ 反馈音效
  success: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // 成功（保留）
  error: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', // 错误（保留）
  warning: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 警告

  // 📞 通话音效
  call: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // 来电（保留）
  callEnd: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 挂断

  // 💝 特殊音效
  like: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // 点赞（可爱）
  transfer: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // 转账（保留）
  photo: 'https://assets.mixkit.co/active_storage/sfx/2001/2001-preview.mp3', // 拍照
  voice: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // 语音
}

let currentAudio: HTMLAudioElement | null = null

/**
 * 播放音效的通用函数
 * 🎵 默认音量降低到0.15，更柔和
 */
const playSound = (url: string, volume: number = 0.15) => {
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
 * 🎵 播放系统音效（通用点击音效）
 */
export const playSystemSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_sound')
  const url = customSound || CUTE_SOUNDS.clickSoft

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(url, 0.15) // 🎵 更柔和的音量
}

/**
 * 🎵 播放导航切换音效
 */
export const playNavSwitchSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.navSwitch, 0.3)
}

/**
 * 🎵 播放页面进入音效
 */
export const playPageEnterSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.pageEnter, 0.25)
}

/**
 * 🎵 播放返回音效
 */
export const playBackSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.pageBack, 0.25)
}

/**
 * 🎵 播放明亮点击音效
 */
export const playClickBrightSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.clickBright, 0.3)
}

/**
 * 🎵 播放弹出点击音效
 */
export const playClickPopSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.clickPop, 0.3)
}

/**
 * 🎵 播放轻敲点击音效
 */
export const playClickTapSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.clickTap, 0.25)
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
 * 🎵 播放长按开始音效
 */
export const playLongPressSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.longPressStart, 0.25)
}

/**
 * 🎵 播放长按结束音效
 */
export const playLongPressEndSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.longPressEnd, 0.2)
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

  currentAudio = playSound(CUTE_SOUNDS.menuOpen, 0.3)
}

/**
 * 🎵 播放菜单关闭音效
 */
export const playMenuCloseSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.menuClose, 0.25)
}

/**
 * 🎵 播放菜单选择音效
 */
export const playMenuSelectSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.menuSelect, 0.3)
}

/**
 * 🎵 播放关闭音效（通用）
 */
export const playCloseSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.menuClose, 0.25)
}

/**
 * 🎵 播放模态框打开音效
 */
export const playModalOpenSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.modalOpen, 0.3)
}

/**
 * 🎵 播放模态框关闭音效
 */
export const playModalCloseSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.modalClose, 0.25)
}

/**
 * 🎵 播放点赞音效
 */
export const playLikeSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.like, 0.35)
}

/**
 * 🎵 播放转账音效
 */
export const playTransferSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.transfer, 0.35)
}

/**
 * 🎵 播放拍照音效
 */
export const playPhotoSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.photo, 0.3)
}

/**
 * 🎵 播放语音音效
 */
export const playVoiceSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.voice, 0.3)
}

/**
 * 🎵 播放刷新音效
 */
export const playRefreshSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.refresh, 0.3)
}

/**
 * 🎵 播放挂断音效
 */
export const playCallEndSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
  }

  currentAudio = playSound(CUTE_SOUNDS.callEnd, 0.3)
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
