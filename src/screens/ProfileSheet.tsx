import React from 'react';
import { StyleSheet, View, ScrollView, SafeAreaView, Platform } from 'react-native';
import { Appbar, Avatar, Chip, Divider, List, Switch, Text, useTheme as usePaperTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@clerk/clerk-expo'; // <-- Use Clerk hook
import { useClerkAvatar } from '../hooks/useClerkAvatar'; // <-- Use avatar hook
import { useTheme } from '../context/ThemeContext'; // <-- Use ThemeContext
import { useHaptics } from '../context/HapticsContext'; // <-- Use HapticsContext
import ThemePicker from '../components/ThemePicker'; // <-- Import ThemePicker
import { ThemeKey } from '../theme/colors'; // <-- Import ThemeKey

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
  // Removed placeholderText style
});

export default ProfileSheet; 