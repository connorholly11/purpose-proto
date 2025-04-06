import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions, TextInput } from 'react-native';
import { Card, Title, Paragraph, useTheme, Button, ProgressBar, Chip, Surface, Avatar, Badge, IconButton, Divider } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// First-time user instructions component
const FirstTimeUserGuide = ({ onDismiss }: { onDismiss: () => void }) => {
  const colors = {
    primary: '#D4AF37',
    text: '#000000',
    background: '#FFFFFF',
    goldLight: '#F5EFD9',
  };

  return (
    <Surface style={styles.welcomeGuideContainer}>
      <View style={styles.welcomeHeader}>
        <Title style={{color: colors.primary}}>Welcome to Your Life Dashboard!</Title>
        <IconButton
          icon="close"
          size={20}
          iconColor={colors.text}
          onPress={onDismiss}
        />
      </View>

      <Paragraph style={styles.welcomeText}>
        Your Life Dashboard helps you track and improve key areas of your life while working with your AI companion.
      </Paragraph>

      <View style={styles.welcomeItem}>
        <MaterialIcons name="expand-more" size={18} color={colors.primary} />
        <Text style={styles.welcomeItemText}>Tap section headers to expand or collapse</Text>
      </View>

      <View style={styles.welcomeItem}>
        <MaterialIcons name="touch-app" size={18} color={colors.primary} />
        <Text style={styles.welcomeItemText}>Tap on domains to see details and daily tasks</Text>
      </View>

      <View style={styles.welcomeItem}>
        <MaterialIcons name="smart-toy" size={18} color={colors.primary} />
        <Text style={styles.welcomeItemText}>Your AI companion provides personalized insights</Text>
      </View>

      <Button
        mode="contained"
        style={{backgroundColor: colors.primary, marginTop: 16}}
        onPress={onDismiss}
        labelStyle={{color: colors.background}}
      >
        Get Started
      </Button>
    </Surface>
  );
};

const PlaceholderDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    domains: true,
    aiInsights: false,
    tips: false,
    chat: false
  });
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [aiInput, setAiInput] = useState("");
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(true);
  const [activeDomainChat, setActiveDomainChat] = useState<number | null>(null);
  
  // Color scheme
  const colors = {
    primary: '#D4AF37', // Gold
    secondary: '#000000', // Black
    background: '#FFFFFF', // White
    backgroundAlt: '#F8F8F8', // Light gray
    text: '#000000', // Black
    textSecondary: '#555555', // Dark gray
    gold: '#D4AF37',
    goldLight: '#F5EFD9',
    goldDark: '#B8960B',
    header: '#111111',
  };
  
  // AI Companion messages simulation
  const [aiMessages, setAiMessages] = useState([
    "Based on your recent activity, your health habit streak is improving!",
    "You might want to focus on the Meaning domain this week.",
  ]);
  
  // Domain-specific AI advice
  const domainAdvice = [
    "I notice your health metrics are trending positively. A 10-minute morning stretch routine could help you reach the next level faster.",
    "Your relationship connections are growing. Consider scheduling a regular check-in with your closest friends to strengthen these bonds.",
    "For finding more meaning, try journaling about moments that felt significant to you this week.",
    "To develop purpose, consider how your strengths could be applied to causes you care about."
  ];
  
  // Sample AI insights
  const aiInsight = "I've noticed you've been consistent with health tasks but might be neglecting the meaning domain. A balance across domains leads to better overall wellbeing.";
  
  // Domain data with levels and progress
  const domains = [
    { 
      name: 'Health', 
      icon: 'favorite' as keyof typeof MaterialIcons.glyphMap, 
      level: 3, 
      progress: 0.65, 
      xp: 650, 
      nextLevel: 1000,
      achievement: 'Morning Workout Warrior',
      dailyTask: 'Take a 10-minute walk',
      streakDays: 5,
      aiSuggestion: "Try adding a 5-minute stretch to your morning routine."
    },
    { 
      name: 'Relationships', 
      icon: 'people' as keyof typeof MaterialIcons.glyphMap, 
      level: 4, 
      progress: 0.42, 
      xp: 420, 
      nextLevel: 1000,
      achievement: 'Active Listener',
      dailyTask: 'Send a message to a friend',
      streakDays: 3,
      aiSuggestion: "Consider asking deeper questions in your next conversation."
    },
    { 
      name: 'Meaning', 
      icon: 'psychology' as keyof typeof MaterialIcons.glyphMap, 
      level: 2, 
      progress: 0.28, 
      xp: 280, 
      nextLevel: 1000,
      achievement: 'Mindfulness Novice',
      dailyTask: 'Meditate for 5 minutes',
      streakDays: 1,
      aiSuggestion: "Reflection on what brought you joy today can increase your sense of meaning."
    },
    { 
      name: 'Purpose', 
      icon: 'lightbulb' as keyof typeof MaterialIcons.glyphMap, 
      level: 1, 
      progress: 0.15, 
      xp: 150, 
      nextLevel: 1000,
      achievement: 'Goal Setter',
      dailyTask: 'Write down one goal',
      streakDays: 2,
      aiSuggestion: "What small step could you take today toward a long-term goal?"
    }
  ];
  
  const tips = [
    "Small daily improvements lead to stunning results over time.",
    "The quality of your life is determined by the quality of your habits.",
    "Focus on progress, not perfection. Every step forward counts.",
    "Your future self is watching you right now through memories."
  ];
  
  const [currentTip, setCurrentTip] = useState(0);
  
  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
    
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ])
    ).start();

    // Check if it's the first time visiting
    // In a real app, you'd use AsyncStorage or another storage method to persist this
    // For demo purposes, we'll just show it on component mount
  }, []);

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -50],
    extrapolate: 'clamp',
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const renderBadge = (domain: any) => {
    if (domain.level >= 3) {
      return (
        <View style={{position: 'absolute', top: -5, right: -5, zIndex: 1}}>
          <Badge size={22} style={{backgroundColor: colors.gold}}>
            ★
          </Badge>
        </View>
      );
    }
    return null;
  };
  
  // Simulate sending a message to AI
  const handleAiSend = () => {
    if (aiInput.trim() === "") return;
    
    // Simulate AI response
    setTimeout(() => {
      setAiMessages(prev => [...prev, "I'll help you work on that! Let's break that down into smaller steps."]);
      toggleSection('chat');
    }, 500);
    
    setAiInput("");
  };
  
  // Handle domain-specific AI chat
  const handleDomainAiChat = (index: number) => {
    setActiveDomainChat(activeDomainChat === index ? null : index);
  };
  
  return (
    <Animated.ScrollView 
      style={[styles.container, {backgroundColor: colors.background}]}
      contentContainerStyle={styles.contentContainer}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{nativeEvent: {contentOffset: {y: scrollY}}}],
        {useNativeDriver: true}
      )}
    >
      {/* First-time welcome guide */}
      {showWelcomeGuide && (
        <FirstTimeUserGuide onDismiss={() => setShowWelcomeGuide(false)} />
      )}
      
      {/* Floating header */}
      <Animated.View 
        style={[
          styles.floatingHeader, 
          {
            backgroundColor: colors.header,
            transform: [{translateY: headerTranslateY}],
            opacity: headerOpacity
          }
        ]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.floatingTitle, {color: colors.gold}]}>Life Dashboard</Text>
        </View>
      </Animated.View>
      
      {/* Main Header */}
      <Animated.View 
        style={[
          styles.header, 
          {
            backgroundColor: colors.header,
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}]
          }
        ]}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Image 
            size={70} 
            source={{uri: 'https://ui-avatars.com/api/?name=Life+OS&background=111111&color=D4AF37'}} 
            style={styles.avatar}
          />
          <View style={styles.headerTextContainer}>
            <Title style={[styles.mainTitle, {color: colors.gold}]}>Life Dashboard</Title>
            <Text style={[styles.subtitle, {color: '#AAAAAA'}]}>Level up your life</Text>
          </View>
          <TouchableOpacity 
            style={[styles.aiButton, {backgroundColor: 'rgba(212,175,55,0.2)'}]}
            onPress={() => toggleSection('chat')}
          >
            <MaterialIcons name="smart-toy" size={22} color={colors.gold} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.gold}]}>10</Text>
            <Text style={[styles.statLabel, {color: '#AAAAAA'}]}>Total Level</Text>
          </View>
          <Divider style={{height: 30, width: 1, backgroundColor: 'rgba(170,170,170,0.3)'}} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.gold}]}>7</Text>
            <Text style={[styles.statLabel, {color: '#AAAAAA'}]}>Day Streak</Text>
          </View>
          <Divider style={{height: 30, width: 1, backgroundColor: 'rgba(170,170,170,0.3)'}} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: colors.gold}]}>3</Text>
            <Text style={[styles.statLabel, {color: '#AAAAAA'}]}>Achievements</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* AI Quick Chat */}
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{scale: scaleAnim}]
        }}
      >
        {expandedSections.chat && (
          <Surface style={[styles.sectionCard, {backgroundColor: colors.background}]}>
            <View style={styles.aiChatHeader}>
              <View style={styles.aiAvatarContainer}>
                <Avatar.Icon 
                  size={36} 
                  icon="robot" 
                  style={{backgroundColor: colors.gold}} 
                  color={colors.header}
                />
                <Text style={[styles.aiTitle, {color: colors.text}]}>AI Companion</Text>
              </View>
              <IconButton 
                icon="close" 
                size={20} 
                onPress={() => toggleSection('chat')}
                iconColor={colors.textSecondary}
              />
            </View>
            
            <View style={[styles.aiMessageContainer, {backgroundColor: colors.goldLight}]}>
              <Paragraph style={[styles.aiMessage, {color: colors.text}]}>
                How can I help you with your personal growth today?
              </Paragraph>
            </View>
            
            <View style={[styles.aiInputContainer, {borderColor: '#E0E0E0'}]}>
              <TextInput
                style={[styles.aiInput, {color: colors.text}]}
                placeholder="Ask me anything about your life domains..."
                placeholderTextColor="#AAAAAA"
                value={aiInput}
                onChangeText={setAiInput}
                multiline
              />
              <IconButton
                icon="send"
                size={22}
                iconColor={colors.gold}
                onPress={handleAiSend}
                style={styles.sendButton}
              />
            </View>
          </Surface>
        )}
      
        {/* Collapsible section: Domains */}
        <Surface style={[styles.sectionCard, {backgroundColor: colors.background}]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('domains')}
          >
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="category" size={20} color={colors.gold} />
              <Text style={[styles.sectionTitle, {color: colors.text}]}>Life Domains</Text>
            </View>
            <MaterialIcons 
              name={expandedSections.domains ? "expand-less" : "expand-more"} 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {expandedSections.domains && (
            <View style={styles.domainsContainer}>
              {domains.map((domain, index) => (
                <Card 
                  key={index} 
                  style={[
                    styles.domainCard, 
                    {
                      backgroundColor: colors.background,
                      borderColor: activeCard === index ? colors.gold : '#E0E0E0',
                      marginBottom: 12
                    }
                  ]}
                  onPress={() => setActiveCard(activeCard === index ? null : index)}
                >
                  {renderBadge(domain)}
                  <Card.Content style={styles.domainCardContent}>
                    <View style={styles.domainRow}>
                      <View style={[styles.iconContainer, {backgroundColor: colors.goldLight}]}>
                        <MaterialIcons name={domain.icon} size={20} color={colors.gold} />
                      </View>
                      <View style={styles.domainInfo}>
                        <Text style={[styles.domainName, {color: colors.text}]}>{domain.name}</Text>
                        <Text style={[styles.domainLevel, {color: colors.textSecondary}]}>Level {domain.level}</Text>
                      </View>
                      <View style={[styles.domainStreak, {backgroundColor: colors.goldLight}]}>
                        <MaterialIcons name="local-fire-department" size={12} color={colors.gold} />
                        <Text style={[styles.streakText, {color: colors.gold}]}>{domain.streakDays}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressContainer}>
                      <ProgressBar 
                        progress={domain.progress} 
                        color={colors.gold} 
                        style={[styles.progressBar, {backgroundColor: colors.goldLight}]} 
                      />
                      <Text style={[styles.progressText, {color: colors.text}]}>
                        {domain.xp}/{domain.nextLevel} XP
                      </Text>
                    </View>
                    
                    {activeCard === index && (
                      <Animated.View>
                        <Divider style={{backgroundColor: '#E0E0E0', marginVertical: 12}} />
                        
                        <View style={styles.achievementRow}>
                          <FontAwesome5 name="medal" size={14} color={colors.gold} />
                          <Text style={[styles.achievementText, {color: colors.text}]}>
                            {domain.achievement}
                          </Text>
                        </View>
                        
                        <View style={[styles.taskContainer, {backgroundColor: colors.goldLight}]}>
                          <Text style={[styles.taskLabel, {color: colors.text}]}>Today's Task:</Text>
                          <View style={styles.taskRow}>
                            <MaterialIcons name="check-circle-outline" size={16} color={colors.gold} />
                            <Text style={[styles.taskText, {color: colors.text}]}>{domain.dailyTask}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.aiSuggestionRow}>
                          <MaterialIcons name="lightbulb" size={14} color={colors.gold} />
                          <Text style={[styles.aiSuggestionText, {color: colors.textSecondary}]}>
                            {domain.aiSuggestion}
                          </Text>
                        </View>
                        
                        <Button
                          mode="contained"
                          style={[styles.actionButton, {backgroundColor: colors.gold}]}
                          labelStyle={{color: colors.header, fontSize: 14, fontWeight: 'bold'}}
                        >
                          Complete Task
                        </Button>
                      </Animated.View>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </View>
          )}
        </Surface>
        
        {/* Collapsible section: AI Insights */}
        <Surface style={[styles.sectionCard, {backgroundColor: colors.background}]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('aiInsights')}
          >
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="insights" size={20} color={colors.gold} />
              <Text style={[styles.sectionTitle, {color: colors.text}]}>AI Insights</Text>
            </View>
            <MaterialIcons 
              name={expandedSections.aiInsights ? "expand-less" : "expand-more"} 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {expandedSections.aiInsights && (
            <View style={styles.aiInsightsContainer}>
              {aiMessages.map((message, index) => (
                <View key={index} style={[styles.insightItem, {backgroundColor: colors.goldLight}]}>
                  <MaterialIcons name="tips-and-updates" size={14} color={colors.gold} />
                  <Text style={[styles.insightText, {color: colors.text}]}>{message}</Text>
                </View>
              ))}
              
              <Button
                mode="outlined"
                icon="message-text"
                style={[styles.chatButton, {borderColor: colors.gold}]}
                labelStyle={{color: colors.gold}}
                onPress={() => toggleSection('chat')}
              >
                Chat with AI
              </Button>
            </View>
          )}
        </Surface>
        
        {/* Collapsible section: Daily Tip */}
        <Surface style={[styles.sectionCard, {backgroundColor: colors.background}]}>
          <TouchableOpacity 
            style={styles.sectionHeader}
            onPress={() => toggleSection('tips')}
          >
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="lightbulb" size={20} color={colors.gold} />
              <Text style={[styles.sectionTitle, {color: colors.text}]}>Daily Wisdom</Text>
            </View>
            <MaterialIcons 
              name={expandedSections.tips ? "expand-less" : "expand-more"} 
              size={24} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
          
          {expandedSections.tips && (
            <TouchableOpacity onPress={nextTip} activeOpacity={0.7}>
              <View style={[styles.tipContainer, {backgroundColor: colors.goldLight}]}>
                <Text style={[styles.tipText, {color: colors.text}]}>
                  "{tips[currentTip]}"
                </Text>
                <Text style={[styles.tapHint, {color: colors.textSecondary}]}>
                  Tap for more wisdom
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </Surface>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, {color: colors.textSecondary}]}>
            Life OS Dashboard • Version 1.0
          </Text>
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 24,
    paddingTop: 60,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    height: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  floatingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  header: {
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    paddingTop: 16,
    paddingBottom: 20,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatar: {
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.5)',
  },
  headerTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
  },
  aiButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
  },
  sectionCard: {
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  domainsContainer: {
    padding: 8,
  },
  domainCard: {
    borderRadius: 12,
    borderWidth: 1,
    elevation: 0,
  },
  domainCardContent: {
    padding: 12,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainInfo: {
    flex: 1,
    marginLeft: 12,
  },
  domainName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  domainLevel: {
    fontSize: 13,
  },
  domainStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    marginLeft: 8,
    width: 70,
    textAlign: 'right',
  },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 14,
    marginLeft: 8,
    fontStyle: 'italic',
  },
  taskContainer: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  taskLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    marginLeft: 8,
    fontSize: 14,
  },
  aiSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  aiSuggestionText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  actionButton: {
    borderRadius: 8,
  },
  aiInsightsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  chatButton: {
    marginTop: 8,
  },
  tipContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  tipText: {
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
  },
  aiChatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  aiAvatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiMessageContainer: {
    borderRadius: 12,
    padding: 12,
    margin: 16,
  },
  aiMessage: {
    fontSize: 14,
  },
  aiInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    margin: 16,
    marginTop: 0,
  },
  aiInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  sendButton: {
    margin: 0,
  },
  welcomeGuideContainer: {
    margin: 16,
    marginTop: 70,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    zIndex: 900,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  welcomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  welcomeItemText: {
    marginLeft: 8,
    fontSize: 14,
  },
});

export default PlaceholderDashboardScreen; 