import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { Card, Title, Paragraph, Button, Divider, Chip, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// Type for theme keys
type ThemeKey = 'blue' | 'purple' | 'red' | 'green' | 'yellow' | 'teal' | 'pink';

// Card type for swipe UI test
type SwipeCard = {
  id: number;
  question: string;
  leftAnswer: string;
  rightAnswer: string;
};

// SwipeUITest component
const SwipeUITest: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const [cards] = useState<SwipeCard[]>([
    {
      id: 1,
      question: "Do you prefer planning your day in advance?",
      leftAnswer: "No, I'm spontaneous",
      rightAnswer: "Yes, I like structure"
    },
    {
      id: 2,
      question: "Are you a morning person?",
      leftAnswer: "No, night owl",
      rightAnswer: "Yes, early bird"
    },
    {
      id: 3,
      question: "Do you enjoy outdoor activities?",
      leftAnswer: "No, indoor person",
      rightAnswer: "Yes, love outdoors"
    },
    {
      id: 4,
      question: "Do you prefer reading books over watching movies?",
      leftAnswer: "No, movies",
      rightAnswer: "Yes, books"
    },
    {
      id: 5,
      question: "Are you interested in learning new skills regularly?",
      leftAnswer: "No, master current ones",
      rightAnswer: "Yes, always learning"
    }
  ]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  
  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All cards completed
      onComplete();
    }
    setDragOffset(0);
  };
  
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Swipe UI Test Quest</Title>
        <Paragraph style={styles.subText}>
          Help your AI companion get to know you
        </Paragraph>
        
        <View style={styles.cardContainer}>
          {currentIndex < cards.length ? (
            <View style={[styles.swipeCard, {
              transform: [
                { translateX: dragOffset },
                { rotate: `${dragOffset * 0.05}deg` }
              ]
            }]}>
              <Text style={styles.questionText}>{cards[currentIndex].question}</Text>
              
              <View style={styles.answerContainer}>
                <View style={styles.answerOption}>
                  <View style={[styles.answerCircle, dragOffset < -40 ? styles.leftHighlight : {}]}>
                    <Text style={styles.emojiText}>👈</Text>
                  </View>
                  <Text style={styles.answerText}>{cards[currentIndex].leftAnswer}</Text>
                </View>
                
                <View style={styles.answerOption}>
                  <View style={[styles.answerCircle, dragOffset > 40 ? styles.rightHighlight : {}]}>
                    <Text style={styles.emojiText}>👉</Text>
                  </View>
                  <Text style={styles.answerText}>{cards[currentIndex].rightAnswer}</Text>
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <Button 
                  mode="contained" 
                  onPress={() => handleSwipe('left')}
                  style={styles.swipeButton}
                >
                  {cards[currentIndex].leftAnswer}
                </Button>
                <Button 
                  mode="contained" 
                  onPress={() => handleSwipe('right')}
                  style={styles.swipeButton}
                >
                  {cards[currentIndex].rightAnswer}
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.completedContainer}>
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>
              <Title>All Done!</Title>
              <Paragraph style={styles.subText}>
                Thanks for helping your AI companion get to know you better
              </Paragraph>
              <Button 
                mode="contained" 
                onPress={onComplete}
                style={styles.claimButton}
              >
                Claim 50 XP
              </Button>
            </View>
          )}
        </View>
        
        {currentIndex < cards.length && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentIndex + 1}/{cards.length}
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const QuestsScreen = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [showSwipeTest, setShowSwipeTest] = useState(false);

  const handleCategorySelect = (category: string) => {
    setActiveCategory(category);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Quests</Title>
        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>🔥 560 XP</Text>
        </View>
      </View>

      {/* Show Swipe UI Test if active */}
      {showSwipeTest ? (
        <SwipeUITest 
          onComplete={() => {
            setShowSwipeTest(false);
            // Could add XP or other rewards here
          }}
        />
      ) : (
        <>
          {/* Daily Streak Card */}
          <Card style={styles.streakCard}>
            <Card.Content style={styles.streakContent}>
              <View style={styles.streakHeader}>
                <Text style={styles.streakLabel}>Daily Streak</Text>
                <Text style={styles.streakCount}>12 days 🔥</Text>
              </View>
              <ProgressBar progress={0.75} color={theme.colors.primary} style={styles.streakProgress} />
            </Card.Content>
          </Card>

          {/* Categories */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <Chip 
              selected={activeCategory === 'all'}
              onPress={() => handleCategorySelect('all')}
              style={[styles.categoryChip, activeCategory === 'all' ? styles.activeChip : {}]}
              textStyle={activeCategory === 'all' ? styles.activeChipText : {}}
            >
              All
            </Chip>
            <Chip 
              selected={activeCategory === 'inProgress'}
              onPress={() => handleCategorySelect('inProgress')}
              style={[styles.categoryChip, activeCategory === 'inProgress' ? styles.activeChip : {}]}
              textStyle={activeCategory === 'inProgress' ? styles.activeChipText : {}}
            >
              In Progress
            </Chip>
            <Chip 
              selected={activeCategory === 'completed'}
              onPress={() => handleCategorySelect('completed')}
              style={[styles.categoryChip, activeCategory === 'completed' ? styles.activeChip : {}]}
              textStyle={activeCategory === 'completed' ? styles.activeChipText : {}}
            >
              Completed
            </Chip>
            <Chip 
              selected={activeCategory === 'daily'}
              onPress={() => handleCategorySelect('daily')}
              style={[styles.categoryChip, activeCategory === 'daily' ? styles.activeChip : {}]}
              textStyle={activeCategory === 'daily' ? styles.activeChipText : {}}
            >
              Daily
            </Chip>
          </ScrollView>

          {/* Quest Cards */}
          <View style={styles.questsList}>
            {/* Swipe UI Test Quest with Arrow */}
            <View style={styles.questCardContainer}>
              <View style={styles.arrowPointer}>
                <Text style={styles.arrowText}>Try this!</Text>
                <MaterialIcons name="arrow-downward" size={24} color="#f59e0b" />
              </View>
              
              <Card style={styles.questCard}>
                <Card.Content>
                  <View style={styles.questHeader}>
                    <Title style={styles.questTitle}>Swipe UI Test</Title>
                    <Chip style={styles.newChip}>New</Chip>
                  </View>
                  <Paragraph style={styles.questDescription}>
                    Help your AI companion get to know you through quick binary questions
                  </Paragraph>
                  <Button 
                    mode="contained" 
                    onPress={() => setShowSwipeTest(true)}
                    style={styles.startButton}
                  >
                    Start Quest
                  </Button>
                  <View style={styles.questFooter}>
                    <Text style={styles.difficultyText}>Difficulty: Easy</Text>
                    <Text style={styles.rewardText}>+50 XP</Text>
                  </View>
                </Card.Content>
              </Card>
            </View>

            {/* Quest Item - In Progress */}
            <Card style={styles.questCard}>
              <Card.Content>
                <View style={styles.questHeader}>
                  <Title style={styles.questTitle}>Morning Reflection</Title>
                  <Chip style={styles.inProgressChip}>In Progress</Chip>
                </View>
                <Paragraph style={styles.questDescription}>
                  Complete 3 daily reflections to earn 50 XP
                </Paragraph>
                <ProgressBar progress={0.66} color={theme.colors.primary} style={styles.questProgress} />
                <View style={styles.questFooter}>
                  <Text style={styles.progressText}>2/3 completed</Text>
                  <Text style={styles.rewardText}>+50 XP</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Quest Item - New */}
            <Card style={styles.questCard}>
              <Card.Content>
                <View style={styles.questHeader}>
                  <Title style={styles.questTitle}>Weekly Goal Setting</Title>
                  <Chip style={styles.newChip}>New</Chip>
                </View>
                <Paragraph style={styles.questDescription}>
                  Set 3 achievable goals for the week
                </Paragraph>
                <ProgressBar progress={0} color={theme.colors.primary} style={styles.questProgress} />
                <View style={styles.questFooter}>
                  <Text style={styles.progressText}>0/3 completed</Text>
                  <Text style={styles.rewardText}>+100 XP</Text>
                </View>
              </Card.Content>
            </Card>

            {/* Quest Item - Completed */}
            <Card style={[styles.questCard, styles.completedCard]}>
              <Card.Content>
                <View style={styles.questHeader}>
                  <Title style={styles.questTitle}>Daily Check-in</Title>
                  <Chip style={styles.completedChip}>Completed</Chip>
                </View>
                <Paragraph style={styles.questDescription}>
                  Complete your first check-in of the day
                </Paragraph>
                <ProgressBar progress={1} color={theme.colors.success} style={styles.questProgress} />
                <View style={styles.questFooter}>
                  <Text style={styles.progressText}>1/1 completed</Text>
                  <Text style={styles.completedRewardText}>+20 XP</Text>
                </View>
              </Card.Content>
            </Card>
          </View>

          {/* New Quest Button */}
          <Button
            mode="contained"
            icon="plus"
            style={styles.newQuestButton}
            contentStyle={styles.newQuestButtonContent}
          >
            Start New Quest
          </Button>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  xpBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  xpText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  streakCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    elevation: 4,
  },
  streakContent: {
    paddingVertical: 12,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakLabel: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  streakCount: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  streakProgress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryChip: {
    marginRight: 8,
    backgroundColor: 'white',
  },
  activeChip: {
    backgroundColor: theme.colors.primary,
  },
  activeChipText: {
    color: 'white',
  },
  questsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  questCardContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  arrowPointer: {
    position: 'absolute',
    top: -36,
    right: 24,
    flexDirection: 'column',
    alignItems: 'center',
    transform: [{ rotate: '12deg' }],
    zIndex: 10,
  },
  arrowText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  questCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.9,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 18,
  },
  questDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  questProgress: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#e0e0e0',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  difficultyText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  rewardText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  completedRewardText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  newChip: {
    backgroundColor: '#e5e0ff',
  },
  inProgressChip: {
    backgroundColor: '#fff8e0',
  },
  completedChip: {
    backgroundColor: '#e0ffe0',
  },
  startButton: {
    marginVertical: 8,
  },
  newQuestButton: {
    marginHorizontal: 16,
    marginBottom: 24,
    marginTop: 8,
    borderRadius: 12,
    height: 50,
  },
  newQuestButtonContent: {
    height: 50,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  cardContainer: {
    height: 350,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 24,
  },
  answerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  answerOption: {
    alignItems: 'center',
    width: '45%',
  },
  answerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftHighlight: {
    backgroundColor: '#ffebeb',
    borderColor: '#ffcccb',
    transform: [{ scale: 1.1 }],
  },
  rightHighlight: {
    backgroundColor: '#ebffeb',
    borderColor: '#ccffcc',
    transform: [{ scale: 1.1 }],
  },
  emojiText: {
    fontSize: 20,
  },
  answerText: {
    fontSize: 12,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  swipeButton: {
    width: '48%',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  completedContainer: {
    alignItems: 'center',
    padding: 16,
  },
  checkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0ffe0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkText: {
    fontSize: 32,
    color: theme.colors.success,
  },
  claimButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
  },
});

export default QuestsScreen;