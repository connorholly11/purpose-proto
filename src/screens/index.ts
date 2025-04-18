// Re-export all screen components for easier imports
export { default as SignInScreen } from './SignInScreen';
export { default as QuestsScreen } from './QuestsScreen';
export { default as ProfileScreen } from './ProfileScreen';
export { default as AdminPromptScreen } from './AdminPromptScreen';
export { default as AdminUserScreen } from './AdminUserScreen';
export { default as AdminScreen } from './AdminScreen';
export { default as SummarizationStatusScreen } from './SummarizationStatusScreen';
export { default as TestingScreen } from './TestingScreen';
export { default as FeedbackScreen } from './FeedbackScreen';
export { default as EvalScreen } from './EvalScreen';
// Export the consolidated settings component
export { default as SettingsScreen } from './SettingsScreen';
// For backward compatibility - reexport the same component
import SettingsScreenComponent from './SettingsScreen';
export { SettingsScreenComponent as IOSSettingsScreen };
export { SettingsScreenComponent as UserSettingsScreen };

// All chat screens now use the consolidated components
import { UserChat, AdminChat } from '../components';
export { AdminChat as AiCompanionScreen };
export { AdminChat as ChatScreen };
export { UserChat as IOSChatScreen };
export { UserChat as UserChatScreen };
export { UserChat as UserScreen };