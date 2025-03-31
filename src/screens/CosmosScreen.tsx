import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, ProgressBar, Title, Paragraph } from 'react-native-paper';
import { createAuthenticatedApi, createApiService } from '../services/api';
import Svg, { Circle, G, Path, Text as SvgText } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedProps, 
  withTiming,
  withRepeat,
  withDelay,
  Easing
} from 'react-native-reanimated';

// Animated SVG components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Define the structure of game state data
interface GameState {
  id: string;
  userId: string;
  clarityScore: number;
  driveScore: number;
  relationshipScore: number;
  emotionalBalanceScore: number;
  resilienceScore: number;
  selfAwarenessScore: number;
  connectionScore: number;
  scoreReasoning?: {
    clarity?: string;
    drive?: string;
    relationship?: string;
    emotionalBalance?: string;
    resilience?: string;
    selfAwareness?: string;
    connection?: string;
  };
  lastCalculated: string;
  createdAt: string;
}

// --- START: New Planet Component ---
interface PlanetProps {
  x: number;
  y: number;
  size: number;
  color: string;
  name: string;
  value: number;
  opacityRef: Animated.SharedValue<number>; // Pass the specific shared value
}

const Planet: React.FC<PlanetProps> = ({ x, y, size, color, name, value, opacityRef }) => {
  // Call useAnimatedProps unconditionally within the Planet component
  const animatedPlanetProps = useAnimatedProps(() => {
    return {
      opacity: opacityRef.value,
    };
  });

  return (
    <G>
      <AnimatedCircle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        animatedProps={animatedPlanetProps} // Use the hook result here
      />
      <SvgText
        x={x}
        y={y + size + 12} // Position label below planet
        fill="white"
        fontSize="12"
        textAnchor="middle"
      >
        {name}
      </SvgText>
      <SvgText
        x={x}
        y={y + size + 26} // Position score below label
        fill="white"
        fontSize="10"
        textAnchor="middle"
      >
        {Math.round(value)}
      </SvgText>
    </G>
  );
};
// --- END: New Planet Component ---

const CosmosScreen = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showVisualView, setShowVisualView] = useState(true);
  
  // Screen dimensions for responsive layout
  const screenWidth = Dimensions.get('window').width;
  const centerX = screenWidth / 2;
  const centerY = 220; // Position the sun near the top
  const svgHeight = 440; // Height of the SVG canvas
  
  // Animation values
  const sunScale = useSharedValue(1);
  const opacityValues = useRef(Array.from({ length: 7 }).map(() => useSharedValue(0.7))).current;
  
  // Create API service
  const api = createAuthenticatedApi();
  const apiService = createApiService(api);
  
  // Fetch game state on component mount
  useEffect(() => {
    fetchGameState();
    
    // Start animations
    sunScale.value = withRepeat(
      withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
      -1, // Infinite repeat
      true // Reverse
    );
    
    // Animate planets with slight delays
    opacityValues.forEach((opacity, index) => {
      opacity.value = withRepeat(
        withDelay(
          index * 500,
          withTiming(1, { duration: 2000 + index * 300, easing: Easing.inOut(Easing.quad) })
        ),
        -1, // Infinite repeat
        true // Reverse
      );
    });
  }, []);
  
  // Function to fetch game state
  const fetchGameState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to fetch game state from API...');
      const data = await apiService.game.getGameState();
      console.log('Game state data received:', data);
      setGameState(data);
    } catch (err) {
      console.error('Error fetching game state:', err);
      setError('Failed to retrieve your Inner Cosmos data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Helper to convert score to percentage for progress bar
  const scoreToPercentage = (score: number) => score / 100;
  
  // Create animated props for sun scaling
  const animatedSunProps = useAnimatedProps(() => {
    return {
      r: 25 * sunScale.value,
    };
  });
  
  // Planet configuration based on game state
  const generatePlanets = () => {
    if (!gameState) return [];
    
    const scores = [
      { name: 'Clarity', value: gameState.clarityScore, color: '#4287f5' },
      { name: 'Drive', value: gameState.driveScore, color: '#f54263' },
      { name: 'Relationships', value: gameState.relationshipScore, color: '#42f5ad' },
      { name: 'Balance', value: gameState.emotionalBalanceScore, color: '#f5a742' },
      { name: 'Resilience', value: gameState.resilienceScore, color: '#9142f5' },
      { name: 'Awareness', value: gameState.selfAwarenessScore, color: '#f542b3' },
      { name: 'Connection', value: gameState.connectionScore, color: '#72f542' },
    ];
    
    return scores.map((score, index) => {
      const orbitRadius = 60 + index * 28;
      const planetSize = Math.max(5, Math.min(15, score.value / 10));
      const angle = (index * (360 / 7)) * (Math.PI / 180);
      
      return {
        name: score.name,
        value: score.value,
        color: score.color,
        orbitRadius,
        planetSize,
        angle,
        opacityRef: opacityValues[index],
      };
    });
  };
  
  // Create planets when gameState changes
  const planets = React.useMemo(() => generatePlanets(), [gameState, opacityValues]);
  
  // Toggle between visual and data views
  const toggleView = () => {
    setShowVisualView(!showVisualView);
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Scanning your Inner Cosmos...</Text>
      </SafeAreaView>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={fetchGameState} style={styles.retryButton}>
          Retry
        </Button>
      </SafeAreaView>
    );
  }
  
  // Render empty state
  if (!gameState) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>Your Inner Cosmos is forming...</Text>
        <Paragraph style={styles.emptyText}>
          Continue chatting with your AI companion to generate insights about your inner world.
        </Paragraph>
        <Button mode="contained" onPress={fetchGameState} style={styles.refreshButton}>
          Check Again
        </Button>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Title style={styles.title}>Your Inner Cosmos</Title>
        <Paragraph style={styles.subtitle}>
          Explore the constellation of your mind and spirit
        </Paragraph>
        
        <Button 
          mode="outlined" 
          onPress={toggleView} 
          style={styles.toggleButton}
        >
          {showVisualView ? "Show Data View" : "Show Cosmos View"}
        </Button>
        
        {showVisualView ? (
          // COSMIC VISUALIZATION VIEW
          <View style={styles.visualContainer}>
            <Svg width={screenWidth} height={svgHeight} viewBox={`0 0 ${screenWidth} ${svgHeight}`}>
              {/* Background stars */}
              {Array.from({ length: 50 }).map((_, i) => (
                <Circle
                  key={`star-${i}`}
                  cx={Math.random() * screenWidth}
                  cy={Math.random() * svgHeight}
                  r={Math.random() * 1.5}
                  fill="white"
                  opacity={Math.random() * 0.8 + 0.2}
                />
              ))}
              
              {/* Orbits */}
              <G x={centerX} y={centerY}>
                {planets.map((planet, index) => (
                  <Circle
                    key={`orbit-${index}`}
                    cx="0"
                    cy="0"
                    r={planet.orbitRadius}
                    stroke="#ffffff22"
                    strokeWidth="1"
                    fill="none"
                  />
                ))}
              </G>
              
              {/* Animated sun */}
              <G x={centerX} y={centerY}>
                <AnimatedCircle
                  cx="0"
                  cy="0"
                  r={25} // Base radius
                  fill="#ffcc00"
                  animatedProps={animatedSunProps}
                />
                <Circle
                  cx="0"
                  cy="0"
                  r={15}
                  fill="#ffee88"
                />
              </G>
              
              {/* Planets on their orbits - RENDER THE NEW COMPONENT */}
              <G x={centerX} y={centerY}>
                {planets.map((planet, index) => {
                  // Calculate position around the orbit based on angle
                  const x = planet.orbitRadius * Math.cos(planet.angle);
                  const y = planet.orbitRadius * Math.sin(planet.angle);
                  
                  // Render the Planet component
                  return (
                    <Planet
                      key={`planet-${index}`}
                      x={x}
                      y={y}
                      size={planet.planetSize}
                      color={planet.color}
                      name={planet.name}
                      value={planet.value}
                      opacityRef={planet.opacityRef} // Pass the specific shared value
                    />
                  );
                })}
              </G>
            </Svg>
          </View>
        ) : (
          // DATA VIEW (original cards)
          <>
            {/* Clarity Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Clarity</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.clarityScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.clarityScore)}
                  color="#4287f5"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.clarity || "How clear are your goals and values."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Drive Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Drive</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.driveScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.driveScore)}
                  color="#f54263"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.drive || "Your motivation and engine power."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Relationship Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Relationships</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.relationshipScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.relationshipScore)}
                  color="#42f5ad"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.relationship || "Quality of your constellation connections."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Emotional Balance Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Emotional Balance</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.emotionalBalanceScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.emotionalBalanceScore)}
                  color="#f5a742"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.emotionalBalance || "Your planetary equilibrium."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Resilience Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Resilience</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.resilienceScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.resilienceScore)}
                  color="#9142f5"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.resilience || "Your shield strength against challenges."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Self-Awareness Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Self-Awareness</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.selfAwarenessScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.selfAwarenessScore)}
                  color="#f542b3"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.selfAwareness || "Your telescope focus on yourself."}
                </Paragraph>
              </Card.Content>
            </Card>
            
            {/* Connection Score Card */}
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.scoreHeader}>
                  <Title style={styles.scoreName}>Connection</Title>
                  <Text style={styles.scoreValue}>{Math.round(gameState.connectionScore)}</Text>
                </View>
                <ProgressBar
                  progress={scoreToPercentage(gameState.connectionScore)}
                  color="#72f542"
                  style={styles.progressBar}
                />
                <Paragraph style={styles.reasoning}>
                  {gameState.scoreReasoning?.connection || "Your gravity pull to others."}
                </Paragraph>
              </Card.Content>
            </Card>
          </>
        )}
        
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(gameState.lastCalculated).toLocaleString()}
        </Text>
        
        <Button 
          mode="contained" 
          onPress={fetchGameState}
          style={styles.refreshButton}
        >
          Refresh Cosmic Data
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e', // Darker background for space theme
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#007bff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#adb5bd',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#adb5bd',
    textAlign: 'center',
    marginBottom: 24,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: '#282846', // Darker card for space theme
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginBottom: 12,
  },
  reasoning: {
    fontSize: 14,
    color: '#adb5bd',
  },
  lastUpdated: {
    textAlign: 'center',
    fontSize: 12,
    color: '#adb5bd',
    marginTop: 16,
    marginBottom: 16,
  },
  refreshButton: {
    marginBottom: 24,
    backgroundColor: '#007bff',
  },
  visualContainer: {
    width: '100%',
    height: 440,
    backgroundColor: '#121224',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  toggleButton: {
    marginBottom: 16,
    borderColor: '#007bff',
    alignSelf: 'center',
  },
});

export default CosmosScreen; 