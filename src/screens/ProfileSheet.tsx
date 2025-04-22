import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Appbar, Avatar, Chip, Divider, List, Switch, Text, useTheme as usePaperTheme, Button, HelperText } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo'; // <-- Use Clerk hook
import { useClerkAvatar } from '../hooks/useClerkAvatar'; // <-- Use avatar hook
import { useTheme } from '../context/ThemeContext'; // <-- Use ThemeContext
import { useHaptics } from '../context/HapticsContext'; // <-- Use HapticsContext
import ThemePicker from '../components/ThemePicker'; // <-- Import ThemePicker
import { ThemeKey } from '../theme/colors'; // <-- Import ThemeKey
import useTestPush from '../hooks/useTestPush'; // <-- Import test push hook

const ProfileSheet = () => {
  const navigation = useNavigation();
  const paperTheme = usePaperTheme();
  const { user } = useUser(); // Get user data
  const { imageUrl, initials } = useClerkAvatar(); // Get avatar data
  const { 
    colorTheme, 
    setColorTheme, 
    darkMode, 
    setDarkMode 
  } = useTheme(); // Get theme state and setters
  const { 
    hapticsEnabled, 
    setHapticsEnabled, 
    trigger: triggerHaptic // Alias to avoid name clash
  } = useHaptics(); // Get haptics state and setters
  const { sendTest, loading, error, success, tokenInfo } = useTestPush(); // Get push test functions

  // On Android, this screen shouldn't be used directly
  if (Platform.OS !== 'ios') {
    return null;
  }

  // Wrap setter functions to trigger haptics
  const handleSetDarkMode = (value: boolean) => {
    setDarkMode(value);
    triggerHaptic(); // Trigger haptic on toggle
  };

  const handleSetHapticsEnabled = (value: boolean) => {
    setHapticsEnabled(value);
    // Haptics are triggered internally by the context setter
  };

  const handleThemeChange = (theme: ThemeKey) => {
    setColorTheme(theme);
    triggerHaptic(); // Trigger haptic on theme change
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Appbar.Header elevated mode="center-aligned" style={{ backgroundColor: paperTheme.colors.surface }}>
        <Appbar.Content title="Profile & Settings" titleStyle={{ color: paperTheme.colors.onSurface }} />
        <Appbar.Action icon="close" onPress={() => navigation.goBack()} color={paperTheme.colors.onSurface} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* User Header */}
        <View style={styles.headerContainer}>
          {imageUrl ? (
            <Avatar.Image 
              size={64} 
              source={{ uri: imageUrl }} 
              style={styles.avatar}
            />
          ) : (
            <Avatar.Text 
              size={64} 
              label={initials} 
              style={[styles.avatar, { backgroundColor: paperTheme.colors.primaryContainer }]} 
              labelStyle={{ color: paperTheme.colors.onPrimaryContainer, fontSize: 32 }}
            />
          )}
          <Text variant="titleLarge" style={[styles.userName, { color: paperTheme.colors.onBackground }]}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Chip 
            icon="information-outline" // Use outline variant
            mode="outlined" 
            style={[styles.betaBadge, { borderColor: paperTheme.colors.outline }]}
            textStyle={[styles.betaBadgeText, { color: paperTheme.colors.onSurfaceVariant}]}
          >
            Beta • Placeholder
          </Chip>
        </View>

        <Divider style={[styles.divider, { backgroundColor: paperTheme.colors.outline }]} />

        {/* Theme Picker */}
        <ThemePicker 
          selectedTheme={colorTheme} 
          onThemeChange={handleThemeChange} 
        />

        <Divider style={[styles.divider, { backgroundColor: paperTheme.colors.outline }]} />

        {/* Settings List */}
        <List.Section style={styles.listSection}>
          <List.Item
            title="Dark Mode"
            titleStyle={{ color: paperTheme.colors.onSurface }}
            left={() => <List.Icon icon="brightness-4" color={paperTheme.colors.onSurfaceVariant} />}
            right={() => (
              <Switch 
                value={darkMode} 
                onValueChange={handleSetDarkMode} // Use wrapped setter
                thumbColor={paperTheme.colors.primary} // Use theme color
                trackColor={{ false: paperTheme.colors.surfaceVariant, true: paperTheme.colors.primaryContainer }}
              />
            )}
            style={styles.listItem}
          />
          <List.Item
            title="Haptics"
            titleStyle={{ color: paperTheme.colors.onSurface }}
            left={() => <List.Icon icon="vibrate" color={paperTheme.colors.onSurfaceVariant} />}
            right={() => (
              <Switch 
                value={hapticsEnabled} 
                onValueChange={handleSetHapticsEnabled} // Use wrapped setter
                thumbColor={paperTheme.colors.primary} // Use theme color
                trackColor={{ false: paperTheme.colors.surfaceVariant, true: paperTheme.colors.primaryContainer }}
              />
            )}
            style={styles.listItem}
          />
        </List.Section>
        
        {/* Push Notification Test - Available for all users */}
        <Divider style={[styles.divider, { backgroundColor: paperTheme.colors.outline }]} />
        
        <View style={styles.pushTestContainer}>
          <Text variant="titleMedium" style={{ color: paperTheme.colors.onSurface, marginBottom: 8 }}>
            Test Push Notifications
          </Text>
          
          <Text style={{ color: paperTheme.colors.onSurfaceVariant, marginBottom: 16 }}>
            Send a test notification to verify your push notifications are working correctly.
          </Text>
          
          <Button
            mode="contained"
            loading={loading}
            onPress={() => {
              sendTest(60);
              triggerHaptic();
            }}
            style={styles.testButton}
            icon="bell"
          >
            Send Test Notification
          </Button>
          
          {(success || error) && (
            <HelperText
              type={error ? "error" : "info"}
              visible={true}
              style={styles.helperText}
            >
              {error || "Test notification scheduled! It will arrive in ~1 minute."}
            </HelperText>
          )}
          
          {/* Debug information (only shown in dev mode) */}
          {__DEV__ && (
            <View style={styles.debugInfo}>
              <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Debug Info:</Text>
              {tokenInfo ? (
                <>
                  <Text>Permissions: {tokenInfo.permissionsGranted ? '✅' : '❌'}</Text>
                  {tokenInfo.pushAvailable !== undefined && (
                    <Text>Push available: {tokenInfo.pushAvailable ? '✅' : '❌'}</Text>
                  )}
                  <Text>Token: {tokenInfo.token ? '✅' : '❌'}</Text>
                  {tokenInfo.token && (
                    <Text numberOfLines={1} ellipsizeMode="middle" style={{ fontSize: 12 }}>
                      {tokenInfo.token}
                    </Text>
                  )}
                  {tokenInfo.serverResponse && (
                    <Text>
                      Registered tokens: {tokenInfo.serverResponse.tokens || 0}
                    </Text>
                  )}
                  {tokenInfo.error && (
                    <Text style={{ color: 'red' }}>
                      Error: {tokenInfo.error.message || JSON.stringify(tokenInfo.error)}
                    </Text>
                  )}
                </>
              ) : (
                <Text>No token info available yet. Try sending a test notification.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  headerContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    marginBottom: 12,
  },
  userName: {
    marginBottom: 8,
  },
  betaBadge: {
    marginTop: 8,
    // borderColor: '#9e9e9e', // Use theme color
  },
  betaBadgeText: {
    // color: '#757575', // Use theme color
    fontSize: 12,
  },
  divider: {
    marginVertical: 16,
    marginHorizontal: 16, // Add horizontal margin
  },
  listSection: {
    marginHorizontal: 16, // Add horizontal margin
  },
  listItem: {
    paddingVertical: 8, // Add vertical padding
  },
  pushTestContainer: {
    marginHorizontal: 16,
    paddingBottom: 16,
  },
  testButton: {
    borderRadius: 8,
    marginVertical: 8,
  },
  helperText: {
    marginTop: 4,
    fontSize: 14,
  },
  debugInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});

export default ProfileSheet; 