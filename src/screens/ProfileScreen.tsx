import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, Chip, ProgressBar, List, useTheme as usePaperTheme } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { ThemeKey, themeOptions } from '../theme/colors';

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

// Profile Screen component
const ProfileScreen = () => {
  // On iOS, we should just return null since we're using a separate settings screen
  if (Platform.OS === 'ios') {
    return null;
  }
  
  const [activeSection, setActiveSection] = useState('profile');
  const paperTheme = usePaperTheme();
  const { colorTheme, setColorTheme } = useTheme();

  const handleSectionChange = (section: string) => {
    setActiveSection(section);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.avatarContainer, { backgroundColor: paperTheme.colors.primary }]}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <Title style={styles.userName}>Max Thompson</Title>
        <Text style={styles.userLevel}>Level 8 Explorer</Text>
        
        <View style={styles.xpContainer}>
          <ProgressBar progress={0.75} color={paperTheme.colors.primary} style={styles.xpProgress} />
          <View style={styles.xpLabels}>
            <Text style={styles.xpCurrent}>560 XP</Text>
            <Text style={[styles.xpNeeded, { color: paperTheme.colors.primary }]}>750 XP needed for Level 9</Text>
          </View>
        </View>
      </View>

      {/* Section Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionsContainer}
      >
        <Chip 
          selected={activeSection === 'profile'}
          onPress={() => handleSectionChange('profile')}
          style={[styles.sectionChip, activeSection === 'profile' ? [styles.activeChip, { backgroundColor: paperTheme.colors.primary }] : {}]}
          textStyle={activeSection === 'profile' ? styles.activeChipText : {}}
        >
          Profile
        </Chip>
        <Chip 
          selected={activeSection === 'settings'}
          onPress={() => handleSectionChange('settings')}
          style={[styles.sectionChip, activeSection === 'settings' ? [styles.activeChip, { backgroundColor: paperTheme.colors.primary }] : {}]}
          textStyle={activeSection === 'settings' ? styles.activeChipText : {}}
        >
          Settings
        </Chip>
        <Chip 
          selected={activeSection === 'dashboard'}
          onPress={() => handleSectionChange('dashboard')}
          style={[styles.sectionChip, activeSection === 'dashboard' ? [styles.activeChip, { backgroundColor: paperTheme.colors.primary }] : {}]}
          textStyle={activeSection === 'dashboard' ? styles.activeChipText : {}}
        >
          Dashboard
        </Chip>
        <Chip 
          selected={activeSection === 'achievements'}
          onPress={() => handleSectionChange('achievements')}
          style={[styles.sectionChip, activeSection === 'achievements' ? [styles.activeChip, { backgroundColor: paperTheme.colors.primary }] : {}]}
          textStyle={activeSection === 'achievements' ? styles.activeChipText : {}}
        >
          Achievements
        </Chip>
      </ScrollView>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <View style={styles.sectionContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Your Bio</Title>
              <Paragraph style={styles.bioText}>
                Adventurous explorer on a journey to improve myself every day. Love reading, hiking, and learning new things!
              </Paragraph>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Personal Goals</Title>
              <View style={styles.goalsList}>
                <View style={styles.goal}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalText}>Read 12 books this year</Text>
                    <Text style={[styles.goalProgress, { color: paperTheme.colors.primary }]}>5/12</Text>
                  </View>
                  <ProgressBar progress={5/12} color={paperTheme.colors.primary} style={styles.goalProgressBar} />
                </View>
                
                <View style={styles.goal}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalText}>Exercise 3x weekly</Text>
                    <Text style={[styles.goalProgress, { color: paperTheme.colors.primary }]}>2/3</Text>
                  </View>
                  <ProgressBar progress={2/3} color={paperTheme.colors.primary} style={styles.goalProgressBar} />
                </View>
                
                <View style={styles.goal}>
                  <View style={styles.goalHeader}>
                    <Text style={styles.goalText}>Learn a new language</Text>
                    <Text style={[styles.goalProgress, { color: paperTheme.colors.primary }]}>10%</Text>
                  </View>
                  <ProgressBar progress={0.1} color={paperTheme.colors.primary} style={styles.goalProgressBar} />
                </View>
              </View>
              
              <Button 
                mode="outlined" 
                style={[styles.addButton, { borderColor: paperTheme.colors.primary }]}
              >
                Add New Goal
              </Button>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <View style={styles.sectionContent}>
          <ThemePicker 
            selectedTheme={colorTheme}
            onThemeChange={setColorTheme}
          />
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Account Settings</Title>
              <List.Item
                title="Profile Information"
                left={props => <List.Icon {...props} icon="account" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="Notification Preferences"
                left={props => <List.Icon {...props} icon="bell" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="Privacy & Security"
                left={props => <List.Icon {...props} icon="shield" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
              <Divider />
              <List.Item
                title="Language"
                description="English (US)"
                left={props => <List.Icon {...props} icon="translate" color={paperTheme.colors.primary} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
              />
            </Card.Content>
          </Card>
          
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
                title="Log Out"
                titleStyle={{ color: paperTheme.colors.error }}
                left={props => <List.Icon {...props} icon="logout" color={paperTheme.colors.error} />}
              />
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Dashboard Section */}
      {activeSection === 'dashboard' && (
        <View style={styles.sectionContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Weekly Activity</Title>
              <View style={styles.chartContainer}>
                {/* Simple bar chart representing weekly activity */}
                <View style={styles.barChart}>
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                    <View key={i} style={styles.barColumn}>
                      <View 
                        style={[
                          styles.bar, 
                          { 
                            height: `${[40, 65, 35, 80, 55, 20, 30][i]}%`,
                            backgroundColor: paperTheme.colors.primary 
                          }
                        ]} 
                      />
                      <Text style={styles.barLabel}>{day}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.chartLabel}>
                  <Text style={[styles.chartValue, { color: paperTheme.colors.primary }]}>Weekly XP: 230</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Quest Completion</Title>
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>12</Text>
                  <Text style={styles.statLabel}>Total Quests</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>7</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>3</Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Conversation Analytics</Title>
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>28</Text>
                  <Text style={styles.statLabel}>Conversations</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>145</Text>
                  <Text style={styles.statLabel}>Messages</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, { color: paperTheme.colors.primary }]}>8</Text>
                  <Text style={styles.statLabel}>Categories</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}

      {/* Achievements Section */}
      {activeSection === 'achievements' && (
        <View style={styles.sectionContent}>
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Recent Achievements</Title>
              <View style={styles.achievementsList}>
                <View style={styles.achievement}>
                  <View style={[styles.achievementIcon, { backgroundColor: '#e5e0ff' }]}>
                    <Text style={styles.achievementEmoji}>🏆</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Consistency Champion</Text>
                    <Text style={styles.achievementDescription}>
                      Completed daily tasks for 5 days in a row
                    </Text>
                  </View>
                  <Text style={[styles.achievementXP, { color: paperTheme.colors.primary }]}>+20 XP</Text>
                </View>
                
                <Divider style={styles.achievementDivider} />
                
                <View style={styles.achievement}>
                  <View style={[styles.achievementIcon, { backgroundColor: '#e0ffeb' }]}>
                    <Text style={styles.achievementEmoji}>📚</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Book Worm</Text>
                    <Text style={styles.achievementDescription}>
                      Read for 30 minutes for 3 days in a row
                    </Text>
                  </View>
                  <Text style={[styles.achievementXP, { color: paperTheme.colors.primary }]}>+15 XP</Text>
                </View>
                
                <Divider style={styles.achievementDivider} />
                
                <View style={styles.achievement}>
                  <View style={[styles.achievementIcon, { backgroundColor: '#ffebeb' }]}>
                    <Text style={styles.achievementEmoji}>💬</Text>
                  </View>
                  <View style={styles.achievementInfo}>
                    <Text style={styles.achievementTitle}>Conversation Master</Text>
                    <Text style={styles.achievementDescription}>
                      Had 10 meaningful conversations with Ada
                    </Text>
                  </View>
                  <Text style={[styles.achievementXP, { color: paperTheme.colors.primary }]}>+25 XP</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
          
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.sectionTitle}>Badges</Title>
              <View style={styles.badgesContainer}>
                <View style={styles.badge}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeEmoji}>🔥</Text>
                  </View>
                  <Text style={styles.badgeTitle}>7-Day Streak</Text>
                </View>
                
                <View style={styles.badge}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeEmoji}>🌟</Text>
                  </View>
                  <Text style={styles.badgeTitle}>Power User</Text>
                </View>
                
                <View style={styles.badge}>
                  <View style={styles.badgeIcon}>
                    <Text style={styles.badgeEmoji}>🧠</Text>
                  </View>
                  <Text style={styles.badgeTitle}>Smart Thinker</Text>
                </View>
                
                <View style={styles.badge}>
                  <View style={[styles.badgeIcon, styles.lockedBadge]}>
                    <Text style={styles.badgeEmoji}>🚀</Text>
                  </View>
                  <Text style={styles.lockedBadgeTitle}>30-Day Streak</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
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
    marginBottom: 4,
  },
  userLevel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  xpContainer: {
    width: '100%',
    marginTop: 8,
  },
  xpProgress: {
    height: 8,
    borderRadius: 4,
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xpCurrent: {
    fontSize: 12,
    color: '#666',
  },
  xpNeeded: {
    fontSize: 12,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionChip: {
    marginRight: 8,
    backgroundColor: 'white',
  },
  activeChip: {
  },
  activeChipText: {
    color: 'white',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  bioText: {
    fontSize: 14,
    lineHeight: 20,
  },
  goalsList: {
    marginBottom: 16,
  },
  goal: {
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalText: {
    fontSize: 14,
  },
  goalProgress: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  addButton: {
    borderRadius: 8,
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
  chartContainer: {
    height: 180,
    marginTop: 8,
    marginBottom: 8,
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingHorizontal: 8,
  },
  barColumn: {
    width: '12%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bar: {
    width: '60%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    marginTop: 4,
    fontSize: 12,
    color: '#666',
  },
  chartLabel: {
    alignItems: 'center',
    paddingTop: 8,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statBox: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  achievementsList: {
    marginTop: 8,
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  achievementDivider: {
    backgroundColor: '#f0f0f0',
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  achievementEmoji: {
    fontSize: 20,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 12,
    color: '#666',
  },
  achievementXP: {
    fontSize: 12,
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  badge: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  badgeEmoji: {
    fontSize: 28,
  },
  badgeTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  lockedBadge: {
    backgroundColor: '#f5f5f5',
    opacity: 0.7,
  },
  lockedBadgeTitle: {
    fontSize: 14,
    color: '#999',
  },
});

export default ProfileScreen;