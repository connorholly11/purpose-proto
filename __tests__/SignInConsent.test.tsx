import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LegalModal from '../src/screens/LegalModal'; // Assuming this is the correct path
import axios from 'axios';

// Mock dependencies
jest.mock('axios', () => ({
  get: jest.fn(),
  post: jest.fn()
}));

describe('Legal Consent Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock default API response for legal document fetch
    (axios.get as jest.Mock).mockResolvedValue({ // Use mockResolvedValue instead of mockResolvedValueOnce for default
      data: '# Terms of Service\n\nThis is a long terms document...\n...scroll...\n...scroll...\nEnd of document.'
    });
    
    // Mock default API response for acceptance post
    (axios.post as jest.Mock).mockResolvedValue({ status: 200 }); // Default successful post
  });
  
  test('Accept button should be disabled until scrolled to end', async () => {
    const onCloseMock = jest.fn();
    
    const { getByText, getByTestId } = render(
      <LegalModal
        visible={true}
        onClose={onCloseMock}
        docType="terms" // Testing 'terms' document type
        requireAcceptance={true} // Acceptance is required
      />
    );
    
    // Wait for the component to fetch and render the content
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/legal/terms') // Verify correct endpoint called
      );
      // Check if the title or some text content is rendered (optional but good)
      expect(getByText('Terms of Service')).toBeTruthy(); 
    });
    
    // Verify accept button is initially disabled
    // Note: Finding the button and checking its disabled state.
    // React Native Testing Library uses accessibilityState for this.
    const acceptButton = getByText('I Accept');
    expect(acceptButton.props.accessibilityState.disabled).toBe(true);
    
    // Simulate scrolling to the end of the ScrollView
    // Assumes the ScrollView inside LegalModal has testID="terms-scroll"
    fireEvent.scroll(getByTestId('terms-scroll'), {
      nativeEvent: {
        // Simulate being scrolled near/at the bottom
        contentOffset: { y: 1000 }, // Example: Scrolled down 1000 pixels
        layoutMeasurement: { height: 300 }, // Example: Visible height of the scroll view
        contentSize: { height: 1300 }, // Example: Total height of the scrollable content
      }
    });
    
    // Verify button becomes enabled after scrolling
    await waitFor(() => {
      expect(acceptButton.props.accessibilityState.disabled).toBe(false);
    });
    
    // Action: Press the now-enabled accept button
    fireEvent.press(acceptButton);
    
    // Verify API call is made to accept terms and modal closes
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/legal/accept'); // Verify acceptance endpoint
      expect(onCloseMock).toHaveBeenCalled(); // Verify onClose callback was triggered
    });
  });
  
  test('Non-required legal modal should allow immediate closing', async () => {
    const onCloseMock = jest.fn();
    
    // Override the default axios.get mock for this specific test if needed (e.g., privacy doc)
    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: '# Privacy Policy\n\nDetails about privacy...'
    });

    const { getByText } = render(
      <LegalModal
        visible={true}
        onClose={onCloseMock}
        docType="privacy" // Testing 'privacy' document type
        requireAcceptance={false} // Acceptance is NOT required
      />
    );
    
    // Wait for content to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/legal/privacy') // Verify correct endpoint
      );
       expect(getByText('Privacy Policy')).toBeTruthy();
    });
    
    // Action: Press the close button (assuming it has text 'Close')
    // Note: The accept button might be present but disabled or hidden, focus on the close action
    const closeButton = getByText('Close'); // Find the close button
    fireEvent.press(closeButton);
    
    // Verify onClose was called immediately without needing to scroll or accept
    expect(onCloseMock).toHaveBeenCalled();
    // Verify no acceptance API call was made
    expect(axios.post).not.toHaveBeenCalled(); 
  });
});