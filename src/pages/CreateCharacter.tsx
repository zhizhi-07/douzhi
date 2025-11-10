import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'
import { characterService } from '../services/characterService'
import { extractCharacterCardFromPNG, convertCharacterCardToInternal } from '../utils/characterCardParser'
import { lorebookManager } from '../utils/lorebookSystem'

const CreateCharacter = () => {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const characterCardInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    nickname: '',      // 网名（选填）
    realName: '',      // 真名（必填）
    signature: '',     // 个性签名
    personality: '',   // 性格描述
    avatar: ''         // 头像
  })
  
  const [isImporting, setIsImporting] = useState(false)
  const [importedCharacterBook, setImportedCharacterBook] = useState<any>(null)

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理 Character Card PNG 导入
  const handleCharacterCardImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 检查是否为 PNG 文件
    if (!file.type.includes('png')) {
      alert('请选择 PNG 格式的 Character Card 文件')
      return
    }

    setIsImporting(true)

    try {
      // 提取 Character Card 数据
      const characterCard = await extractCharacterCardFromPNG(file)
      
      if (!characterCard) {
        throw new Error('无法解析 Character Card 数据')
      }
      
      // 同时读取图片作为头像
      const reader = new FileReader()
      reader.onloadend = async () => {
        const imageDataUrl = reader.result as string
        
        // 转换为内部格式
        const converted = convertCharacterCardToInternal(characterCard, imageDataUrl)
        
        console.log('导入角色卡:', converted.name)
        console.log('创建者:', converted.creator)
        if (converted.characterBook) {
          console.log('包含世界书，条目数:', converted.characterBook.entries?.length || 0)
          // 保存世界书数据，稍后在创建角色时导入
          setImportedCharacterBook(converted.characterBook)
        }
        
        // 填充表单
        setFormData({
          realName: converted.name,
          nickname: '',
          avatar: converted.avatar,
          signature: converted.signature,
          personality: converted.description
        })
        
        setIsImporting(false)
        
        // 显示成功提示
        const cardVersion = (characterCard as any).spec === 'chara_card_v2' ? 'V2' : 'V1'
        const hasWorldBook = converted.characterBook?.entries?.length > 0
        alert(`✅ 成功导入 Character Card ${cardVersion}!\n\n角色名: ${converted.name}\n创建者: ${converted.creator || '未知'}${hasWorldBook ? `\n世界书条目: ${converted.characterBook.entries.length}` : ''}`)
      }
      
      reader.onerror = () => {
        alert('图片读取失败')
        setIsImporting(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error: any) {
      console.error('导入 Character Card 失败:', error)
      alert(`导入失败: ${error.message || '未知错误'}`)
      setIsImporting(false)
    }
    
    // 清空输入，允许重复导入同一文件
    e.target.value = ''
  }

  const handleSubmit = () => {
    // 验证
    if (!formData.realName.trim()) {
      alert('请输入真实名字')
      return
    }

    // 保存角色
    const newCharacter = characterService.save({
      ...formData,
      world: '现代都市' // 添加默认世界
    })
    console.log('创建角色成功:', newCharacter)
    
    // 如果有导入的世界书，则创建并关联
    if (importedCharacterBook && importedCharacterBook.entries?.length > 0) {
      try {
        const lorebook = lorebookManager.importFromCharacterCard(
          importedCharacterBook,
          newCharacter.id,
          newCharacter.name
        )
        if (lorebook) {
          console.log('✅ 世界书导入成功:', lorebook.name, '条目数:', lorebook.entries.length)
        }
      } catch (error) {
        console.error('世界书导入失败:', error)
      }
    }
    
    // 跳转到通讯录
    navigate('/contacts')
  }

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa]">
      {/* 顶部 */}
      <div className="glass-effect">
        <StatusBar />
        <div className="px-5 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/contacts')}
            className="text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">创建角色</h1>
          <div className="flex items-center gap-2">
            <input
              ref={characterCardInputRef}
              type="file"
              accept=".png"
              onChange={handleCharacterCardImport}
              className="hidden"
            />
            <button 
              onClick={() => characterCardInputRef.current?.click()}
              disabled={isImporting}
              className="text-blue-600 font-medium disabled:opacity-50"
            >
              {isImporting ? '导入中...' : '上传'}
            </button>
            <button 
              onClick={handleSubmit}
              className="text-green-600 font-medium"
            >
              完成
            </button>
          </div>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 头像区域 */}
        <div className="flex justify-center mb-6">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-20 h-20 rounded-xl bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md border border-gray-200/50 overflow-hidden cursor-pointer"
          >
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleAvatarChange}
              className="hidden"
            />
            {formData.avatar ? (
              <img src={formData.avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            )}
          </button>
        </div>

        {/* 表单项 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
          {/* 真名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">真实名字 *</label>
            <input
              type="text"
              value={formData.realName}
              onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
              placeholder="角色的真实姓名"
              className="w-full bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 网名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">网名</label>
            <input
              type="text"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="聊天显示的名字（可选）"
              className="w-full bg-transparent text-gray-900 outline-none text-sm"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 个性签名 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">个性签名</label>
            <textarea
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
              placeholder="一句话介绍自己（可选）"
              rows={2}
              className="w-full bg-transparent text-gray-900 outline-none text-sm resize-none"
            />
          </div>

          <div className="border-b border-gray-100 my-3"></div>

          {/* 性格描述 */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1.5">性格描述</label>
            <textarea
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              placeholder="简单描述性格特点..."
              rows={3}
              className="w-full bg-transparent text-gray-900 outline-none text-sm resize-none"
            />
          </div>

        </div>

        {/* 提示文字 */}
        <div className="mt-4">
          <p className="text-xs text-gray-400 text-center">
            非必填项可留空使用默认设置
          </p>
        </div>
      </div>
    </div>
  )
}

export default CreateCharacter
