// Mock Clerk authentication
jest.mock('@clerk/nextjs', () => ({
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
jest.mock('axios', () => ({
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
}));

// Mock CSS background for LinearGradient replacement
jest.mock('react-native-web', () => {
  const originalModule = jest.requireActual('react-native-web');
  return {
    ...originalModule,
    StyleSheet: {
      ...originalModule.StyleSheet,
      create: jest.fn(styles => styles),
    },
  };
});

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

// Set up global objects that are expected in React Native
global.__DEV__ = true;
