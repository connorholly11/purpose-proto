import { containsDirectPlatformChecks, platformChecks } from '../theme';

describe('Platform usage consistency', () => {
  // Reset counters before tests
  beforeEach(() => {
    platformChecks.reset();
  });

  // Sample test to check if a string contains direct Platform.OS checks
  test('detects direct Platform.OS checks', () => {
    const badCode = `
      const styles = StyleSheet.create({
        container: {
          padding: Platform.OS === 'ios' ? 20 : 16,
          margin: Platform.select({
            ios: 10,
            android: 8,
            default: 12
          })
        }
      });
    `;
    
    expect(containsDirectPlatformChecks(badCode)).toBe(true);
    
    const goodCode = `
      import { platformSelect, spacing } from '../theme';
      
      const styles = createPlatformStyleSheet({
        container: {
          padding: spacing.md,
          ios: {
            margin: 10
          },
          android: {
            margin: 8
          },
          default: {
            margin: 12
          }
        }
      });
    `;
    
    expect(containsDirectPlatformChecks(goodCode)).toBe(false);
  });

  // Test that our tracking mechanism works
  test('tracks direct Platform.OS usage', () => {
    // Initially the count should be 0
    expect(platformChecks.count).toBe(0);
    
    // Simulate direct Platform.OS usage
    platformChecks.register('Component.tsx:15');
    platformChecks.register('Component.tsx:30');
    
    // Check that the count increased
    expect(platformChecks.count).toBe(2);
    expect(platformChecks.locations).toEqual(['Component.tsx:15', 'Component.tsx:30']);
  });
});