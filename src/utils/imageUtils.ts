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
 * 压缩图片并转换为base64
 * 用于处理用户上传的真实图片文件，大幅减少存储空间占用
 * @param file 原始图片文件
 * @param maxWidth 最大宽度（默认1200px）
 * @param maxHeight 最大高度（默认1200px）
 * @param quality 压缩质量（默认0.7，范围0-1）
 */
export function compressAndConvertToBase64(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // 计算缩放比例（保持宽高比）
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法获取canvas上下文'))
          return
        }

        // 如果是PNG，保持透明背景；否则填充白色
        const isPNG = file.type === 'image/png'
        if (!isPNG) {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, width, height)
        }

        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 根据原始格式选择输出格式（PNG保留透明通道，其他转JPEG）
        const outputFormat = isPNG ? 'image/png' : 'image/jpeg'
        
        try {
          const dataUrl = canvas.toDataURL(outputFormat, quality)
          // 去掉data:image/...;base64,前缀
          const base64 = dataUrl.split(',')[1]
          
          // 计算压缩率并输出日志
          const originalSize = file.size
          const compressedSize = Math.ceil(base64.length * 0.75) // base64解码后的大小估算
          const ratio = ((1 - compressedSize / originalSize) * 100).toFixed(1)
          console.log(`📦 图片压缩: ${file.name}`)
          console.log(`   原始大小: ${(originalSize / 1024).toFixed(1)}KB`)
          console.log(`   压缩后: ${(compressedSize / 1024).toFixed(1)}KB`)
          console.log(`   节省: ${ratio}%`)
          console.log(`   尺寸: ${width}x${height}`)
          
          resolve(base64)
        } catch (error) {
          reject(error)
        }
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 将文件转换为base64（不压缩）
 * 用于处理用户上传的真实图片文件
 * @deprecated 建议使用 compressAndConvertToBase64 以节省存储空间
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
