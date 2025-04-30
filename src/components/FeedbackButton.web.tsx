import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { FAB, Surface, Text, Button, TextInput, IconButton } from './web';
import styles from './FeedbackButton.module.css';

const CATEGORIES = ['AI Companion', 'Memory', 'Other'];

const FeedbackButton = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [category, setCategory] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const api = useApi();
  
  const handleSubmit = async () => {
    if (!category) {
      alert('Please select a category for your feedback.');
      return;
    }
    
    if (!feedback.trim()) {
      alert('Please enter your feedback.');
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
      alert('Thank you for your feedback! It has been submitted successfully.');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('There was an error submitting your feedback. Please try again.');
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
        icon="comment-question"
        size="medium"
        color="#2196F3"
        className={styles.fab}
        onClick={() => setModalVisible(true)}
      />
      
      {/* Feedback Modal */}
      {modalVisible && (
        <div className={styles.modalContainer}>
          <div className={styles.modalOverlay} onClick={closeModal}></div>
          <Surface className={styles.modalContent} elevation={5}>
            <div className={styles.modalHeader}>
              <Text variant="title" className={styles.modalTitle}>Send Feedback</Text>
              <IconButton
                icon="close"
                size={24}
                onClick={closeModal}
              />
            </div>
            
            <hr className={styles.divider} />
            
            <div className={styles.modalBody}>
              <Text variant="label" className={styles.label}>Category</Text>
              <div className={styles.categoryButtons}>
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    mode={category === cat ? 'contained' : 'outlined'}
                    onClick={() => setCategory(cat)}
                    className={styles.categoryButton}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              
              <Text variant="label" className={styles.label}>Your Feedback</Text>
              <TextInput
                mode="outlined"
                multiline
                rows={4}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please describe your feedback here..."
                className={styles.textInput}
              />
            </div>
            
            <hr className={styles.divider} />
            
            <div className={styles.modalFooter}>
              <Button 
                mode="outlined" 
                onClick={closeModal}
                className={styles.button}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onClick={handleSubmit}
                loading={submitting}
                disabled={submitting || !feedback.trim() || !category}
                className={styles.button}
              >
                Submit
              </Button>
            </div>
          </Surface>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;