# Requirements Document

## Introduction

本功能将发现页面的"搜一搜"入口改造为"头像库"功能。头像库允许用户上传和管理头像图片，AI角色可以从头像库中选择头像进行更换，而不是通过AI生成。头像存储在独立的存储空间中，不占用情侣空间的存储。同时移除AI生成头像的提示词，改为从头像库选择的方式。

## Glossary

- **头像库 (Avatar Library)**: 用户上传和管理头像图片的功能模块
- **AI换头像**: AI角色更换自己头像的功能
- **头像框 (Avatar Frame)**: 头像周围的装饰边框效果
- **IndexedDB**: 浏览器本地数据库，用于存储头像图片数据

## Requirements

### Requirement 1

**User Story:** As a user, I want to access an avatar library from the Discover page, so that I can manage avatar images for AI characters.

#### Acceptance Criteria

1. WHEN a user navigates to the Discover page THEN the system SHALL display "头像库" entry instead of "搜一搜"
2. WHEN a user taps on "头像库" entry THEN the system SHALL navigate to the avatar library page
3. WHEN the avatar library page loads THEN the system SHALL display all uploaded avatars in a grid layout

### Requirement 2

**User Story:** As a user, I want to upload avatar images to the library, so that AI characters can use them.

#### Acceptance Criteria

1. WHEN a user clicks the upload button THEN the system SHALL open the device image picker
2. WHEN a user selects an image THEN the system SHALL compress and store the image in IndexedDB
3. WHEN an image is uploaded THEN the system SHALL display the new avatar in the library grid immediately
4. WHEN storing avatar images THEN the system SHALL use a dedicated IndexedDB store separate from couple space storage

### Requirement 3

**User Story:** As a user, I want to delete avatars from the library, so that I can manage my avatar collection.

#### Acceptance Criteria

1. WHEN a user long-presses or clicks delete on an avatar THEN the system SHALL show a delete confirmation
2. WHEN a user confirms deletion THEN the system SHALL remove the avatar from IndexedDB and update the display

### Requirement 4

**User Story:** As an AI character, I want to select an avatar from the library, so that I can change my appearance.

#### Acceptance Criteria

1. WHEN an AI uses the command [换头像:选择:序号] THEN the system SHALL retrieve the avatar at that index from the library
2. WHEN the avatar is retrieved successfully THEN the system SHALL update the AI character's avatar
3. IF the specified index does not exist THEN the system SHALL notify the AI that the avatar was not found
4. WHEN an AI wants to change avatar THEN the system SHALL provide the available avatar count in the system prompt

### Requirement 5

**User Story:** As a developer, I want to remove the AI-generated avatar prompt, so that AI only uses library avatars.

#### Acceptance Criteria

1. WHEN the system provides avatar change instructions to AI THEN the system SHALL only include library selection method
2. WHEN the system processes avatar commands THEN the system SHALL remove support for [换头像:生成:描述] format
3. WHEN updating prompts THEN the system SHALL replace generation instructions with library selection instructions

### Requirement 6

**User Story:** As a user, I want to access avatar frame settings from the avatar library, so that I can customize avatar appearance.

#### Acceptance Criteria

1. WHEN a user is in the avatar library page THEN the system SHALL display a link or button to avatar frame settings
2. WHEN a user clicks the avatar frame settings THEN the system SHALL navigate to or show the frame customization interface
