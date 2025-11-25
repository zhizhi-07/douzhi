/**
 * 图片压缩工具
 */

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeKB?: number
}

/**
 * 压缩图片到指定大小
 */
export const compressImage = async (
  file: File,
  options: CompressOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    maxSizeKB = 500
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onerror = () => reject(new Error('读取文件失败'))
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onerror = () => reject(new Error('加载图片失败'))
      
      img.onload = () => {
        // 计算压缩后的尺寸
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }

        // 创建 canvas 进行压缩
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建 canvas 上下文'))
          return
        }

        // 绘制图片
        ctx.fillStyle = '#fff'
        ctx.fillRect(0, 0, width, height)
        ctx.drawImage(img, 0, 0, width, height)

        // 尝试不同的质量级别直到满足大小要求
        let currentQuality = quality
        let result = canvas.toDataURL('image/jpeg', currentQuality)
        
        // 如果结果仍然太大，降低质量
        while (getBase64SizeKB(result) > maxSizeKB && currentQuality > 0.1) {
          currentQuality -= 0.1
          result = canvas.toDataURL('image/jpeg', currentQuality)
        }

        console.log(`📸 图片压缩完成: ${(file.size / 1024).toFixed(1)}KB -> ${getBase64SizeKB(result).toFixed(1)}KB`)
        resolve(result)
      }
      
      img.src = e.target?.result as string
    }
    
    reader.readAsDataURL(file)
  })
}

/**
 * 计算 base64 字符串的大小（KB）
 */
const getBase64SizeKB = (base64: string): number => {
  const base64Length = base64.length - (base64.indexOf(',') + 1)
  return (base64Length * 0.75) / 1024
}

/**
 * 批量压缩图片
 */
export const compressImages = async (
  files: File[],
  options?: CompressOptions
): Promise<string[]> => {
  return Promise.all(files.map(file => compressImage(file, options)))
}
