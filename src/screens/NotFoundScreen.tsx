import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const NotFoundScreen = () => {
  const navigation = useNavigation();
  const { paperTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
      <Text style={[styles.title, { color: paperTheme.colors.text }]}>Page Not Found</Text>
      <Text style={[styles.message, { color: paperTheme.colors.text }]}>
        The page you're looking for doesn't exist or has been moved.
      </Text>
      <Button 
        mode="contained" 
        style={styles.button}
        onPress={() => navigation.navigate('UserRoot' as never)}
      >
        Go to Home
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 16,
  },
});

export default NotFoundScreen;