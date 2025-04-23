import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  Modal, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { Button, Text, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import Markdown from '../components/MarkdownDisplay';
import { useAuthenticatedApi } from '../services/api';
import { useTheme } from '../context/ThemeContext';

type LegalDocType = 'terms' | 'privacy';

type LegalModalProps = {
  visible: boolean;
  onClose: () => void;
  docType: LegalDocType;
  requireAcceptance?: boolean;
};

const LegalModal = ({ visible, onClose, docType, requireAcceptance = false }: LegalModalProps) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState<boolean>(false);
  const [accepting, setAccepting] = useState<boolean>(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const api = useAuthenticatedApi();
  const { paperTheme } = useTheme();
  
  const loadDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/legal/${docType}`);
      
      setContent(response.data);
    } catch (error) {
      console.error(`Error loading ${docType} document:`, error);
      setError(`Unable to load ${docType} document. Please try again later.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleAccept = async () => {
    if (!scrolledToEnd) {
      return;
    }
    
    try {
      setAccepting(true);
      await api.post('/api/legal/accept');
      onClose();
    } catch (error) {
      console.error('Error accepting terms:', error);
      setError('Failed to register your acceptance. Please try again.');
    } finally {
      setAccepting(false);
    }
  };
  
  useEffect(() => {
    if (visible) {
      loadDocument();
      setScrolledToEnd(false);
    }
  }, [visible, docType]);
  
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Check if scrolled to bottom (with some threshold to account for rounding errors)
    const threshold = 20;
    const isAtEnd = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    
    if (isAtEnd) {
      setScrolledToEnd(true);
    }
  };
  
  const titleText = docType === 'terms' ? 'Terms of Service' : 'Privacy Policy';
  
  const markdownStyles = {
    body: {
      color: paperTheme.dark ? '#ffffff' : '#000000',
      fontSize: 16,
    },
    heading1: {
      color: paperTheme.dark ? '#ffffff' : '#000000',
      fontSize: 24,
      fontWeight: 'bold',
    },
    heading2: {
      color: paperTheme.dark ? '#ffffff' : '#000000',
      fontSize: 20,
      fontWeight: 'bold',
    },
    heading3: {
      color: paperTheme.dark ? '#ffffff' : '#000000',
      fontSize: 18,
      fontWeight: 'bold',
    },
    text: {
      color: paperTheme.dark ? '#dddddd' : '#333333',
    },
    strong: {
      fontWeight: 'bold',
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={requireAcceptance ? undefined : onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]}>
        <Surface style={styles.header}>
          <Text style={styles.title}>{titleText}</Text>
          {!requireAcceptance && (
            <Button
              icon="close"
              onPress={onClose}
              mode="text"
              style={styles.closeButton}
            >
              Close
            </Button>
          )}
        </Surface>
        
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={paperTheme.colors.primary} />
            <Text style={{ color: paperTheme.colors.text, marginTop: 16 }}>
              Loading {titleText}...
            </Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={{ color: paperTheme.colors.error, textAlign: 'center' }}>
              {error}
            </Text>
            <Button mode="contained" onPress={loadDocument} style={{ marginTop: 16 }}>
              Retry
            </Button>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            ref={scrollViewRef}
            onScroll={requireAcceptance ? handleScroll : undefined}
            scrollEventThrottle={16}
          >
            <View style={styles.contentContainer}>
              <Markdown style={markdownStyles}>
                {content}
              </Markdown>
              {/* Add some space at the bottom for better scrolling */}
              <View style={{ height: 40 }} />
            </View>
          </ScrollView>
        )}
        
        {requireAcceptance && (
          <Surface style={styles.footer}>
            <Text style={{ color: paperTheme.colors.text, opacity: scrolledToEnd ? 1 : 0.5 }}>
              {scrolledToEnd 
                ? 'Thank you for reading. Please confirm your acceptance below.'
                : 'Please read the entire document before accepting.'}
            </Text>
            <Button
              mode="contained"
              disabled={!scrolledToEnd || accepting}
              onPress={handleAccept}
              loading={accepting}
              style={styles.acceptButton}
            >
              I Accept
            </Button>
          </Surface>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    elevation: 4,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    marginLeft: 'auto',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#cccccc',
  },
  acceptButton: {
    marginTop: 16,
    paddingHorizontal: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  }
});

export default LegalModal;