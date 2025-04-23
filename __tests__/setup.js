// Mock Clerk authentication
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: jest.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
    getToken: jest.fn().mockResolvedValue('test-token'),
    signOut: jest.fn(),
  }),
  SignedIn: ({ children }) => children,
  SignedOut: () => null,
  useUser: jest.fn().mockReturnValue({
    isLoaded: true,
    isSignedIn: true,
    user: {
      id: 'test-user-id',
      firstName: 'Test',
      lastName: 'User',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
}));

// Mock Axios
jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(() => ({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
      get: jest.fn().mockResolvedValue({ data: {} }),
      post: jest.fn().mockResolvedValue({ data: {} }),
      put: jest.fn().mockResolvedValue({ data: {} }),
      delete: jest.fn().mockResolvedValue({ data: {} }),
    })),
    isAxiosError: jest.fn().mockReturnValue(true),
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} })
  };
  return mockAxios;
});

// Mock Expo components used in the app
jest.mock('expo-status-bar', () => ({
  StatusBar: () => 'StatusBar',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: () => 'LinearGradient',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: jest.fn().mockReturnValue({
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  }),
}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn().mockReturnValue({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: jest.fn().mockReturnValue({
    params: {},
  }),
  createNavigatorFactory: jest.fn(),
}));

// Mock React Native Paper components
jest.mock('react-native-paper', () => ({
  Button: 'Button',
  TextInput: 'TextInput',
  Surface: 'Surface',
  Text: 'Text',
  IconButton: 'IconButton',
  FAB: 'FAB',
}));

// Mock for expo-speech-recognition
jest.mock('expo-speech-recognition', () => ({
  startAsync: jest.fn().mockResolvedValue(undefined),
  stopAsync: jest.fn().mockResolvedValue(undefined),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  addListener: jest.fn((listener) => {
    // Store the listener so tests can trigger it manually
    global.speechRecognitionListener = listener;
    
    return {
      remove: jest.fn()
    };
  })
}));

// Helper to simulate speech recognition results
global.simulateSpeechResult = (transcript) => {
  if (global.speechRecognitionListener) {
    global.speechRecognitionListener({
      eventType: 'results',
      results: [{ transcript }]
    });
  } else {
    console.warn('Speech recognition listener not registered');
  }
};

// Force Platform.OS to be 'ios' for iOS-specific tests
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: (obj) => obj.ios || obj.default
}));

// Set up necessary mocks for React Native
require('react-native-reanimated/mock');

// Set up global objects that are expected in React Native
global.__DEV__ = true;

// Silence console.error and console.warn in tests
console.error = jest.fn();
console.warn = jest.fn();