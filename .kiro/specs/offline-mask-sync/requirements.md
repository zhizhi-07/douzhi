# Requirements Document

## Introduction

本功能修复在聊天设置页面切换面具（Mask）后，线下模式（OfflineChat）没有同步更新面具设置的问题。当用户在 `/chat/{id}/settings` 页面切换面具后，返回线下模式继续聊天时，AI 应该使用新选择的面具身份进行对话。

## Glossary

- **面具（Mask）**: 用户的虚拟身份，包含昵称、头像、签名等信息，用于在聊天中以不同身份与 AI 交流
- **线下模式（OfflineChat）**: 独立的小说/剧情叙事界面，与普通聊天模式分离
- **聊天设置（ChatSettings）**: 每个聊天会话的配置页面，包含面具切换、语音设置等功能
- **useChatAI Hook**: 处理 AI 对话逻辑的 React Hook，负责构建系统提示词和发送消息

## Requirements

### Requirement 1

**User Story:** As a user, I want the offline chat mode to use the mask I selected in chat settings, so that my AI conversations reflect my chosen identity.

#### Acceptance Criteria

1. WHEN a user switches mask in chat settings and returns to offline chat THEN the system SHALL use the newly selected mask for subsequent AI conversations
2. WHEN the maskSwitched event is dispatched THEN the OfflineChat component SHALL update its internal state to reflect the new mask settings
3. WHEN a user disables mask usage in chat settings THEN the system SHALL revert to using the user's main identity in offline chat mode

### Requirement 2

**User Story:** As a user, I want real-time mask synchronization without page refresh, so that I can seamlessly switch between settings and chat.

#### Acceptance Criteria

1. WHEN the chat settings page saves mask changes THEN the system SHALL dispatch a maskSwitched event with the new maskId
2. WHEN the OfflineChat component receives a maskSwitched event THEN the system SHALL re-read the chat settings from localStorage
3. WHEN mask settings change THEN the system SHALL apply the new mask to the next AI message without requiring a page reload
