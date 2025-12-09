# Requirements Document

## Introduction

本功能旨在为群聊管理提供自动化的不活跃成员检测和清理能力。系统将监控群成员的活跃度，识别长期不活跃的成员，并提供自动或手动清理选项，帮助群主维护一个活跃的群聊环境。

## Glossary

- **System**: 不活跃成员清理系统
- **Group Chat**: 群聊，包含多个成员的聊天会话
- **Member**: 群成员，参与群聊的用户或AI角色
- **Inactive Member**: 不活跃成员，在指定时间段内未发送消息的群成员
- **Activity Threshold**: 活跃度阈值，定义成员被视为不活跃的时间期限
- **Cleanup Action**: 清理操作，将不活跃成员从群聊中移除的动作
- **Activity Record**: 活跃记录，记录成员最后一次发送消息的时间戳

## Requirements

### Requirement 1

**User Story:** 作为群主，我希望系统能够自动追踪所有群成员的活跃状态，以便我了解哪些成员长期不参与群聊。

#### Acceptance Criteria

1. WHEN a member sends a message in a group chat THEN the System SHALL update that member's activity record with the current timestamp
2. WHEN the group chat settings page is opened THEN the System SHALL display each member's last activity time
3. WHEN a member has never sent a message THEN the System SHALL display their join time as the reference point
4. THE System SHALL persist activity records to local storage immediately after each update
5. WHEN calculating inactivity duration THEN the System SHALL use the difference between current time and last activity timestamp

### Requirement 2

**User Story:** 作为群主，我希望能够自定义不活跃的时间标准，以便根据不同群聊的特点设置合适的阈值。

#### Acceptance Criteria

1. WHEN accessing group chat settings THEN the System SHALL provide an interface to configure the activity threshold
2. THE System SHALL support threshold values ranging from 1 day to 365 days
3. WHEN the user sets a threshold value THEN the System SHALL validate it is within the acceptable range
4. THE System SHALL persist the threshold configuration for each group chat independently
5. WHEN no threshold is configured THEN the System SHALL use a default value of 30 days

### Requirement 3

**User Story:** 作为群主，我希望查看所有不活跃成员的列表，以便决定是否清理他们。

#### Acceptance Criteria

1. WHEN the user requests to view inactive members THEN the System SHALL display all members whose inactivity duration exceeds the activity threshold
2. WHEN displaying inactive members THEN the System SHALL show member name, avatar, last activity time, and inactivity duration
3. WHEN the inactive member list is displayed THEN the System SHALL sort members by inactivity duration in descending order
4. WHEN there are no inactive members THEN the System SHALL display a message indicating all members are active
5. THE System SHALL update the inactive member list in real-time when activity records change

### Requirement 4

**User Story:** 作为群主，我希望能够手动选择要清理的不活跃成员，以便保留某些特殊成员。

#### Acceptance Criteria

1. WHEN viewing the inactive member list THEN the System SHALL provide a checkbox for each member
2. WHEN the user selects one or more members THEN the System SHALL enable the batch removal action button
3. WHEN the user confirms batch removal THEN the System SHALL remove all selected members from the group chat
4. WHEN members are removed THEN the System SHALL update the group member list immediately
5. WHEN members are removed THEN the System SHALL create a system notification message in the group chat

### Requirement 5

**User Story:** 作为群主，我希望系统能够自动清理不活跃成员，以便减少手动管理的工作量。

#### Acceptance Criteria

1. WHEN the user enables auto-cleanup in settings THEN the System SHALL activate automatic inactive member detection
2. WHEN auto-cleanup is enabled THEN the System SHALL check for inactive members daily at a configured time
3. WHEN inactive members are detected during auto-cleanup THEN the System SHALL remove them automatically
4. WHEN auto-cleanup removes members THEN the System SHALL create a detailed system notification listing removed members
5. THE System SHALL allow the user to disable auto-cleanup at any time

### Requirement 6

**User Story:** 作为群主，我希望能够设置白名单，以便某些重要成员即使不活跃也不会被清理。

#### Acceptance Criteria

1. WHEN viewing a member's profile in the group THEN the System SHALL provide an option to add them to the whitelist
2. WHEN a member is added to the whitelist THEN the System SHALL exclude them from inactive member detection
3. WHEN viewing the whitelist THEN the System SHALL display all protected members with an option to remove them
4. THE System SHALL persist the whitelist configuration for each group chat independently
5. WHEN auto-cleanup runs THEN the System SHALL skip all members in the whitelist

### Requirement 7

**User Story:** 作为群主，我希望在清理成员前收到确认提示，以便避免误操作。

#### Acceptance Criteria

1. WHEN the user initiates manual cleanup THEN the System SHALL display a confirmation dialog showing the count of members to be removed
2. WHEN the confirmation dialog is displayed THEN the System SHALL list all members that will be removed
3. WHEN the user cancels the confirmation THEN the System SHALL abort the cleanup operation and maintain current state
4. WHEN the user confirms the cleanup THEN the System SHALL proceed with member removal
5. WHEN cleanup is completed THEN the System SHALL display a success message with the count of removed members

### Requirement 8

**User Story:** 作为群成员，我希望了解群聊的活跃度要求，以便避免被清理。

#### Acceptance Criteria

1. WHEN a group has activity threshold configured THEN the System SHALL display this information in the group description
2. WHEN a member views their own profile in the group THEN the System SHALL show their last activity time and remaining days before being marked inactive
3. WHEN a member is approaching the inactivity threshold THEN the System SHALL send them a reminder notification
4. THE System SHALL send reminders when a member has 7 days remaining before being marked inactive
5. WHEN auto-cleanup is enabled THEN the System SHALL indicate this status in the group settings visible to all members
