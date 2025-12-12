# Implementation Plan

- [x] 1. Add maskSwitched event listener to OfflineChat




  - [ ] 1.1 Add useEffect hook to listen for maskSwitched event in OfflineChat.tsx
    - Add event listener on component mount
    - Remove event listener on component unmount
    - Log when mask switch is detected for debugging
    - _Requirements: 1.2, 2.2_
  - [x]* 1.2 Write property test for mask sync




    - **Property 1: Mask sync after event**
    - **Validates: Requirements 1.1, 1.2, 2.2**



- [x] 2. Verify existing implementation


  - [ ] 2.1 Verify ChatSettings dispatches maskSwitched event correctly
    - Confirm event is dispatched when mask is toggled on/off
    - Confirm event is dispatched when mask selection changes
    - _Requirements: 2.1_
  - [ ] 2.2 Verify useChatAI reads latest mask settings on each AI reply
    - Confirm localStorage is read in handleAIReply
    - Confirm mask info is included in system prompt when enabled
    - _Requirements: 1.1, 2.3_

- [ ] 3. Final Checkpoint - Make sure all tests are passing
  - Ensure all tests pass, ask the user if questions arise.
