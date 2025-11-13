/**
 * AI图片生成工具
 * 使用 Pollinations.ai 免费生图API
 */

/**
 * 使用 Pollinations.ai 生成图片
 * @param description 图片描述（中文或英文）
 * @param width 图片宽度，默认512
 * @param height 图片高度，默认512
 * @returns base64格式的图片数据
 */
export async function generateImage(
  description: string,
  width: number = 512,
  height: number = 512
): Promise<string | null> {
  try {
    console.log('🎨 [生图] 开始生成图片:', description)
    
    // 简单中英翻译（避免中文导致生成错误）
    const translateMap: Record<string, string> = {
      '猫咪': 'cute cat', '小猫': 'kitten', '猫': 'cat',
      '狗': 'dog', '狗狗': 'cute dog',
      '兔子': 'rabbit', '小兔': 'bunny',
      '粉发': 'pink hair', '黑发': 'black hair', '金发': 'blonde hair',
      '二次元': 'anime style', '动漫': 'anime',
      '少女': 'girl', '女孩': 'girl', '男孩': 'boy',
      '机器人': 'robot', '赛博朋克': 'cyberpunk',
      '可爱': 'cute', '酷酷的': 'cool', '帅气': 'handsome',
      '真实': 'realistic', '照片': 'photo',
      '母亲': 'mother', '妈妈': 'mother', '宝宝': 'baby',
      '呢': '', '好看': '', '多爱': 'love', '比较': 'compare',
      '符合': 'match', '沉稳': 'calm', '气质': 'elegant', '喵喵': 'meow',
      '女生': 'girl', '男生': 'boy', '小孩': 'child',
      '风景': 'landscape', '天空': 'sky', '海边': 'beach',
      '森林': 'forest', '城市': 'city', '夜晚': 'night',
      '白天': 'day', '阳光': 'sunshine', '月亮': 'moon',
      '星空': 'starry sky', '彩虹': 'rainbow',
      '温柔': 'gentle', '优雅': 'elegant', '活泼': 'lively',
      '神秘': 'mysterious', '梦幻': 'dreamy', '清新': 'fresh'
    }
    
    let translatedDesc = description
    for (const [cn, en] of Object.entries(translateMap)) {
      translatedDesc = translatedDesc.replace(new RegExp(cn, 'g'), en)
    }
    
    // 强化提示词：添加更多关键词确保生成正确
    const enhancedPrompt = `portrait avatar of ${translatedDesc}, centered composition, profile picture style, high quality, detailed, professional digital art, 4k`
    
    console.log('📝 [生图] 翻译后的提示词:', enhancedPrompt)
    
    // 使用 Pollinations.ai API（免费且稳定）
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=${width}&height=${height}&nologo=true&enhance=true&model=flux`
    
    console.log('🌐 [生图] 请求URL:', imageUrl)
    
    // 下载图片
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) {
      throw new Error(`生图API返回错误: ${imgResponse.status}`)
    }
    
    const blob = await imgResponse.blob()
    
    // 转换为base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    
    console.log('✅ [生图] 生成成功，大小:', (base64.length / 1024).toFixed(2), 'KB')
    
    return base64
    
  } catch (error) {
    console.error('❌ [生图] 生成失败:', error)
    return null
  }
}

/**
 * 为AI生成新头像
 * @param description 头像描述
 * @returns base64格式的头像数据
 */
export async function generateAvatarForAI(description: string): Promise<string | null> {
  return generateImage(description, 512, 512)
}

/**
 * 生成小红书风格图片
 * @param description 图片描述
 * @returns base64格式的图片数据
 */
export async function generateXiaohongshuImage(description: string): Promise<string | null> {
  // 小红书风格：更大尺寸，更精美
  return generateImage(description, 768, 1024)
}

