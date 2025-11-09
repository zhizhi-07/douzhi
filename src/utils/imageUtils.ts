/**
 * 图片处理工具
 */

/**
 * 根据照片描述生成一个简单的占位图片（base64）
 * 用于模拟图片数据供AI视觉识别
 */
export function generatePlaceholderImageBase64(description: string): string {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 300
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      return generateMinimalBase64()
    }
    
    // 渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 400, 300)
    gradient.addColorStop(0, '#e0f7fa')
    gradient.addColorStop(1, '#b2ebf2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 400, 300)
    
    // 添加描述文字
    ctx.fillStyle = '#00695c'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 将描述文字分行显示
    const words = description.split('')
    const lines: string[] = []
    let currentLine = ''
    
    for (const char of words) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > 350 && currentLine !== '') {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    lines.push(currentLine)
    
    // 绘制文字
    const startY = 150 - (lines.length * 12)
    lines.forEach((line, index) => {
      ctx.fillText(line, 200, startY + index * 24)
    })
    
    // 转换为base64（去掉data:image/png;base64,前缀）
    const dataUrl = canvas.toDataURL('image/png')
    return dataUrl.split(',')[1]
  } catch (error) {
    console.error('生成占位图片失败:', error)
    return generateMinimalBase64()
  }
}

/**
 * 生成一个最小的1x1透明PNG图片的base64
 * 作为备用方案
 */
function generateMinimalBase64(): string {
  // 1x1透明PNG的base64编码
  return 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
}

/**
 * 将文件转换为base64
 * 用于处理用户上传的真实图片文件
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // 去掉data:image/...;base64,前缀
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
