import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Dimensions, TouchableOpacity, Platform, StyleSheet, Animated } from 'react-native';
import { LineChart, ProgressChart, PieChart, ContributionGraph } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { ActivityIndicator, Badge, Card, Divider, IconButton } from 'react-native-paper';
import Reanimated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface GameLevelIndicatorProps {
  level: number;
  maxLevel: number;
}

const GameLevelIndicator = ({ level, maxLevel }: GameLevelIndicatorProps) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {[...Array(maxLevel)].map((_, i) => (
        <View 
          key={i} 
          style={{ 
            width: 8, 
            height: 16, 
            borderRadius: 2,
            backgroundColor: i < level ? '#60a5fa' : '#374151' 
          }}
        />
      ))}
    </View>
  );
};

interface LockedOverlayProps {
  message?: string;
  level?: number;
  unlocksAt?: number;
}

const LockedOverlay = ({ message = "Locked", level = 0, unlocksAt = 5 }: LockedOverlayProps) => {
  return (
    <View style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.8)', 
      alignItems: 'center', 
      justifyContent: 'center',
      borderRadius: 12,
      zIndex: 20
    }}>
      <Text style={{ fontSize: 24, marginBottom: 8 }}>🔒</Text>
      <Text style={{ color: '#d1d5db', fontWeight: '500', marginBottom: 4 }}>{message}</Text>
      <Text style={{ fontSize: 12, color: '#6b7280' }}>Unlocks at level {unlocksAt}</Text>
      <View style={{ 
        marginTop: 12, 
        width: 128, 
        height: 6, 
        backgroundColor: '#1f2937',
        borderRadius: 999,
        overflow: 'hidden'
      }}>
        <View 
          style={{ 
            height: '100%', 
            width: `${Math.min(100, (level/unlocksAt) * 100)}%`, 
            backgroundColor: '#3b82f6',
            borderRadius: 999
          }}
        />
      </View>
    </View>
  );
};

interface GameBadgeProps {
  icon: string;
  label: string;
  isUnlocked: boolean;
}

const GameBadge = ({ icon, label, isUnlocked }: GameBadgeProps) => {
  return (
    <View style={{ 
      position: 'relative', 
      borderRadius: 8, 
      overflow: 'hidden',
      backgroundColor: isUnlocked ? '#1f2937' : '#111827'
    }}>
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ fontSize: 24, marginBottom: 4 }}>{icon}</Text>
        <Text style={{ fontSize: 12, textAlign: 'center', color: '#9ca3af' }}>{label}</Text>
      </View>
      {!isUnlocked && (
        <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Text style={{ fontSize: 20 }}>🔒</Text>
        </View>
      )}
    </View>
  );
};

interface DomainStat {
  [key: string]: number;
}

interface WeeklyDataPoint {
  day: string;
  value: number;
}

interface Domain {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  isUnlocked: boolean;
  unlocksAt?: number;
  color: string;
  stats: DomainStat;
  weeklyData: WeeklyDataPoint[];
}

interface Badge {
  id: number;
  icon: string;
  label: string;
  isUnlocked: boolean;
}

interface Feature {
  id: string;
  name: string;
  unlocksAt: number;
  isUnlocked: boolean;
  icon?: string;
  description?: string;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
  xp: number;
  category: string;
  dueDate?: Date;
}

interface Insight {
  id: string;
  text: string;
  source: string;
  timestamp: Date;
  domainId: string;
}

interface Habit {
  id: string;
  name: string;
  streak: number;
  lastCompleted: Date;
  frequency: 'daily' | 'weekly';
  domainId: string;
  icon: string;
}

interface AIMessage {
  id: string;
  text: string;
  sender: 'ai' | 'user';
  timestamp: Date;
}

interface MoodEntry {
  date: string;
  mood: number; // 1-5 scale
  notes?: string;
}

// Tab navigation
type Tab = 'dashboard' | 'metrics' | 'insights' | 'habits' | 'ai';

// Reanimated components
const AnimatedCard = Reanimated.createAnimatedComponent(Card);
const AnimatedLinearGradient = Reanimated.createAnimatedComponent(LinearGradient);

// Pulse animation component for AI features
const PulseIndicator = () => {
  const scale = useSharedValue(1);
  
  useEffect(() => {
    const pulse = () => {
      scale.value = withTiming(1.2, { duration: 1000 });
      setTimeout(() => {
        scale.value = withTiming(1, { duration: 1000 });
      }, 1000);
      
      setTimeout(pulse, 2000);
    };
    
    pulse();
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  return (
    <Reanimated.View
      style={[
        {
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#60a5fa',
          marginRight: 8,
        },
        animatedStyle,
      ]}
    />
  );
};

// Diamond-shaped skill indicator
const DiamondIndicator = ({ value, color, size = 60, label }: { value: number; color: string; size?: number; label: string }) => {
  return (
    <View style={{ alignItems: 'center', marginHorizontal: 4 }}>
      <View 
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: 4,
          transform: [{ rotate: '45deg' }],
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Text style={{ 
          color: '#fff',
          fontWeight: 'bold',
          fontSize: size / 2.5,
          transform: [{ rotate: '-45deg' }] 
        }}>
          {value}
        </Text>
      </View>
      <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 8 }}>{label}</Text>
    </View>
  );
};

// Card with holographic effect
const HolographicCard = ({ children, style }: { children: React.ReactNode; style?: any }) => {
  return (
    <View 
      style={[{ 
        borderRadius: 12, 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
      }, style]}
    >
      <LinearGradient
        colors={['rgba(96, 165, 250, 0.05)', 'rgba(155, 81, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const PlaceholderDashboardScreen = () => {
  // User's current level and experience
  const [userLevel, setUserLevel] = useState(3);
  const [userXP, setUserXP] = useState(1250);
  const maxXP = 2000;
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // AI companion integration
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      id: '1',
      text: 'Good morning! I notice your sleep quality has been declining this week. Would you like some suggestions to improve it?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      id: '2',
      text: 'Yes, please. I\'ve been struggling to fall asleep lately.',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 55),
    },
    {
      id: '3',
      text: 'Based on your patterns, I recommend: 1) Limiting screen time 1 hour before bed, 2) Consistent sleep schedule, 3) 5-minute meditation before sleeping. Would you like to set up reminders?',
      sender: 'ai',
      timestamp: new Date(Date.now() - 1000 * 60 * 50),
    },
  ]);
  
  // Mood tracking
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([
    { date: '2025-04-01', mood: 3 },
    { date: '2025-04-02', mood: 4 },
    { date: '2025-04-03', mood: 3 },
    { date: '2025-04-04', mood: 5 },
    { date: '2025-04-05', mood: 4 },
    { date: '2025-04-06', mood: 4 },
    { date: '2025-04-07', mood: 2 },
  ]);
  
  // Habits tracking
  const [habits, setHabits] = useState<Habit[]>([
    { 
      id: 'h1', 
      name: 'Morning Meditation', 
      streak: 5, 
      lastCompleted: new Date(Date.now() - 1000 * 60 * 60 * 24), 
      frequency: 'daily',
      domainId: 'health',
      icon: '🧘'
    },
    { 
      id: 'h2', 
      name: 'Reading', 
      streak: 3, 
      lastCompleted: new Date(), 
      frequency: 'daily',
      domainId: 'meaning',
      icon: '📚' 
    },
    { 
      id: 'h3', 
      name: 'Connect with a friend', 
      streak: 2, 
      lastCompleted: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), 
      frequency: 'weekly',
      domainId: 'relationships',
      icon: '👋' 
    },
    { 
      id: 'h4', 
      name: 'Exercise', 
      streak: 1, 
      lastCompleted: new Date(), 
      frequency: 'daily',
      domainId: 'health',
      icon: '🏃' 
    },
  ]);
  
  // Task list
  const [tasks, setTasks] = useState<Task[]>([
    { id: 't1', title: 'Complete health assessment', completed: true, xp: 50, category: 'health' },
    { id: 't2', title: 'Set 3 meaningful goals', completed: false, xp: 100, category: 'purpose' },
    { id: 't3', title: 'Call a family member', completed: false, xp: 75, category: 'relationships' },
    { id: 't4', title: 'Try a new meditation technique', completed: false, xp: 50, category: 'health' },
  ]);
  
  // AI generated insights
  const [insights, setInsights] = useState<Insight[]>([
    {
      id: 'i1',
      text: 'Your mood tends to improve after social interactions. Consider scheduling more social activities.',
      source: 'Mood + Relationship Analysis',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      domainId: 'relationships'
    },
    {
      id: 'i2',
      text: 'You sleep better on days when you exercise in the morning rather than evening.',
      source: 'Health Pattern Recognition',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
      domainId: 'health'
    },
    {
      id: 'i3',
      text: 'Reading before bed is helping your sleep quality improve by 23%.',
      source: 'Habit Correlation',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
      domainId: 'health'
    },
  ]);
  
  // Available domains at this level
  const domains: Domain[] = [
    {
      id: 'health',
      name: 'Health',
      level: 5,
      maxLevel: 10,
      isUnlocked: true,
      color: '#00CFDD',
      stats: {
        physical: 65,
        mental: 58,
        sleep: 70,
        nutrition: 62
      },
      weeklyData: [
        { day: 'M', value: 60 },
        { day: 'T', value: 62 },
        { day: 'W', value: 65 },
        { day: 'T', value: 63 },
        { day: 'F', value: 67 },
        { day: 'S', value: 70 },
        { day: 'S', value: 65 }
      ]
    },
    {
      id: 'relationships',
      name: 'Relations',
      level: 3,
      maxLevel: 10,
      isUnlocked: true,
      color: '#FF36AB',
      stats: {
        family: 75,
        friends: 55,
        social: 40,
        intimacy: 62
      },
      weeklyData: [
        { day: 'M', value: 40 },
        { day: 'T', value: 42 },
        { day: 'W', value: 45 },
        { day: 'T', value: 50 },
        { day: 'F', value: 48 },
        { day: 'S', value: 52 },
        { day: 'S', value: 50 }
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      level: 2,
      maxLevel: 10,
      isUnlocked: true,
      color: '#4285F4',
      stats: {
        skills: 45,
        learning: 68,
        challenges: 50,
        knowledge: 60
      },
      weeklyData: [
        { day: 'M', value: 55 },
        { day: 'T', value: 57 },
        { day: 'W', value: 52 },
        { day: 'T', value: 59 },
        { day: 'F', value: 60 },
        { day: 'S', value: 65 },
        { day: 'S', value: 60 }
      ]
    },
    {
      id: 'meaning',
      name: 'Meaning',
      level: 0,
      maxLevel: 10,
      isUnlocked: false,
      unlocksAt: 5,
      color: '#9B51FF',
      stats: {
        purpose: 0,
        values: 0,
        growth: 0,
        spirituality: 0
      },
      weeklyData: []
    },
    {
      id: 'career',
      name: 'Career',
      level: 0,
      maxLevel: 10,
      isUnlocked: false,
      unlocksAt: 4,
      color: '#F4B400',
      stats: {
        skills: 0,
        progress: 0,
        satisfaction: 0,
        impact: 0
      },
      weeklyData: []
    },
    {
      id: 'finance',
      name: 'Finance',
      level: 0,
      maxLevel: 10,
      isUnlocked: false,
      unlocksAt: 6,
      color: '#0F9D58',
      stats: {
        savings: 0,
        income: 0,
        investments: 0,
        planning: 0
      },
      weeklyData: []
    },
    {
      id: 'purpose',
      name: 'Purpose',
      level: 0,
      maxLevel: 10,
      isUnlocked: false,
      unlocksAt: 7,
      color: '#51CF66',
      stats: {
        vision: 0,
        impact: 0,
        legacy: 0,
        alignment: 0
      },
      weeklyData: []
    }
  ];
  
  // Achievements/badges
  const badges: Badge[] = [
    { id: 1, icon: '🏆', label: 'First Level Up', isUnlocked: true },
    { id: 2, icon: '🧠', label: 'Mind Master', isUnlocked: true },
    { id: 3, icon: '❤️', label: 'Heart Opener', isUnlocked: true },
    { id: 4, icon: '🌙', label: 'Sleep Guardian', isUnlocked: true },
    { id: 5, icon: '🏃', label: 'Fitness Journey', isUnlocked: false },
    { id: 6, icon: '🧘', label: 'Zen Master', isUnlocked: false },
    { id: 7, icon: '👥', label: 'Social Butterfly', isUnlocked: false },
    { id: 8, icon: '⭐', label: 'Purpose Finder', isUnlocked: false }
  ];
  
  // Unlockable features
  const features: Feature[] = [
    { 
      id: 'insights', 
      name: 'AI Insights', 
      unlocksAt: 2, 
      isUnlocked: true,
      icon: '✨',
      description: 'AI-powered pattern recognition across your life domains'
    },
    { 
      id: 'tracking', 
      name: 'Habit Tracking', 
      unlocksAt: 3, 
      isUnlocked: true,
      icon: '📊',
      description: 'Track daily habits and build consistent streaks'
    },
    { 
      id: 'challenges', 
      name: 'Daily Challenges', 
      unlocksAt: 4, 
      isUnlocked: false,
      icon: '🎯',
      description: 'Personalized daily challenges to level up your domains'
    },
    { 
      id: 'coach', 
      name: 'AI Life Coach', 
      unlocksAt: 6, 
      isUnlocked: false,
      icon: '🧠',
      description: 'Personal AI coach that helps you optimize your life'
    },
    { 
      id: 'journal', 
      name: 'AI Journal', 
      unlocksAt: 5, 
      isUnlocked: false,
      icon: '📓',
      description: 'AI-enhanced journaling with sentiment analysis'
    },
    { 
      id: 'community', 
      name: 'Community', 
      unlocksAt: 7, 
      isUnlocked: false,
      icon: '👥',
      description: 'Connect with others on similar life quests'
    },
    { 
      id: 'analysis', 
      name: 'Deep Analysis', 
      unlocksAt: 8, 
      isUnlocked: false,
      icon: '🔍',
      description: 'Advanced correlation analysis across all domains'
    },
    { 
      id: 'genome', 
      name: 'Life Genome', 
      unlocksAt: 9, 
      isUnlocked: false,
      icon: '🧬',
      description: 'Comprehensive mapping of your personal traits and patterns'
    },
    { 
      id: 'scenarios', 
      name: 'Scenario Planning', 
      unlocksAt: 10, 
      isUnlocked: false,
      icon: '🔮',
      description: 'AI-powered future scenario planning for your life goals'
    }
  ];
  
  // Active domain state
  const [activeDomain, setActiveDomain] = useState<Domain>(domains.find(d => d.isUnlocked) || domains[0]);
  
  // Animation state
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);
  
  // Calculate overall score
  const unlockedDomains = domains.filter(d => d.isUnlocked);
  const overallScore = Math.round(
    unlockedDomains.reduce((acc, domain) => acc + ((domain.level / domain.maxLevel) * 100), 0) / 
    unlockedDomains.length
  );
  
  // Line chart width
  const screenWidth = Dimensions.get('window').width - 32;
  
  // Chart configurations
  const chartConfig = {
    backgroundGradientFrom: '#1f2937',
    backgroundGradientTo: '#1f2937',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: activeDomain.color
    }
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboardTab();
      case 'metrics':
        return renderMetricsTab();
      case 'insights':
        return renderInsightsTab();
      case 'habits':
        return renderHabitsTab();
      case 'ai':
        return renderAITab();
      default:
        return renderDashboardTab();
    }
  };

  // Tab content components
  const renderDashboardTab = () => {
    return (
      <>
        {/* Main Grid Layout */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {/* Domain Selection Panel */}
          <View style={{ 
            flex: 3, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937',
            marginRight: 24
          }}>
            <Text style={{ 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: '#9ca3af', 
              marginBottom: 20 
            }}>
              Life Domains
            </Text>
            
            <View style={{ marginBottom: 16 }}>
              {domains.map(domain => (
                <TouchableOpacity
                  key={domain.id}
                  onPress={() => domain.isUnlocked && setActiveDomain(domain)}
                  disabled={!domain.isUnlocked}
                  style={{ 
                    width: '100%', 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    backgroundColor: activeDomain.id === domain.id ? '#1f2937' : '#111827',
                    borderWidth: activeDomain.id === domain.id ? 1 : 0,
                    borderColor: '#374151',
                    opacity: domain.isUnlocked ? 1 : 0.6
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 4, 
                      height: 40, 
                      borderRadius: 999, 
                      marginRight: 12, 
                      backgroundColor: domain.color 
                    }} />
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '500', color: '#f9fafb' }}>{domain.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {domain.isUnlocked 
                          ? `Level ${domain.level}` 
                          : `Unlocks at level ${domain.unlocksAt}`
                        }
                      </Text>
                    </View>
                  </View>
                  
                  <View>
                    {domain.isUnlocked ? (
                      <GameLevelIndicator level={domain.level} maxLevel={5} />
                    ) : (
                      <Text style={{ fontSize: 18 }}>🔒</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Unlockable Features Section */}
            <View style={{ 
              marginTop: 24, 
              paddingTop: 24, 
              borderTopWidth: 1, 
              borderTopColor: '#1f2937' 
            }}>
              <Text style={{ 
                fontSize: 12, 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                color: '#9ca3af', 
                marginBottom: 12 
              }}>
                Features
              </Text>
              
              <View>
                {features.filter((_, index) => index < 5).map(feature => (
                  <View key={feature.id} 
                    style={{
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      backgroundColor: feature.isUnlocked ? '#1f2937' : '#111827',
                      opacity: feature.isUnlocked ? 1 : 0.6
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {feature.isUnlocked ? (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34d399', marginRight: 8 }}></View>
                      ) : (
                        <Text style={{ fontSize: 14, marginRight: 8 }}>{feature.icon || '🔒'}</Text>
                      )}
                      <Text style={{ fontSize: 14, color: '#f9fafb' }}>{feature.name}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>
                      {feature.isUnlocked ? 'Active' : `Lvl ${feature.unlocksAt}`}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={{
                    alignItems: 'center',
                    paddingVertical: 8,
                    marginTop: 8,
                  }}
                  onPress={() => setActiveTab('metrics')}
                >
                  <Text style={{ fontSize: 12, color: '#60a5fa' }}>View all features</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Domain Details Panel */}
          <View style={{ 
            flex: 5, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937',
            marginRight: 24
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 12, 
                textTransform: 'uppercase', 
                letterSpacing: 1, 
                color: '#9ca3af' 
              }}>
                {activeDomain.name} Dashboard
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: 999, 
                  paddingHorizontal: 12, 
                  paddingVertical: 4 
                }}>
                  <Text style={{ fontSize: 12, color: '#f9fafb' }}>
                    Level {activeDomain.level}/{activeDomain.maxLevel}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Domain Stats Overview */}
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap', 
              marginBottom: 16 
            }}>
              {Object.entries(activeDomain.stats).map(([key, value]) => (
                <View 
                  key={key} 
                  style={{ 
                    backgroundColor: '#1f2937', 
                    borderRadius: 8, 
                    padding: 12,
                    width: '32%',
                    marginRight: '1%',
                    marginBottom: 8
                  }}
                >
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>{key.charAt(0).toUpperCase() + key.slice(1)}</Text>
                  <Text style={{ fontSize: 20, fontWeight: '600', color: '#f9fafb', marginVertical: 4 }}>{value}%</Text>
                  <View style={{ width: '100%', height: 4, backgroundColor: '#374151', borderRadius: 999, marginTop: 8 }}>
                    <View style={{ 
                      height: '100%', 
                      width: `${value}%`, 
                      backgroundColor: activeDomain.color,
                      borderRadius: 999 
                    }} />
                  </View>
                </View>
              ))}
            </View>
            
            {/* Triangular Radar Chart */}
            <View style={{ height: 260, marginTop: 16, marginBottom: 16 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', textAlign: 'center', marginBottom: 8 }}>
                Balance between your health dimensions
              </Text>
              <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative'
              }}>
                <Svg height={220} width={220}>
                  {/* Outer Triangle */}
                  <Polygon
                    points="110,10 210,180 10,180"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="1"
                  />
                  
                  {/* Inner Grid Lines */}
                  <Polygon
                    points="110,60 160,130 60,130"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                  
                  <Polygon
                    points="110,95 135,105 85,105"
                    fill="none"
                    stroke="#374151"
                    strokeWidth="0.5"
                  />
                  
                  {/* Data Triangle */}
                  {(() => {
                    const stats = Object.values(activeDomain.stats);
                    // Convert percentage to position on the triangle
                    const normalizeValue = (value: number) => {
                      return 1 - (value / 100);
                    };
                    
                    // Physical (top point)
                    const physicalY = 10 + normalizeValue(stats[0]) * (180 - 10);
                    // Mental (bottom right)
                    const mentalX = 110 + normalizeValue(stats[1]) * (210 - 110);
                    const mentalY = 180 - normalizeValue(stats[1]) * (180 - 130);
                    // Sleep (bottom left)
                    const sleepX = 110 - normalizeValue(stats[2]) * (110 - 10);
                    const sleepY = 180 - normalizeValue(stats[2]) * (180 - 130);
                    
                    const dataPoints = `${110},${physicalY} ${mentalX},${mentalY} ${sleepX},${sleepY}`;
                    
                    return (
                      <Polygon
                        points={dataPoints}
                        fill={`${activeDomain.color}80`}
                        stroke={activeDomain.color}
                        strokeWidth="2"
                      />
                    );
                  })()}
                  
                  {/* Labels */}
                  <SvgText
                    x="110"
                    y="5"
                    fontSize="12"
                    fill="#f9fafb"
                    textAnchor="middle"
                  >
                    Physical
                  </SvgText>
                  
                  <SvgText
                    x="215"
                    y="185"
                    fontSize="12"
                    fill="#f9fafb"
                    textAnchor="middle"
                  >
                    Mental
                  </SvgText>
                  
                  <SvgText
                    x="5"
                    y="185"
                    fontSize="12"
                    fill="#f9fafb"
                    textAnchor="middle"
                  >
                    Sleep
                  </SvgText>
                </Svg>
              </View>
            </View>
            
            {/* Next Level Information */}
            <View style={{ 
              marginTop: 16, 
              backgroundColor: '#1f2937', 
              borderRadius: 8, 
              padding: 12 
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: '#f9fafb' }}>Next Level</Text>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>+{(activeDomain.level + 1) * 200} XP</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginRight: 8 }}>Progress</Text>
                <View style={{ flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 999 }}>
                  <View style={{ 
                    height: '100%', 
                    width: '65%', 
                    backgroundColor: activeDomain.color,
                    borderRadius: 999 
                  }} />
                </View>
                <Text style={{ fontSize: 12, color: '#f9fafb', marginLeft: 8 }}>65%</Text>
              </View>
            </View>
          </View>

          {/* Weekly Progress & Challenges */}
          <View style={{ 
            flex: 4, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937' 
          }}>
            <Text style={{ 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: '#9ca3af', 
              marginBottom: 16 
            }}>
              Weekly Progress
            </Text>
            
            <View style={{ height: 192, alignItems: 'center' }}>
              <LineChart
                data={{
                  labels: activeDomain.weeklyData.map(item => item.day),
                  datasets: [{
                    data: activeDomain.weeklyData.map(item => item.value)
                  }]
                }}
                width={screenWidth * 0.3}
                height={180}
                chartConfig={{
                  backgroundColor: '#1f2937',
                  backgroundGradientFrom: '#1f2937',
                  backgroundGradientTo: '#1f2937',
                  decimalPlaces: 0,
                  color: (opacity = 1) => activeDomain.color,
                  labelColor: (opacity = 1) => `rgba(249, 250, 251, ${opacity})`,
                  style: {
                    borderRadius: 8
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: activeDomain.color
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 8
                }}
              />
            </View>
            
            {/* Daily Challenge Section (Locked) */}
            <View style={{ 
              marginTop: 24, 
              backgroundColor: '#1f2937', 
              borderRadius: 8, 
              padding: 16,
              position: 'relative'
            }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#f9fafb', marginBottom: 12 }}>Daily Challenges</Text>
              
              <LockedOverlay 
                message="Daily Challenges Locked" 
                level={userLevel} 
                unlocksAt={4} 
              />
              
              <View style={{ opacity: 0.5 }}>
                <View style={{ marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 10, 
                      backgroundColor: '#374151', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ fontSize: 12, color: '#f9fafb' }}>1</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#f9fafb' }}>Complete morning meditation</Text>
                    <Text style={{ fontSize: 12, color: '#60a5fa', marginLeft: 'auto' }}>+50 XP</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 10, 
                      backgroundColor: '#374151', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ fontSize: 12, color: '#f9fafb' }}>2</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#f9fafb' }}>Connect with a friend</Text>
                    <Text style={{ fontSize: 12, color: '#60a5fa', marginLeft: 'auto' }}>+75 XP</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: 10, 
                      backgroundColor: '#374151', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ fontSize: 12, color: '#f9fafb' }}>3</Text>
                    </View>
                    <Text style={{ fontSize: 14, color: '#f9fafb' }}>Track your nutrition</Text>
                    <Text style={{ fontSize: 12, color: '#60a5fa', marginLeft: 'auto' }}>+60 XP</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Bottom Section - Overall Progress */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {/* Overall Score */}
          <View style={{ 
            flex: 3, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937',
            marginRight: 24
          }}>
            <Text style={{ 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: '#9ca3af', 
              marginBottom: 12 
            }}>
              Overall Score
            </Text>
            
            <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 24 }}>
              <View style={{ width: 128, height: 128, position: 'relative' }}>
                <ProgressChart
                  data={{ data: [overallScore / 100] }}
                  width={128}
                  height={128}
                  strokeWidth={10}
                  radius={50}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'transparent',
                    backgroundGradientTo: 'transparent',
                    color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
                    labelColor: () => 'transparent',
                  }}
                  hideLegend={true}
                />
                <View style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#60a5fa' }}>{overallScore}</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Balance</Text>
                </View>
              </View>
            </View>
            
            <View style={{ marginTop: 32 }}>
              {domains.filter(d => d.isUnlocked).map(domain => (
                <View key={domain.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: domain.color,
                    marginRight: 8
                  }}></View>
                  <Text style={{ fontSize: 12, color: '#f9fafb' }}>{domain.name}</Text>
                  <Text style={{ fontSize: 12, color: '#f9fafb', marginLeft: 'auto' }}>
                    {Math.round((domain.level/domain.maxLevel)*100)}%
                  </Text>
                </View>
              ))}
              
              {domains.filter(d => !d.isUnlocked).map(domain => (
                <View key={domain.id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, opacity: 0.5 }}>
                  <Text style={{ fontSize: 12, marginRight: 8 }}>🔒</Text>
                  <Text style={{ fontSize: 12, color: '#f9fafb' }}>{domain.name}</Text>
                  <Text style={{ fontSize: 12, color: '#f9fafb', marginLeft: 'auto' }}>Lvl {domain.unlocksAt}</Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Achievements/Badges */}
          <View style={{ 
            flex: 6, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937',
            marginRight: 24
          }}>
            <Text style={{ 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: '#9ca3af', 
              marginBottom: 16 
            }}>
              Achievements
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              {badges.map(badge => (
                <View key={badge.id} style={{ width: '24%', marginBottom: 12 }}>
                  <GameBadge 
                    icon={badge.icon}
                    label={badge.label}
                    isUnlocked={badge.isUnlocked}
                  />
                </View>
              ))}
            </View>
            
            <View style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6b7280' }}>
                Unlock more badges by leveling up your domains
              </Text>
            </View>
          </View>
          
          {/* AI Coach Section (Locked) */}
          <View style={{ 
            flex: 3, 
            backgroundColor: '#111827', 
            borderRadius: 12, 
            padding: 16, 
            borderWidth: 1, 
            borderColor: '#1f2937',
            position: 'relative'
          }}>
            <Text style={{ 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              color: '#9ca3af', 
              marginBottom: 16 
            }}>
              AI Life Coach
            </Text>
            
            <LockedOverlay 
              message="AI Coach Feature Locked" 
              level={userLevel} 
              unlocksAt={6} 
            />
            
            <View style={{ opacity: 0.5 }}>
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: '#3b82f6', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>AI</Text>
                </View>
                <View style={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: 8, 
                  padding: 12,
                  flex: 1,
                  maxWidth: 200
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>
                    I've analyzed your progress and have some personalized recommendations for your health domain.
                  </Text>
                </View>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 }}>
                <View style={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: 8, 
                  padding: 12,
                  maxWidth: 200
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>
                    What areas should I focus on improving?
                  </Text>
                </View>
                <View style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  backgroundColor: '#374151', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginLeft: 12
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>You</Text>
                </View>
              </View>
              
              <View style={{ alignItems: 'center', marginTop: 24 }}>
                <View style={{ 
                  backgroundColor: '#1f2937', 
                  borderRadius: 999, 
                  paddingHorizontal: 16, 
                  paddingVertical: 8 
                }}>
                  <Text style={{ fontSize: 12, color: '#f9fafb', opacity: 0.5 }}>
                    Unlock at Level 6
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };
  
  // Render metrics tab
  const renderMetricsTab = () => {
    return (
      <View style={{ marginBottom: 24 }}>
        <HolographicCard style={{ marginBottom: 24 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: '#f9fafb', 
            marginBottom: 16 
          }}>Life Domains Performance</Text>
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            marginVertical: 24
          }}>
            {domains.filter(d => d.isUnlocked).map(domain => (
              <DiamondIndicator 
                key={domain.id}
                value={domain.level}
                color={domain.color}
                label={domain.name}
              />
            ))}
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 }}>
            {domains.filter(d => d.isUnlocked).map(domain => (
              <View key={domain.id} style={{ width: '50%', marginBottom: 16 }}>
                <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>{domain.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: 6, 
                    backgroundColor: domain.color,
                    marginRight: 8 
                  }} />
                  <View style={{ flex: 1, height: 6, backgroundColor: '#374151', borderRadius: 999 }}>
                    <View style={{ 
                      height: '100%', 
                      width: `${(domain.level/domain.maxLevel) * 100}%`, 
                      backgroundColor: domain.color,
                      borderRadius: 999 
                    }} />
                  </View>
                  <Text style={{ marginLeft: 8, fontSize: 12, color: '#9ca3af' }}>
                    {Math.round((domain.level/domain.maxLevel) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </HolographicCard>
        
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <HolographicCard style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#f9fafb', 
              marginBottom: 16 
            }}>Mood Tracking</Text>
            
            <View style={{ height: 200 }}>
              <LineChart
                data={{
                  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                  datasets: [{
                    data: moodEntries.map(entry => entry.mood)
                  }]
                }}
                width={Dimensions.get('window').width * 0.42}
                height={180}
                chartConfig={{
                  backgroundColor: 'transparent',
                  backgroundGradientFrom: 'transparent',
                  backgroundGradientTo: 'transparent',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(155, 81, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: '#9B51FF'
                  }
                }}
                bezier
                style={{
                  borderRadius: 16
                }}
              />
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Average</Text>
                <Text style={{ fontSize: 16, color: '#f9fafb' }}>
                  {(moodEntries.reduce((acc, entry) => acc + entry.mood, 0) / moodEntries.length).toFixed(1)}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Trend</Text>
                <Text style={{ fontSize: 16, color: '#34d399' }}>↗</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>Today</Text>
                <Text style={{ fontSize: 16, color: '#f9fafb' }}>
                  {moodEntries[moodEntries.length - 1].mood}/5
                </Text>
              </View>
            </View>
          </HolographicCard>
          
          <HolographicCard style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#f9fafb', 
              marginBottom: 16 
            }}>Habit Streaks</Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {habits.map(habit => (
                <View 
                  key={habit.id} 
                  style={{ 
                    width: '48%', 
                    backgroundColor: '#1f2937',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 24, marginRight: 8 }}>{habit.icon}</Text>
                    <Text style={{ fontSize: 14, color: '#f9fafb', flex: 1 }}>{habit.name}</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>Streak</Text>
                      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f9fafb' }}>{habit.streak}</Text>
                    </View>
                    
                    <View>
                      <Text style={{ fontSize: 12, color: '#9ca3af' }}>Freq</Text>
                      <Text style={{ fontSize: 12, color: '#60a5fa' }}>
                        {habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={{ 
                marginTop: 12, 
                alignItems: 'center', 
                backgroundColor: '#1f2937',
                paddingVertical: 8,
                borderRadius: 8
              }}
              onPress={() => setActiveTab('habits')}
            >
              <Text style={{ fontSize: 12, color: '#60a5fa' }}>Manage Habits</Text>
            </TouchableOpacity>
          </HolographicCard>
        </View>
        
        <HolographicCard>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600',
            color: '#f9fafb', 
            marginBottom: 16 
          }}>Feature Unlock Progress</Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
            {features.map(feature => (
              <View 
                key={feature.id}
                style={{ 
                  width: '33.33%', 
                  paddingHorizontal: 8, 
                  marginBottom: 16 
                }}
              >
                <View style={{ 
                  backgroundColor: feature.isUnlocked ? 'rgba(96, 165, 250, 0.1)' : '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  height: 100,
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: feature.isUnlocked ? '#60a5fa' : 'transparent',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 20 }}>{feature.icon}</Text>
                    {feature.isUnlocked ? (
                      <Badge style={{ backgroundColor: '#60a5fa' }}>{'ACTIVE'}</Badge>
                    ) : (
                      <Badge style={{ backgroundColor: '#374151' }}>{`Lvl ${feature.unlocksAt}`}</Badge>
                    )}
                  </View>
                  
                  <View>
                    <Text style={{ fontSize: 14, color: '#f9fafb', marginBottom: 4 }}>{feature.name}</Text>
                    <Text style={{ fontSize: 10, color: '#9ca3af' }}>{feature.description}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </HolographicCard>
      </View>
    );
  };
  
  // Render insights tab
  const renderInsightsTab = () => {
    return (
      <View style={{ marginBottom: 24 }}>
        <HolographicCard style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: '#f9fafb', 
              marginRight: 12 
            }}>AI Insights</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PulseIndicator />
              <Text style={{ fontSize: 12, color: '#60a5fa' }}>Live Analysis</Text>
            </View>
          </View>
          
          <View>
            {insights.map(insight => (
              <View
                key={insight.id}
                style={{
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: 4, 
                    backgroundColor: domains.find(d => d.id === insight.domainId)?.color || '#60a5fa',
                    marginRight: 8 
                  }} />
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>{insight.source}</Text>
                  <Text style={{ fontSize: 12, color: '#6b7280', marginLeft: 'auto' }}>
                    {new Date(insight.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                
                <Text style={{ fontSize: 14, color: '#f9fafb', lineHeight: 20 }}>
                  {insight.text}
                </Text>
              </View>
            ))}
          </View>
          
          <View style={{ 
            marginTop: 8, 
            padding: 12, 
            backgroundColor: 'rgba(96, 165, 250, 0.05)',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: 'rgba(96, 165, 250, 0.2)',
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 14, color: '#60a5fa', marginRight: 8 }}>✨</Text>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>
              New insights are generated every 24 hours based on your activity and progress
            </Text>
          </View>
        </HolographicCard>
        
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <HolographicCard style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#f9fafb', 
              marginBottom: 16 
            }}>Correlation Map</Text>
            
            <View style={{ height: 200, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
                The correlation map shows how different aspects of your life affect each other.
              </Text>
              <View style={{ 
                marginTop: 12,
                padding: 12, 
                backgroundColor: '#1f2937',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#374151',
                width: '80%',
                alignItems: 'center'
              }}>
                <Text style={{ color: '#f9fafb', marginBottom: 8 }}>🔒 Advanced Feature</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, textAlign: 'center' }}>
                  Unlock Deep Analysis at Level 8 to access correlation mapping
                </Text>
              </View>
            </View>
          </HolographicCard>
          
          <HolographicCard style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 14, 
              fontWeight: '600', 
              color: '#f9fafb', 
              marginBottom: 16 
            }}>Recent Activity Impact</Text>
            
            <View style={{ marginBottom: 12 }}>
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#1f2937',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 14, color: '#f9fafb', flex: 1 }}>Morning Meditation</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#34d399', marginRight: 4 }}>+12%</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Focus</Text>
                </View>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#1f2937',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 14, color: '#f9fafb', flex: 1 }}>Call with Sarah</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#34d399', marginRight: 4 }}>+18%</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Mood</Text>
                </View>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                backgroundColor: '#1f2937',
                padding: 12,
                borderRadius: 8,
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 14, color: '#f9fafb', flex: 1 }}>Late-night screen time</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, color: '#f87171', marginRight: 4 }}>-8%</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Sleep</Text>
                </View>
              </View>
            </View>
          </HolographicCard>
        </View>
      </View>
    );
  };
  
  // Render habits tab
  const renderHabitsTab = () => {
    return (
      <View style={{ marginBottom: 24 }}>
        <HolographicCard style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#f9fafb' }}>Daily Habits</Text>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#1f2937', 
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 999
              }}
            >
              <Text style={{ fontSize: 12, color: '#60a5fa', marginRight: 4 }}>Add New</Text>
              <Text style={{ fontSize: 16, color: '#60a5fa' }}>+</Text>
            </TouchableOpacity>
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {habits.filter(h => h.frequency === 'daily').map(habit => (
              <View 
                key={habit.id} 
                style={{ 
                  width: '25%', 
                  padding: 8 
                }}
              >
                <View style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: habit.lastCompleted.toDateString() === new Date().toDateString() ? 
                    domains.find(d => d.id === habit.domainId)?.color || '#60a5fa' : 'transparent'
                }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>{habit.icon}</Text>
                  <Text style={{ fontSize: 14, color: '#f9fafb', textAlign: 'center', marginBottom: 12 }}>
                    {habit.name}
                  </Text>
                  
                  <View style={{ 
                    backgroundColor: habit.streak > 0 ? 'rgba(96, 165, 250, 0.1)' : '#111827',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 12, color: habit.streak > 0 ? '#60a5fa' : '#9ca3af' }}>
                      {habit.streak} day streak
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={{ 
                      marginTop: 16,
                      backgroundColor: habit.lastCompleted.toDateString() === new Date().toDateString() ? 
                        'rgba(52, 211, 153, 0.1)' : '#111827',
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      width: '100%',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: habit.lastCompleted.toDateString() === new Date().toDateString() ? 
                        '#34d399' : 'transparent'
                    }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      color: habit.lastCompleted.toDateString() === new Date().toDateString() ? 
                        '#34d399' : '#9ca3af' 
                    }}>
                      {habit.lastCompleted.toDateString() === new Date().toDateString() ? 'Completed' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </HolographicCard>
        
        <HolographicCard style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#f9fafb', marginBottom: 16 }}>
            Weekly Habits
          </Text>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {habits.filter(h => h.frequency === 'weekly').map(habit => (
              <View 
                key={habit.id} 
                style={{ 
                  width: '33.33%', 
                  padding: 8 
                }}
              >
                <View style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: 12,
                  padding: 16,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 
                    (new Date().getTime() - habit.lastCompleted.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                    domains.find(d => d.id === habit.domainId)?.color || '#60a5fa' : 'transparent'
                }}>
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>{habit.icon}</Text>
                  <Text style={{ fontSize: 14, color: '#f9fafb', textAlign: 'center', marginBottom: 12 }}>
                    {habit.name}
                  </Text>
                  
                  <View style={{ 
                    backgroundColor: habit.streak > 0 ? 'rgba(96, 165, 250, 0.1)' : '#111827',
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 12, color: habit.streak > 0 ? '#60a5fa' : '#9ca3af' }}>
                      {habit.streak} week streak
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={{ 
                      marginTop: 16,
                      backgroundColor: 
                        (new Date().getTime() - habit.lastCompleted.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                        'rgba(52, 211, 153, 0.1)' : '#111827',
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      width: '100%',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: 
                        (new Date().getTime() - habit.lastCompleted.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                        '#34d399' : 'transparent'
                    }}
                  >
                    <Text style={{ 
                      fontSize: 12, 
                      color: (new Date().getTime() - habit.lastCompleted.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                        '#34d399' : '#9ca3af' 
                    }}>
                      {(new Date().getTime() - habit.lastCompleted.getTime()) < 7 * 24 * 60 * 60 * 1000 ? 
                        'Completed' : 'Complete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </HolographicCard>
        
        <HolographicCard>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#f9fafb', marginBottom: 16 }}>
            Habit Stats
          </Text>
          
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, marginRight: 16 }}>
              <View style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 8, 
                padding: 16,
                marginBottom: 16
              }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Completion Rate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f9fafb' }}>78%</Text>
                  <View style={{ 
                    backgroundColor: 'rgba(52, 211, 153, 0.1)',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}>
                    <Text style={{ fontSize: 12, color: '#34d399', marginRight: 4 }}>↗</Text>
                    <Text style={{ fontSize: 12, color: '#34d399' }}>12%</Text>
                  </View>
                </View>
              </View>
              
              <View style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 8, 
                padding: 16
              }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Longest Streak</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f9fafb' }}>9 days</Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Morning Meditation</Text>
                </View>
              </View>
            </View>
            
            <View style={{ flex: 1 }}>
              <View style={{ 
                backgroundColor: '#1f2937', 
                borderRadius: 8, 
                padding: 16,
                height: '100%'
              }}>
                <Text style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>Monthly Activity</Text>
                <ContributionGraph
                  values={[
                    { date: '2025-04-01', count: 3 },
                    { date: '2025-04-02', count: 2 },
                    { date: '2025-04-03', count: 3 },
                    { date: '2025-04-04', count: 1 },
                    { date: '2025-04-05', count: 4 },
                    { date: '2025-04-06', count: 3 },
                    { date: '2025-04-07', count: 2 },
                  ]}
                  endDate={new Date('2025-04-07')}
                  numDays={14}
                  width={Dimensions.get('window').width * 0.35}
                  height={160}
                  tooltipDataAttrs={() => ({
                    fill: 'transparent'
                  })}
                  chartConfig={{
                    backgroundColor: 'transparent',
                    backgroundGradientFrom: 'transparent',
                    backgroundGradientTo: 'transparent',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(96, 165, 250, ${opacity})`,
                    labelColor: () => 'rgba(255, 255, 255, 0.6)',
                  }}
                />
              </View>
            </View>
          </View>
        </HolographicCard>
      </View>
    );
  };
  
  // Render AI tab
  const renderAITab = () => {
    return (
      <View style={{ marginBottom: 24 }}>
        <HolographicCard style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#f9fafb' }}>AI Companion</Text>
            <View style={{ 
              marginLeft: 12,
              backgroundColor: 'rgba(52, 211, 153, 0.1)',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderRadius: 999,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <View style={{ 
                width: 8, 
                height: 8, 
                borderRadius: 4, 
                backgroundColor: '#34d399',
                marginRight: 4 
              }} />
              <Text style={{ fontSize: 12, color: '#34d399' }}>Active</Text>
            </View>
          </View>
          
          <View style={{ 
            backgroundColor: '#111827',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}>
            <View style={{ marginBottom: 16 }}>
              {aiMessages.map(message => (
                <View 
                  key={message.id}
                  style={{ 
                    flexDirection: 'row',
                    justifyContent: message.sender === 'ai' ? 'flex-start' : 'flex-end',
                    marginBottom: 16
                  }}
                >
                  {message.sender === 'ai' && (
                    <View style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 18, 
                      backgroundColor: '#3b82f6',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Text style={{ fontSize: 16, color: '#fff' }}>AI</Text>
                    </View>
                  )}
                  
                  <View style={{ 
                    backgroundColor: message.sender === 'ai' ? '#1f2937' : 'rgba(96, 165, 250, 0.2)',
                    borderRadius: 12,
                    padding: 12,
                    maxWidth: '70%'
                  }}>
                    <Text style={{ fontSize: 14, color: message.sender === 'ai' ? '#f9fafb' : '#60a5fa' }}>
                      {message.text}
                    </Text>
                    <Text style={{ 
                      fontSize: 10, 
                      color: '#6b7280', 
                      marginTop: 4,
                      textAlign: message.sender === 'ai' ? 'left' : 'right'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  
                  {message.sender === 'user' && (
                    <View style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 18, 
                      backgroundColor: '#374151',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 12
                    }}>
                      <Text style={{ fontSize: 12, color: '#f9fafb' }}>You</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            
            <View style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#1f2937',
              borderRadius: 999,
              paddingVertical: 8,
              paddingHorizontal: 16
            }}>
              <Text style={{ flex: 1, color: '#9ca3af' }}>Ask your AI companion...</Text>
              <TouchableOpacity style={{ 
                width: 32, 
                height: 32, 
                borderRadius: 16, 
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Text style={{ color: '#fff' }}>↑</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ 
              flex: 1, 
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 12,
              marginRight: 8,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Help me relax</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ 
              flex: 1, 
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 12,
              marginRight: 8,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Improve sleep</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ 
              flex: 1, 
              backgroundColor: '#1f2937',
              borderRadius: 8,
              padding: 12,
              alignItems: 'center'
            }}>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>Find balance</Text>
            </TouchableOpacity>
          </View>
        </HolographicCard>
        
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          <HolographicCard style={{ flex: 1, marginRight: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#f9fafb', marginBottom: 16 }}>
              AI Integration
            </Text>
            
            <View>
              <View style={{ 
                backgroundColor: '#1f2937',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 12 }}>📊</Text>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>Data Analysis</Text>
                </View>
                <View style={{ 
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 12, color: '#34d399' }}>Active</Text>
                </View>
              </View>
              
              <View style={{ 
                backgroundColor: '#1f2937',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 12 }}>🔍</Text>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>Pattern Recognition</Text>
                </View>
                <View style={{ 
                  backgroundColor: 'rgba(52, 211, 153, 0.1)',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 12, color: '#34d399' }}>Active</Text>
                </View>
              </View>
              
              <View style={{ 
                backgroundColor: '#1f2937',
                borderRadius: 8,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 16, marginRight: 12 }}>🔮</Text>
                  <Text style={{ fontSize: 14, color: '#f9fafb' }}>Predictive Analysis</Text>
                </View>
                <View style={{ 
                  backgroundColor: '#374151',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>Lvl 5</Text>
                </View>
              </View>
            </View>
          </HolographicCard>
          
          <HolographicCard style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#f9fafb', marginBottom: 16 }}>
              AI Coach Features
            </Text>
            
            <View style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
              <LockedOverlay 
                message="AI Coach Features Locked" 
                level={userLevel} 
                unlocksAt={6} 
              />
              
              <View style={{ opacity: 0.6 }}>
                <View style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb', marginBottom: 8 }}>
                    Personalized Coaching
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    AI-powered coach that understands your specific needs and goals to provide targeted advice
                  </Text>
                </View>
                
                <View style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb', marginBottom: 8 }}>
                    Adaptive Guidance
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    Responsive guidance that adjusts based on your progress and changing circumstances
                  </Text>
                </View>
                
                <View style={{ 
                  backgroundColor: '#1f2937',
                  borderRadius: 8,
                  padding: 12
                }}>
                  <Text style={{ fontSize: 14, color: '#f9fafb', marginBottom: 8 }}>
                    Intervention Alerts
                  </Text>
                  <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                    Proactive alerts when patterns suggest you might need extra support or guidance
                  </Text>
                </View>
              </View>
            </View>
          </HolographicCard>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: '#000000',
      opacity: loaded ? 1 : 0
    }}>
      {/* Navigation Tabs */}
      <View style={{ 
        flexDirection: 'row', 
        backgroundColor: '#111827',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#1f2937'
      }}>
        <TouchableOpacity 
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginRight: 24 
          }}
          onPress={() => {}}
        >
          <Text style={{ 
            fontSize: 20, 
            fontWeight: '200', 
            letterSpacing: 3,
            color: '#60a5fa' 
          }}>
            LIFE<Text style={{ fontWeight: 'bold' }}>OS</Text>
          </Text>
        </TouchableOpacity>
        
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'metrics', label: 'Metrics' },
            { id: 'insights', label: 'Insights' },
            { id: 'habits', label: 'Habits' },
            { id: 'ai', label: 'AI Companion' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={{ 
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: activeTab === tab.id ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                marginRight: 8
              }}
              onPress={() => setActiveTab(tab.id as Tab)}
            >
              <Text style={{ 
                fontSize: 14, 
                color: activeTab === tab.id ? '#60a5fa' : '#9ca3af' 
              }}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ 
            backgroundColor: '#1f2937', 
            borderRadius: 8, 
            paddingHorizontal: 12, 
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: '#374151',
            marginRight: 16,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginRight: 8 }}>Level</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#60a5fa' }}>
              {userLevel}
            </Text>
          </View>
          
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#1f2937', 
            borderRadius: 999, 
            paddingHorizontal: 12, 
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: '#374151'
          }}>
            <View style={{ marginRight: 12 }}>
              <Text style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase' }}>XP</Text>
              <Text style={{ fontSize: 12, color: '#f9fafb' }}>{userXP} / {maxXP}</Text>
            </View>
            <View style={{ 
              width: 80, 
              height: 6, 
              backgroundColor: '#111827', 
              borderRadius: 999, 
              overflow: 'hidden' 
            }}>
              <LinearGradient
                colors={['#3b82f6', '#8b5cf6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ 
                  height: '100%', 
                  width: `${(userXP/maxXP) * 100}%`,
                  borderRadius: 999 
                }}
              />
            </View>
          </View>
        </View>
      </View>
      
      <ScrollView 
        style={{ 
          flex: 1, 
          backgroundColor: '#000000'
        }}
        contentContainerStyle={{ padding: 24 }}
      >
        {renderTabContent()}
        
        {/* Bottom Status Bar */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'center', 
          paddingVertical: 12,
          backgroundColor: '#111827',
          borderRadius: 8,
          borderWidth: 1,
          borderColor: '#1f2937'
        }}>
          <PulseIndicator />
          <Text style={{ fontSize: 12, color: '#9ca3af' }}>
            AI Companion integration active • Last sync 2 minutes ago
          </Text>
          <View style={{ 
            paddingHorizontal: 8, 
            paddingVertical: 2, 
            backgroundColor: '#1f2937', 
            borderRadius: 4,
            marginLeft: 16
          }}>
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>LIFEOS v2.0.0</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlaceholderDashboardScreen;