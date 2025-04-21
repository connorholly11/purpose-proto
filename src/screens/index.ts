// Re-export all screen components for easier imports
export { default as SignInScreen } from './SignInScreen';
export { default as QuestsScreen } from './QuestsScreen';
export { default as ProfileScreen } from './ProfileScreen';
export { default as ProfileSheet } from './ProfileSheet';
export { default as AdminPromptScreen } from './AdminPromptScreen';
export { default as AdminUserScreen } from './AdminUserScreen';
export { default as AdminScreen } from './AdminScreen';
export { default as SummarizationStatusScreen } from './SummarizationStatusScreen';
export { default as TestingScreen } from './TestingScreen';
export { default as FeedbackScreen } from './FeedbackScreen';
export { default as EvalScreen } from './EvalScreen';
export { default as SettingsScreen } from './SettingsScreen';

// Export the active chat screen components
import { AdminChat, UserChat } from '../components';
import ChatScreenComponent from './ChatScreen';

export { ChatScreenComponent as ChatScreen };
export { AdminChat as AiCompanionScreen };

// Previous compatibility exports now redirect to current components
export { UserChat as IOSChatScreen };
export { UserChat as UserChatScreen };
export { UserChat as UserScreen };

// Settings compatibility exports
import SettingsScreenComponent from './SettingsScreen';
export { SettingsScreenComponent as IOSSettingsScreen };
export { SettingsScreenComponent as UserSettingsScreen };