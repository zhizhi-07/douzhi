/**
 * Chat模块统一导出
 * 这个文件提供所有chat相关功能的统一入口
 */

// API核心
export {
  ChatApiError,
  getApiSettings,
  callAIApi,
  type ApiResponse
} from './chatApiCore'

// 上下文构建器
export {
  buildEmojiListPrompt,
  buildUserAvatarContext,
  getTimeSinceLastMessage,
  buildUnifiedMemoryContext,
  buildAIMemosContext,
  buildListeningTogetherContext,
  buildCoupleSpaceContext,
  buildMomentsListPrompt,
  buildAIMomentsPostPrompt
} from './contextBuilders'

// 提醒构建器
export {
  buildCareReminderContext,
  buildMemoReminderContext,
  buildNicknameCoupleReminderContext,
  buildQuoteReminderContext,
  buildDynamicInstructions,
  buildRejectionStatusContext
} from './reminderBuilders'

// 视频通话
export { buildVideoCallPrompt } from './videoCallPrompt'
