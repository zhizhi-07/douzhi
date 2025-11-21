/**
 * 系统音效管理器
 * 🎵 可爱音效系统 - 多样化音效
 */

// 🎵 可爱果冻音效库 - 超级软萌的音效
const CUTE_SOUNDS = {
  // 🔘 点击音效 - 可爱果冻音
  clickSoft: '/sounds/click.aiff', // 软萌泡泡
  clickBright: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 轻快泡泡
  clickPop: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 可爱弹跳
  clickTap: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 轻柔点击

  // 🎯 导航音效 - 轻快的切换音
  navSwitch: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 导航切换
  pageEnter: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 页面进入
  pageBack: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 返回

  // 💬 消息音效 - 温柔的提示音
  send: '/sounds/notify.aiff', // 发送消息（原来的接收音效）
  notify: '/sounds/send.aiff', // 接收消息（原来的发送音效）
  typing: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 正在输入

  // 📋 菜单音效 - 柔和的弹出音
  menuOpen: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 打开菜单
  menuClose: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 关闭菜单
  menuSelect: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 选择菜单项

  // 🎨 模态框音效
  modalOpen: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 打开模态框
  modalClose: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 关闭模态框

  // 👆 长按音效
  longPressStart: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 长按开始
  longPressEnd: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 长按结束

  // 🔄 加载音效
  loadMore: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 加载更多
  refresh: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 刷新

  // ✅ 反馈音效
  success: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // 成功
  error: 'https://assets.mixkit.co/active_storage/sfx/2577/2577-preview.mp3', // 错误
  warning: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 警告

  // 📞 通话音效
  call: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3', // 来电
  callEnd: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 挂断

  // 💝 特殊音效
  like: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 点赞
  transfer: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3', // 转账
  photo: 'https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3', // 拍照
  voice: 'https://assets.mixkit.co/active_storage/sfx/2356/2356-preview.mp3', // 语音
}

let currentAudio: HTMLAudioElement | null = null

// 🎵 音频池 - 为每个音效创建多个实例，避免冲突和延迟
const audioPool: Record<string, HTMLAudioElement[]> = {}
const POOL_SIZE = 3 // 每个音效保持3个实例

// 预加载音效池
const preloadSoundPool = (url: string): void => {
  if (!audioPool[url]) {
    audioPool[url] = []
    for (let i = 0; i < POOL_SIZE; i++) {
      const audio = new Audio(url)
      audio.preload = 'auto'
      audio.volume = 0.3
      // 预加载音频数据
      audio.load()
      audioPool[url].push(audio)
    }
  }
}

// 获取可用的音频实例
const getAvailableAudio = (url: string): HTMLAudioElement => {
  if (!audioPool[url]) {
    preloadSoundPool(url)
  }

  // 找到一个未在播放的实例
  const available = audioPool[url].find(audio => audio.paused)
  if (available) {
    return available
  }

  // 如果都在播放，返回第一个（会被重置）
  return audioPool[url][0]
}

/**
 * 播放音效的通用函数
 * 🎵 使用音频池，零延迟播放
 */
const playSound = (url: string, volume: number = 0.3) => {
  try {
    const audio = getAvailableAudio(url)
    audio.volume = volume
    audio.currentTime = 0

    // 立即播放，不等待 Promise
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(err => {
        // 忽略自动播放策略错误
        if (err.name !== 'NotAllowedError') {
          console.log('音效播放失败:', err)
        }
      })
    }

    return audio
  } catch (err) {
    console.error('创建音频失败:', err)
    return null
  }
}

/**
 * 🎵 初始化音效系统 - 预加载常用音效
 * 在应用启动时调用，避免首次播放延迟
 */
export const initSoundSystem = () => {
  console.log('🎵 初始化音效系统...')

  // 预加载最常用的音效
  const commonSounds = [
    CUTE_SOUNDS.send,
    CUTE_SOUNDS.notify,
    CUTE_SOUNDS.clickSoft,
    CUTE_SOUNDS.navSwitch,
    CUTE_SOUNDS.menuOpen,
    CUTE_SOUNDS.menuClose
  ]

  commonSounds.forEach(url => {
    preloadSoundPool(url)
  })

  console.log('✅ 音效系统初始化完成')
}

/**
 * 🎵 播放系统音效（通用点击音效）
 */
export const playSystemSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_sound')
  const url = customSound || CUTE_SOUNDS.clickSoft

  playSound(url, 0.08) // 🎵 超级柔和的音量
}

/**
 * 🎵 播放导航切换音效
 */
export const playNavSwitchSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  playSound(CUTE_SOUNDS.navSwitch, 0.3)
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
 * 🎵 播放消息发送音效
 */
export const playMessageSendSound = () => {
  const enabled = localStorage.getItem('system_sound_enabled')
  if (enabled === 'false') return

  const customSound = localStorage.getItem('custom_send_sound')
  const url = customSound || CUTE_SOUNDS.send

  playSound(url, 0.35)
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

    playSound(url, 0.35)
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
