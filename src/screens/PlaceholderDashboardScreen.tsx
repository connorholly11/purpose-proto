import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Title, Paragraph, useTheme, Button, ProgressBar, Chip, Surface, Avatar, Badge } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PlaceholderDashboardScreen: React.FC = () => {
  const theme = useTheme();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
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
  
  // Domain data with fun levels and progress
  const domains = [
    { 
      name: 'Health', 
      icon: 'favorite' as keyof typeof MaterialIcons.glyphMap, 
      color: '#FF5252', 
      gradientColors: ['#FF5252', '#FF867f'],
      level: 3, 
      progress: 0.65, 
      xp: 650, 
      nextLevel: 1000,
      achievement: 'Morning Workout Warrior',
      dailyTask: 'Take a 10-minute walk',
      streakDays: 5
    },
    { 
      name: 'Relationships', 
      icon: 'people' as keyof typeof MaterialIcons.glyphMap, 
      color: '#448AFF', 
      gradientColors: ['#448AFF', '#81D4FA'],
      level: 4, 
      progress: 0.42, 
      xp: 420, 
      nextLevel: 1000,
      achievement: 'Active Listener',
      dailyTask: 'Send a message to a friend',
      streakDays: 3
    },
    { 
      name: 'Meaning', 
      icon: 'psychology' as keyof typeof MaterialIcons.glyphMap, 
      color: '#9C27B0', 
      gradientColors: ['#9C27B0', '#CE93D8'],
      level: 2, 
      progress: 0.28, 
      xp: 280, 
      nextLevel: 1000,
      achievement: 'Mindfulness Novice',
      dailyTask: 'Meditate for 5 minutes',
      streakDays: 1
    },
    { 
      name: 'Purpose', 
      icon: 'lightbulb' as keyof typeof MaterialIcons.glyphMap, 
      color: '#FFB300', 
      gradientColors: ['#FFB300', '#FFE082'],
      level: 1, 
      progress: 0.15, 
      xp: 150, 
      nextLevel: 1000,
      achievement: 'Goal Setter',
      dailyTask: 'Write down one goal',
      streakDays: 2
    }
  ];
  
  const tips = [
    "Small daily improvements lead to stunning results over time. What tiny action could you take today?",
    "The quality of your life is determined by the quality of your habits.",
    "Focus on progress, not perfection. Every step forward counts.",
    "Your future self is watching you right now through memories."
  ];
  
  const [currentTip, setCurrentTip] = useState(0);
  
  const nextTip = () => {
    setCurrentTip((prev) => (prev + 1) % tips.length);
  };
  
  const renderBadge = (domain: any) => {
    if (domain.level >= 3) {
      return (
        <View style={{position: 'absolute', top: -5, right: -5, zIndex: 1}}>
          <Badge size={22} style={{backgroundColor: domain.color}}>
            ★
          </Badge>
        </View>
      );
    }
    return null;
  };
  
  return (
    <Animated.ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      scrollEventThrottle={16}
      onScroll={Animated.event(
        [{nativeEvent: {contentOffset: {y: scrollY}}}],
        {useNativeDriver: true}
      )}
    >
      {/* Floating header */}
      <Animated.View 
        style={[
          styles.floatingHeader, 
          {
            transform: [{translateY: headerTranslateY}],
            opacity: headerOpacity
          }
        ]}
      >
        <View style={[styles.headerGradient, {backgroundColor: '#2196F3'}]}>
          <View style={styles.headerContent}>
            <MaterialIcons name="dashboard" size={28} color="white" />
            <Text style={styles.floatingTitle}>Life Dashboard</Text>
          </View>
        </View>
      </Animated.View>
      
      {/* Main Header with Avatar */}
      <Animated.View 
        style={[
          styles.header, 
          {
            opacity: fadeAnim,
            transform: [{scale: scaleAnim}]
          }
        ]}
      >
        <View style={[styles.headerGradient, {backgroundColor: '#1E88E5'}]}>
          <View style={styles.avatarContainer}>
            <Avatar.Image 
              size={80} 
              source={{uri: 'https://ui-avatars.com/api/?name=Life+OS&background=0D8ABC&color=fff'}} 
              style={styles.avatar}
            />
            <View style={styles.headerTextContainer}>
              <Title style={styles.mainTitle}>Life Dashboard</Title>
              <Text style={styles.subtitle}>Your personal growth tracker</Text>
            </View>
          </View>
          
          <View style={styles.statsContainer}>
            <TouchableOpacity style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="local-fire-department" size={22} color="#FF9800" />
              </View>
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <MaterialIcons name="trending-up" size={22} color="#4CAF50" />
              </View>
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Total Level</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <FontAwesome5 name="medal" size={18} color="#FFC107" />
              </View>
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
      
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{scale: scaleAnim}]
        }}
      >
        <Surface style={styles.welcomeCard}>
          <Paragraph style={styles.paragraph}>
            🎮 Welcome to your Life OS Dashboard! Track your progress across key life domains and level up as you go. Your AI companion will help you along the way!
          </Paragraph>
        </Surface>
      
        <View style={styles.sectionHeader}>
          <MaterialIcons name="category" size={22} color="#555" />
          <Text style={styles.sectionTitle}>Life Domains</Text>
        </View>
        
        <View style={styles.cardsContainer}>
          {domains.map((domain, index) => (
            <Animated.View 
              key={index} 
              style={{
                opacity: fadeAnim,
                transform: [{
                  scale: activeCard === index ? 1.02 : 1
                }],
                marginBottom: 16
              }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => setActiveCard(activeCard === index ? null : index)}
              >
                <Card style={[styles.card]}>
                  {renderBadge(domain)}
                  <View style={[styles.cardHeader, {backgroundColor: domain.color}]}>
                    <MaterialIcons name={domain.icon} size={22} color="white" />
                    <Text style={styles.cardHeaderTitle}>{domain.name}</Text>
                    <View style={styles.levelContainer}>
                      <Text style={styles.levelBadge}>Lvl {domain.level}</Text>
                    </View>
                  </View>
                  
                  <Card.Content style={styles.cardContent}>
                    <View style={styles.xpContainer}>
                      <Text style={styles.xpText}>{domain.xp}/{domain.nextLevel} XP</Text>
                      <View style={styles.streakBadge}>
                        <MaterialIcons name="local-fire-department" size={14} color="#FF9800" />
                        <Text style={styles.streakText}>{domain.streakDays}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.progressContainer}>
                      <ProgressBar progress={domain.progress} color={domain.color} style={styles.progressBar} />
                      <Text style={[styles.progressText, {color: domain.color}]}>
                        {Math.floor(domain.progress * 100)}%
                      </Text>
                    </View>
                    
                    <View style={styles.achievementContainer}>
                      <FontAwesome5 name="medal" size={16} color={domain.color} />
                      <Text style={styles.achievementText}>{domain.achievement}</Text>
                    </View>
                    
                    {activeCard === index && (
                      <Animated.View 
                        style={{
                          opacity: fadeAnim,
                          marginTop: 12
                        }}
                      >
                        <View style={styles.dailyTaskContainer}>
                          <Text style={styles.dailyTaskLabel}>Today's Task:</Text>
                          <View style={styles.taskRow}>
                            <MaterialIcons name="check-circle-outline" size={18} color="#4CAF50" />
                            <Text style={styles.dailyTaskText}>{domain.dailyTask}</Text>
                          </View>
                        </View>
                      </Animated.View>
                    )}
                    
                    <Button 
                      mode="contained" 
                      style={[styles.actionButton, {backgroundColor: domain.color}]} 
                      labelStyle={{color: 'white', fontSize: 14}}
                      onPress={() => {}}
                    >
                      {index < 2 ? 'Take Action' : 'Unlock Soon'}
                    </Button>
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
        
        <View style={styles.sectionHeader}>
          <MaterialIcons name="lightbulb" size={22} color="#555" />
          <Text style={styles.sectionTitle}>Daily Inspiration</Text>
        </View>
        
        <TouchableOpacity onPress={nextTip} activeOpacity={0.8}>
          <Card style={styles.tipCard}>
            <View style={[styles.tipGradient, {backgroundColor: '#FFF9C4'}]}>
              <Card.Content>
                <View style={styles.tipHeader}>
                  <MaterialIcons name="lightbulb" size={24} color="#FFB300" />
                  <Title style={styles.tipTitle}>Today's Tip</Title>
                </View>
                <Paragraph style={styles.tipText}>
                  "{tips[currentTip]}"
                </Paragraph>
                <Text style={styles.tapHint}>Tap for more wisdom</Text>
              </Card.Content>
            </View>
          </Card>
        </TouchableOpacity>
        
        <Surface style={[styles.footerCard]}>
          <Paragraph style={styles.footerText}>
            🤖 Your AI companion is learning from your dashboard progress to provide personalized guidance. Keep leveling up to unlock new insights and abilities!
          </Paragraph>
        </Surface>
        
        <View style={styles.sectionHeader}>
          <MaterialIcons name="rocket" size={22} color="#555" />
          <Text style={styles.sectionTitle}>Coming Soon</Text>
        </View>
        
        <View style={styles.comingSoonContainer}>
          <Chip 
            icon="rocket" 
            style={styles.comingSoonChip}
            mode="outlined"
          >
            Daily Challenges
          </Chip>
          <Chip 
            icon="trophy" 
            style={styles.comingSoonChip}
            mode="outlined"
          >
            Leaderboards
          </Chip>
        </View>
      </Animated.View>
    </Animated.ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerGradient: {
    height: '100%',
    width: '100%',
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
    color: 'white',
    marginLeft: 8,
  },
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  headerTextContainer: {
    marginLeft: 16,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingTop: 0,
  },
  statCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    minWidth: width / 4,
  },
  statIconContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  welcomeCard: {
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#424242',
  },
  cardsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  cardHeaderTitle: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
    flex: 1,
  },
  levelContainer: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  levelBadge: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    paddingTop: 12,
  },
  xpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  xpText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '500',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  streakText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  achievementText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  dailyTaskContainer: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: 8,
    padding: 10,
  },
  dailyTaskLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    color: '#616161',
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyTaskText: {
    marginLeft: 8,
    fontSize: 14,
  },
  actionButton: {
    marginTop: 12,
    borderRadius: 8,
    elevation: 0,
  },
  tipCard: {
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  tipGradient: {
    borderRadius: 12,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipTitle: {
    marginLeft: 8,
    fontSize: 18,
    color: '#5D4037',
  },
  tipText: {
    fontStyle: 'italic',
    lineHeight: 22,
    color: '#5D4037',
  },
  tapHint: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 8,
    color: '#5D4037',
    opacity: 0.7,
  },
  footerCard: {
    margin: 16,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
    elevation: 2,
  },
  footerText: {
    padding: 16,
  },
  comingSoonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  comingSoonChip: {
    backgroundColor: 'transparent',
    borderColor: '#9E9E9E',
  },
});

export default PlaceholderDashboardScreen; 