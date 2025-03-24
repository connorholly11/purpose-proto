# Technical Debt Cleanup To-Do List

## Mobile-First and PWA Cleanup

- [x] Fix linter errors in `ChatInterface.tsx`:
  - [x] Type error in `shouldSummarize` function (expects string, receives Message[])
  - [x] Fix properties mismatch in `Message` components (showAvatar, timestamp, isLoading)
  - [x] Address incorrect role types ('system' not in the allowed values)

- [x] Fix missing properties in `MemoryManager` component:
  - [x] Add proper `onClose` prop implementation

- [x] Optimize PWA icon assets:
  - [x] Create proper 192x192 and 512x512 icons in `/public/icons/` directory
  - [x] Create proper sized apple-touch-icon.png (at least 180x180)
  - [x] Create screenshot images for PWA manifest

## Voice & Text-to-Speech Cleanup

- [x] Remove all remaining voice and TTS related code:
  - [x] Delete unused TTS API routes (`/api/tts` if exists)
  - [x] Delete unused real-time voice API routes (`/api/realtime-session` if exists)
  - [x] Remove all remaining voice-related imports in components
  - [x] Clean up any remaining TTS response handling in API services

- [x] Clean up type definitions:
  - [x] Remove `TTSRequest` and `TTSResponse` interfaces
  - [x] Remove `RealtimeSessionResponse` interface
  - [x] Remove WebRTC-related interfaces (RTCDataChannelEvent, AudioTranscriptEvent, etc.)
  - [x] Fix Message type to properly support 'system' role and other added properties

## Component Simplification

- [x] Simplify AudioRecorder component:
  - [x] Make transcription API call consistent with Message type (text vs transcript)
  - [x] Ensure proper error handling and user feedback

- [x] Improve DebugPanel implementation:
  - [x] Fix prop types to ensure it can receive messages properly
  - [x] Update debug message categories to match the current app functionality
  - [x] Ensure it doesn't interfere with mobile layout

- [x] Audit Chat Interface:
  - [x] Remove any remaining vestiges of real-time voice features
  - [x] Ensure the conversation memory features still work properly
  - [x] Fix the prompt selector to work properly on mobile

## API Routes and Services

- [x] Audit and clean up API routes:
  - [x] Verify all API endpoints are still needed and functional
  - [x] Ensure API response formats match the updated type definitions
  - [x] Fix /api/transcribe route to return 'text' instead of 'transcript'

- [x] Consolidate services:
  - [x] Update memoryService's shouldSummarize function to accept Message[] instead of string
  - [x] Ensure any other services properly match the updated type definitions

## Admin Interface

- [x] Audit admin interface:
  - [x] Fix any broken routes or components in the admin area
  - [x] Ensure the admin area is responsive and works on mobile
  - [x] Check if logs page is referenced but not implemented

## Testing and Documentation

- [x] Update tests to match new implementation:
  - [x] Fix any broken tests that rely on removed features
  - [x] Add tests for mobile-first behavior
  - [x] Test PWA installation and functionality

- [x] Update documentation:
  - [x] Document removed features and why they were removed
  - [x] Add mobile/responsive design documentation
  - [x] Update any API documentation to match current implementation

## Performance Optimization

- [x] Optimize bundle size:
  - [x] Remove unused dependencies from package.json
  - [x] Analyze and optimize bundle size with tools like @next/bundle-analyzer
  - [x] Lazy load non-critical components

- [x] Improve mobile performance:
  - [x] Use proper image optimization for any images
  - [x] Minimize main thread blocking operations
  - [x] Optimize CSS for better mobile performance

## Future-Proofing

- [x] Prepare for future features:
  - [x] Ensure code structure supports adding features back if needed
  - [x] Ensure API abstraction allows for different backend implementations
  - [x] Document extension points for future development

## Build and Deployment

- [x] Fix any build warnings or errors:
  - [x] Address any TypeScript errors
  - [x] Fix any ESLint warnings
  - [x] Ensure proper Next.js app router structure

- [x] Optimize deployment:
  - [x] Configure PWA for installation but without offline functionality
  - [x] Verify PWA works correctly when deployed
