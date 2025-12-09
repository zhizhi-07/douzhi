/**
 * 零钱工具函数
 */

import { setItem, getItem, STORES } from './indexedDBManager'

// 交易类型
export type TransactionType = 
  | 'recharge'              // 充值
  | 'transfer_send'         // 转账支出
  | 'transfer_receive'      // 转账收入
  | 'red_envelope_send'     // 红包支出
  | 'red_envelope_receive'  // 红包收入
  | 'intimate_pay'          // 亲密付消费
  | 'income'                // 商品收入

// 交易记录
export interface Transaction {
  id: string
  type: TransactionType
  amount: string
  description: string
  timestamp: number
  characterName?: string
}

// 获取余额
export const getBalance = (): number => {
  const savedBalance = localStorage.getItem('wallet_balance')
  return savedBalance ? parseFloat(savedBalance) : 0
}

// 设置余额
export const setBalance = (balance: number): void => {
  localStorage.setItem('wallet_balance', balance.toFixed(2))
}

// 添加交易记录
export const addTransaction = (transaction: Omit<Transaction, 'id' | 'timestamp'>): void => {
  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    timestamp: Date.now()
  }
  
  const savedTransactions = localStorage.getItem('wallet_transactions')
  const transactions: Transaction[] = savedTransactions ? JSON.parse(savedTransactions) : []
  transactions.unshift(newTransaction)
  localStorage.setItem('wallet_transactions', JSON.stringify(transactions))
}

// 获取所有交易记录
export const getTransactions = (): Transaction[] => {
  const savedTransactions = localStorage.getItem('wallet_transactions')
  return savedTransactions ? JSON.parse(savedTransactions) : []
}

// 充值
export const recharge = (amount: number): boolean => {
  if (amount <= 0) return false
  
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'recharge',
    amount: amount.toFixed(2),
    description: '零钱充值'
  })
  
  return true
}

// 发送红包
export const sendRedEnvelope = (amount: number, characterName: string, blessing: string): boolean => {
  const currentBalance = getBalance()
  
  if (currentBalance < amount) {
    return false
  }
  
  const newBalance = currentBalance - amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'red_envelope_send',
    amount: amount.toFixed(2),
    description: `发出红包 - ${blessing}`,
    characterName
  })
  
  return true
}

// 接收红包
export const receiveRedEnvelope = (amount: number, characterName: string, blessing: string): void => {
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'red_envelope_receive',
    amount: amount.toFixed(2),
    description: `收到红包 - ${blessing}`,
    characterName
  })
}

// 发送转账
export const sendTransfer = (amount: number, characterName: string, message: string): boolean => {
  const currentBalance = getBalance()
  
  if (currentBalance < amount) {
    return false
  }
  
  const newBalance = currentBalance - amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'transfer_send',
    amount: amount.toFixed(2),
    description: `转账 - ${message}`,
    characterName
  })
  
  return true
}

// 接收转账
export const receiveTransfer = (amount: number, characterName: string, message: string): void => {
  const currentBalance = getBalance()
  const newBalance = currentBalance + amount
  setBalance(newBalance)
  
  addTransaction({
    type: 'transfer_receive',
    amount: amount.toFixed(2),
    description: `收到转账 - ${message}`,
    characterName
  })
}

// ==================== 亲密付系统 ====================

// 亲密付关系接口
export interface IntimatePayRelation {
  id: string
  characterId: string
  characterName: string
  characterAvatar?: string
  monthlyLimit: number
  usedAmount: number
  createdAt: number
  lastResetMonth: string // YYYY-MM
  type: 'user_to_character' | 'character_to_user'
}

// 内存缓存
let intimatePayCache: IntimatePayRelation[] | null = null
let cacheInitialized = false

// 从 localStorage 迁移到 IndexedDB
const migrateFromLocalStorage = async (): Promise<IntimatePayRelation[]> => {
  const localData = localStorage.getItem('intimate_pay_relations')
  if (localData) {
    try {
      const relations = JSON.parse(localData)
      await setItem(STORES.WALLET, 'intimate_pay_relations', relations)
      localStorage.removeItem('intimate_pay_relations') // 删除旧数据
      console.log('✅ [亲密付] 已从localStorage迁移到IndexedDB')
      return relations
    } catch (e) {
      console.error('❌ [亲密付] 迁移失败:', e)
    }
  }
  return []
}

// 获取所有亲密付关系（异步）
export const getIntimatePayRelationsAsync = async (): Promise<IntimatePayRelation[]> => {
  // 使用缓存
  if (cacheInitialized && intimatePayCache) {
    return intimatePayCache
  }
  
  // 尝试从 IndexedDB 读取
  let relations = await getItem<IntimatePayRelation[]>(STORES.WALLET, 'intimate_pay_relations')
  
  // 如果没有，尝试从 localStorage 迁移
  if (!relations || relations.length === 0) {
    relations = await migrateFromLocalStorage()
  }
  
  relations = relations || []
  
  // 检查并重置每月额度
  const currentMonth = new Date().toISOString().slice(0, 7)
  let hasReset = false
  
  const updatedRelations = relations.map(relation => {
    if (relation.lastResetMonth !== currentMonth) {
      hasReset = true
      return {
        ...relation,
        usedAmount: 0,
        lastResetMonth: currentMonth
      }
    }
    return relation
  })
  
  if (hasReset) {
    await saveIntimatePayRelationsAsync(updatedRelations)
  }
  
  intimatePayCache = updatedRelations
  cacheInitialized = true
  return updatedRelations
}

// 同步版本（使用缓存，首次调用可能返回空）
export const getIntimatePayRelations = (): IntimatePayRelation[] => {
  // 触发异步加载
  if (!cacheInitialized) {
    getIntimatePayRelationsAsync()
  }
  return intimatePayCache || []
}

// 保存亲密付关系（异步）
const saveIntimatePayRelationsAsync = async (relations: IntimatePayRelation[]): Promise<void> => {
  intimatePayCache = relations
  cacheInitialized = true
  await setItem(STORES.WALLET, 'intimate_pay_relations', relations)
}

// 同步保存（内部用）- 使用异步但不等待
const saveIntimatePayRelations = (relations: IntimatePayRelation[]): void => {
  intimatePayCache = relations
  cacheInitialized = true
  saveIntimatePayRelationsAsync(relations).catch(e => {
    console.error('❌ [亲密付] 保存失败:', e)
  })
}

// 开通亲密付（异步版本 - 推荐使用）
export const createIntimatePayRelationAsync = async (
  characterId: string,
  characterName: string,
  monthlyLimit: number,
  characterAvatar?: string,
  type: 'user_to_character' | 'character_to_user' = 'user_to_character'
): Promise<boolean> => {
  const relations = await getIntimatePayRelationsAsync()
  
  // 检查是否已存在（只检查相同类型的）
  if (relations.some(r => r.characterId === characterId && r.type === type)) {
    return false
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newRelation: IntimatePayRelation = {
    id: Date.now().toString(),
    characterId,
    characterName,
    characterAvatar,
    monthlyLimit,
    usedAmount: 0,
    createdAt: Date.now(),
    lastResetMonth: currentMonth,
    type
  }
  
  const updatedRelations = [...relations, newRelation]
  await saveIntimatePayRelationsAsync(updatedRelations)
  return true
}

// 开通亲密付（同步版本 - 兼容旧代码）
export const createIntimatePayRelation = (
  characterId: string,
  characterName: string,
  monthlyLimit: number,
  characterAvatar?: string,
  type: 'user_to_character' | 'character_to_user' = 'user_to_character'
): boolean => {
  const relations = getIntimatePayRelations()
  
  // 检查是否已存在（只检查相同类型的）
  if (relations.some(r => r.characterId === characterId && r.type === type)) {
    return false
  }
  
  const currentMonth = new Date().toISOString().slice(0, 7)
  const newRelation: IntimatePayRelation = {
    id: Date.now().toString(),
    characterId,
    characterName,
    characterAvatar,
    monthlyLimit,
    usedAmount: 0,
    createdAt: Date.now(),
    lastResetMonth: currentMonth,
    type
  }
  
  const updatedRelations = [...relations, newRelation]
  saveIntimatePayRelations(updatedRelations)
  return true
}

// 获取单个亲密付关系
export const getIntimatePayRelation = (
  characterId: string,
  type?: 'user_to_character' | 'character_to_user'
): IntimatePayRelation | null => {
  const relations = getIntimatePayRelations()
  
  if (type) {
    return relations.find(r => r.characterId === characterId && r.type === type) || null
  }
  
  return relations.find(r => r.characterId === characterId) || null
}

// 修改亲密付额度
export const updateIntimatePayLimit = (characterId: string, newLimit: number): boolean => {
  const relations = getIntimatePayRelations()
  const relationIndex = relations.findIndex(r => r.characterId === characterId && r.type === 'user_to_character')
  
  if (relationIndex === -1) {
    return false
  }
  
  relations[relationIndex].monthlyLimit = newLimit
  saveIntimatePayRelations(relations)
  return true
}

// 关闭亲密付
export const deleteIntimatePayRelation = (characterId: string, type?: 'user_to_character' | 'character_to_user'): boolean => {
  const relations = getIntimatePayRelations()
  const filtered = type
    ? relations.filter(r => !(r.characterId === characterId && r.type === type))
    : relations.filter(r => r.characterId !== characterId)
  
  if (filtered.length === relations.length) {
    return false
  }
  
  saveIntimatePayRelations(filtered)
  return true
}

// 使用亲密付（扣除已使用额度）
export const useIntimatePay = (characterName: string, amount: number): boolean => {
  const relations = getIntimatePayRelations()
  const relationIndex = relations.findIndex(r => 
    r.characterName === characterName && 
    r.type === 'character_to_user'
  )
  
  if (relationIndex === -1) {
    return false
  }
  
  const relation = relations[relationIndex]
  const remaining = relation.monthlyLimit - relation.usedAmount
  
  // 检查剩余额度
  if (remaining < amount) {
    return false
  }
  
  // 扣除已使用额度
  relations[relationIndex].usedAmount += amount
  saveIntimatePayRelations(relations)
  
  return true
}
