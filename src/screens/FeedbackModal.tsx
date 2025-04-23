import React, { useState } from 'react';
import { Modal, View, TextInput, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { createApiService, useAuthenticatedApi } from '../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FeedbackModalProps = {
  visible: boolean;
  onClose: () => void;
};

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const authenticatedApi = useAuthenticatedApi();
  const api = createApiService(authenticatedApi);
  const insets = useSafeAreaInsets();
  
  const [category, setCategory] = useState<'feedback' | 'bug'>('feedback');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async () => {
    if (!content.trim()) {
      return; // Don't submit empty feedback
    }
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      await api.feedback.submitFeedback(category, content);
      setContent('');
      setSubmitStatus('success');
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 1500); // Show success message briefly before closing
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      transparent={true}
    >
      <TouchableWithoutFeedback onPress={() => {
        dismissKeyboard();
        onClose();
      }}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={[styles.modalContent, { 
                backgroundColor: theme.colors.surface,
                paddingBottom: Math.max(30, insets.bottom + 15) // Increased bottom padding for buttons
              }]}>
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>Send Feedback</Text>
                
                <View style={styles.categoryContainer}>
                  <Text style={{ color: theme.colors.onSurface }}>Type:</Text>
                  <View style={styles.typeButtonsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { 
                          backgroundColor: category === 'feedback' 
                            ? theme.colors.primary 
                            : theme.colors.surfaceVariant 
                        }
                      ]}
                      onPress={() => setCategory('feedback')}
                    >
                      <Text style={{ 
                        color: category === 'feedback' 
                          ? theme.colors.onPrimary 
                          : theme.colors.onSurfaceVariant
                      }}>
                        Feedback
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        { 
                          backgroundColor: category === 'bug' 
                            ? theme.colors.primary 
                            : theme.colors.surfaceVariant 
                        }
                      ]}
                      onPress={() => setCategory('bug')}
                    >
                      <Text style={{ 
                        color: category === 'bug' 
                          ? theme.colors.onPrimary 
                          : theme.colors.onSurfaceVariant
                      }}>
                        Bug Report
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TextInput
                  placeholder={category === 'bug' ? "Describe the issue you encountered..." : "Share your thoughts or suggestions..."}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
                  multiline
                  style={[
                    styles.textInput, 
                    { 
                      backgroundColor: theme.colors.surfaceVariant,
                      color: theme.colors.onSurface,
                      borderColor: theme.colors.outline
                    }
                  ]}
                  value={content}
                  onChangeText={setContent}
                />
                
                {submitStatus === 'success' && (
                  <Text style={styles.successMessage}>Feedback submitted successfully!</Text>
                )}
                
                {submitStatus === 'error' && (
                  <Text style={styles.errorMessage}>Failed to submit feedback. Please try again.</Text>
                )}
                
                <View style={styles.buttonContainer}>
                  <Button 
                    mode="outlined" 
                    onPress={onClose}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 2 }} // Add padding to the button content
                    labelStyle={{ color: theme.colors.primary }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleSubmit}
                    loading={isSubmitting}
                    disabled={isSubmitting || !content.trim()}
                    style={styles.button}
                    contentStyle={{ paddingVertical: 2 }} // Add padding to the button content
                  >
                    Submit
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '85%',
    overflow: 'hidden', // Ensures content doesn't overflow the modal
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 10,
  },
  typeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flex: 1,
    alignItems: 'center',
  },
  textInput: {
    minHeight: 100, // Reduced from 120
    maxHeight: 180, // Reduced from 200
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    marginBottom: 20, // Increased from 16
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10, // Add top margin
    marginBottom: 8, // Add bottom margin
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginBottom: 16,
  },
  errorMessage: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
});

export default FeedbackModal;