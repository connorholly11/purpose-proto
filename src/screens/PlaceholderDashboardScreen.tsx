import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, SafeAreaView, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, ProgressChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Polygon, Line, Text as SvgText } from 'react-native-svg';

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
}

const PlaceholderDashboardScreen = () => {
  // User's current level and experience
  const [userLevel, setUserLevel] = useState(3);
  const [userXP, setUserXP] = useState(1250);
  const maxXP = 2000;
  
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
        sleep: 70
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
        social: 40
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
        growth: 0
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
        career: 0,
        impact: 0,
        legacy: 0
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
    { id: 'insights', name: 'AI Insights', unlocksAt: 2, isUnlocked: true },
    { id: 'tracking', name: 'Habit Tracking', unlocksAt: 3, isUnlocked: true },
    { id: 'challenges', name: 'Daily Challenges', unlocksAt: 4, isUnlocked: false },
    { id: 'coach', name: 'AI Life Coach', unlocksAt: 6, isUnlocked: false },
    { id: 'community', name: 'Community', unlocksAt: 8, isUnlocked: false },
    { id: 'analysis', name: 'Deep Analysis', unlocksAt: 10, isUnlocked: false }
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

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: '#000000',
      opacity: loaded ? 1 : 0
    }}>
      <ScrollView 
        style={{ 
          flex: 1, 
          backgroundColor: '#000000'
        }}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Header with User Level */}
        <View style={{ marginBottom: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ 
              fontSize: 28, 
              fontWeight: '200', 
              letterSpacing: 3,
              color: '#60a5fa' 
            }}>
              LIFE<Text style={{ fontWeight: 'bold' }}>OS</Text>
            </Text>
            
            <View style={{ 
              marginLeft: 24, 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#111827', 
              borderRadius: 8, 
              paddingHorizontal: 12, 
              paddingVertical: 4,
              borderWidth: 1,
              borderColor: '#1f2937'
            }}>
              <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginRight: 8 }}>Level</Text>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#60a5fa' }}>
                {userLevel}
              </Text>
            </View>
          </View>
          
          {/* XP Bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase', marginRight: 16 }}>XP</Text>
            <View style={{ 
              width: 192, 
              height: 8, 
              backgroundColor: '#1f2937', 
              borderRadius: 999, 
              overflow: 'hidden',
              marginRight: 16
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
            <Text style={{ fontSize: 14, color: '#f9fafb' }}>{userXP} / {maxXP}</Text>
          </View>
        </View>
      
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
                {features.map(feature => (
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
                        <Text style={{ fontSize: 14, marginRight: 8 }}>🔒</Text>
                      )}
                      <Text style={{ fontSize: 14, color: '#f9fafb' }}>{feature.name}</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#6b7280' }}>
                      {feature.isUnlocked ? 'Active' : `Lvl ${feature.unlocksAt}`}
                    </Text>
                  </View>
                ))}
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
          <View style={{ 
            width: 8, 
            height: 8, 
            borderRadius: 4, 
            backgroundColor: '#60a5fa',
            marginRight: 8
          }}></View>
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
            <Text style={{ fontSize: 12, color: '#9ca3af' }}>LIFEOS v1.2.5</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PlaceholderDashboardScreen; 