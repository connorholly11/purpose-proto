import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Switch, Platform } from 'react-native';
import { Card, Title, List, Divider, useTheme as usePaperTheme } from 'react-native-paper';
import { useTheme as useContextTheme } from '../context/ThemeContext';
import { ThemeKey, themeOptions } from '../theme/colors';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { useHaptics } from '../context/HapticsContext';

// Theme Picker component
const ThemePicker = ({ selectedTheme, onThemeChange }: { 
  selectedTheme: ThemeKey, 
  onThemeChange: (theme: ThemeKey) => void
}) => {
  const paperTheme = usePaperTheme();
  
  return (
    <Card style={styles.themeCard}>
      <Card.Content>
        <Title style={styles.sectionTitle}>Color Theme</Title>
        <View style={styles.themeGrid}>
          {(Object.keys(themeOptions) as Array<ThemeKey>).map((themeKey) => (
            <TouchableOpacity 
              key={themeKey}
              style={styles.themeOptionContainer}
              onPress={() => onThemeChange(themeKey)}
            >
              <View 
                style={[
                  styles.themeCircle, 
                  { backgroundColor: themeOptions[themeKey].color },
                  selectedTheme === themeKey ? styles.selectedThemeCircle : {}
                ]}
              />
              <Text style={[
                styles.themeLabel,
                selectedTheme === themeKey ? { color: themeOptions[themeKey].color, fontWeight: 'bold' } : {}
              ]}>
                {themeOptions[themeKey].name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

// Settings Screen component used for both iOS and Web
const SettingsScreen = () => {
  const navigation = useNavigation();
  const paperTheme = usePaperTheme();
  const { colorTheme, setColorTheme, darkMode, setDarkMode } = useContextTheme();
  const { hapticsEnabled, setHapticsEnabled } = useHaptics();

  // Toggle handlers
  const toggleDarkMode = () => setDarkMode(!darkMode);
  const toggleHaptics = () => setHapticsEnabled(!hapticsEnabled);

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: paperTheme.colors.surfaceVariant }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back-ios" size={24} color={paperTheme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: paperTheme.colors.primary }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.sectionContent}>
          {/* Account Info */}
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.profileHeader}>
                <View style={[styles.avatarContainer, { backgroundColor: paperTheme.colors.primary }]}>
                  <Text style={styles.avatarText}>M</Text>
                </View>
                <Title style={styles.userName}>Max Thompson</Title>
              </View>
            </Card.Content>
          </Card>
          
          {/* Theme Picker */}
          <ThemePicker 
            selectedTheme={colorTheme}
            onThemeChange={setColorTheme}
          />
          
          {/* Toggles Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Display</Title>
              <List.Item
                title="Dark Mode"
                right={() => <Switch 
                  value={darkMode} 
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: "#767577", true: paperTheme.colors.primary }}
                />}
              />
              <Divider />
              <List.Item
                title="Haptics"
                right={() => <Switch 
                  value={hapticsEnabled} 
                  onValueChange={toggleHaptics}
                  trackColor={{ false: "#767577", true: paperTheme.colors.primary }}
                />}
              />
            </Card.Content>
          </Card>
          
          {/* Other Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <List.Item
                title="Help & Support"
                left={props => <List.Icon {...props} icon="help-circle" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="About"
                description="Version 1.0.0"
                left={props => <List.Icon {...props} icon="information" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="Privacy Policy"
                left={props => <List.Icon {...props} icon="shield" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="Log Out"
                titleStyle={{ color: paperTheme.colors.error }}
                left={props => <List.Icon {...props} icon="logout" color={paperTheme.colors.error} />}
              />
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20, // Adjusted for status bar
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  themeCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  themeOptionContainer: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 16,
  },
  themeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 4,
  },
  selectedThemeCircle: {
    borderWidth: 3,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  themeLabel: {
    fontSize: 12,
    color: '#666',
  },
});

export default SettingsScreen;