# Implementation Plan

- [ ] 1. Create Avatar Library Service
  - [ ] 1.1 Create `src/utils/avatarLibraryService.ts` with IndexedDB operations
    - Implement `initAvatarLibraryDB()` to create/open database
    - Implement `addAvatar(imageData, name?)` to store new avatar
    - Implement `getAvatars()` to retrieve all avatars sorted by createdAt
    - Implement `getAvatarByIndex(index)` to get avatar at specific position
    - Implement `getAvatarCount()` to get total avatar count
    - Implement `deleteAvatar(id)` to remove avatar
    - _Requirements: 2.2, 2.4, 3.2, 4.1_
  - [ ]* 1.2 Write property test for avatar storage round trip
    - **Property 1: Avatar Storage Round Trip**
    - **Validates: Requirements 2.2, 2.3**
  - [ ]* 1.3 Write property test for avatar deletion
    - **Property 2: Avatar Deletion Consistency**
    - **Validates: Requirements 3.2**
  - [ ]* 1.4 Write property test for avatar selection by index
    - **Property 3: Avatar Selection by Index**
    - **Validates: Requirements 4.1, 4.2**

- [ ] 2. Create Avatar Library Page
  - [ ] 2.1 Create `src/pages/AvatarLibrary.tsx` page component
    - Display header with back button and title "头像库"
    - Show avatar grid with uploaded images
    - Add upload button with image picker
    - Implement image compression before storage
    - Add delete functionality with confirmation
    - Add navigation link to avatar frame settings
    - _Requirements: 1.3, 2.1, 2.3, 3.1, 3.2, 6.1, 6.2_
  - [ ] 2.2 Add route for Avatar Library page in `src/App.tsx`
    - Add `/avatar-library` route pointing to AvatarLibrary component
    - _Requirements: 1.2_

- [ ] 3. Update Discover Page
  - [ ] 3.1 Modify `src/pages/Discover.tsx` to replace "搜一搜" with "头像库"
    - Change menu item name from "搜一搜" to "头像库"
    - Update icon to avatar-related icon
    - Set path to `/avatar-library`
    - Set enabled to true
    - _Requirements: 1.1, 1.2_

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Update Command Handler for Avatar Selection
  - [ ] 5.1 Modify `src/pages/ChatDetail/hooks/commandHandlers.ts`
    - Add new case for [换头像:选择:序号] command
    - Import and use `getAvatarByIndex` from avatarLibraryService
    - Handle invalid index with appropriate error message
    - Remove [换头像:生成:描述] case
    - Remove import of `generateAvatarForAI`
    - _Requirements: 4.1, 4.2, 4.3, 5.2_
  - [ ]* 5.2 Write property test for generation command rejection
    - **Property 4: Generation Command Rejection**
    - **Validates: Requirements 5.2**

- [ ] 6. Update AI Prompts
  - [ ] 6.1 Update `src/utils/chatApi.ts` to change avatar instructions
    - Replace [换头像:生成:描述] with [换头像:选择:序号]
    - Add instruction about available avatar count
    - _Requirements: 5.1, 5.3, 4.4_
  - [ ] 6.2 Update `src/utils/temp_final_prompt.ts` to change avatar instructions
    - Replace generation instructions with library selection instructions
    - _Requirements: 5.1, 5.3_
  - [ ] 6.3 Update `src/utils/userInfoChangeTracker.ts` to change avatar instructions
    - Replace [换头像:生成:描述] with [换头像:选择:序号]
    - _Requirements: 5.1, 5.3_
  - [ ] 6.4 Update `src/utils/formatCorrector.ts` to remove generation format correction
    - Remove or update the format correction for [换头像生成描述]
    - _Requirements: 5.2_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
