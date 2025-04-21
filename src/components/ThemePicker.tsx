import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Card, Title, useTheme as usePaperTheme } from 'react-native-paper';
import { ThemeKey, themeOptions } from '../theme/colors';

// Define Props type
interface ThemePickerProps {
  selectedTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ selectedTheme, onThemeChange }) => {
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

// Define styles within the component file
const styles = StyleSheet.create({
  themeCard: {
    borderRadius: 12,
    elevation: 1, // Lower elevation for sheet context
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16, // Slightly smaller title
    marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  themeOptionContainer: {
    width: '25%', // Adjust layout if needed
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
    borderColor: 'white', // Use dynamic color later if needed
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  themeLabel: {
    fontSize: 12,
    color: '#666', // Use dynamic color later if needed
  },
});

export default ThemePicker; 