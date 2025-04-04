import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Keyboard, 
  TouchableWithoutFeedback, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  TouchableOpacity
} from 'react-native';
import { 
  FAB, 
  Portal, 
  Text, 
  Button, 
  TextInput, 
  Surface, 
  Divider, 
  IconButton,
  SegmentedButtons
} from 'react-native-paper';
import { useApi } from '../hooks/useApi';

const CATEGORIES = ['AI Companion', 'Memory', 'Other'];

const FeedbackButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const api = useApi();
  
  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('Category Required', 'Please select a category for your feedback.');
      return;
    }
    
    if (!feedback.trim()) {
      Alert.alert('Feedback Required', 'Please enter your feedback.');
      return;
    }
    
    try {
      setSubmitting(true);
      await api.feedback.submitFeedback(category, feedback);
      
      // Reset and close modal
      setFeedback('');
      setCategory('');
      setModalVisible(false);
      
      // Show success message
      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! It has been submitted successfully.'
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Submission Error',
        'There was an error submitting your feedback. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };
  
  return (
    <>
      {/* Floating button */}
      <FAB
        icon="comment-question-outline"
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        color="#ffffff"
      />
      
      {/* Feedback Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.centeredView}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalBackground} 
            onPress={closeModal}
          >
            <TouchableWithoutFeedback>
              <Surface style={styles.modalView}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Send Feedback</Text>
                  <IconButton
                    icon="close"
                    size={24}
                    onPress={closeModal}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.modalBody}>
                  <Text style={styles.label}>Category</Text>
                  <SegmentedButtons
                    value={category}
                    onValueChange={setCategory}
                    buttons={CATEGORIES.map(cat => ({
                      value: cat,
                      label: cat,
                    }))}
                    style={styles.categoryButtons}
                  />
                  
                  <Text style={styles.label}>Your Feedback</Text>
                  <TextInput
                    mode="outlined"
                    multiline
                    numberOfLines={4}
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Please describe your feedback here..."
                    style={styles.textInput}
                    blurOnSubmit={false}
                  />
                </View>
                
                <Divider />
                
                <View style={styles.modalFooter}>
                  <Button 
                    mode="outlined" 
                    onPress={closeModal}
                    style={styles.button}
                  >
                    Cancel
                  </Button>
                  <Button 
                    mode="contained" 
                    onPress={handleSubmit}
                    loading={submitting}
                    disabled={submitting || !feedback.trim() || !category}
                    style={styles.button}
                  >
                    Submit
                  </Button>
                </View>
              </Surface>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
  },
  modalView: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#fff',
    marginBottom: 8,
    height: 120,
  },
  categoryButtons: {
    marginBottom: 16,
  },
  button: {
    marginLeft: 8,
  },
});

export default FeedbackButton; 