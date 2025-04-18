import { useRef, useState, useEffect } from 'react';
import { ScrollView, FlatList } from 'react-native';
import { Message } from '../../context/ChatContext';

type ScrollRef = {
  current: FlatList | ScrollView | null;
};

export const useAutoScroll = (messages: Message[]) => {
  const scrollRef = useRef<FlatList | ScrollView>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const previousMessageCount = useRef(0);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length !== previousMessageCount.current) {
      setTimeout(() => {
        if (scrollRef.current) {
          // FlatList and ScrollView both support scrollToEnd
          scrollRef.current?.scrollToEnd({ animated: true });
        }
      }, 100);
      
      previousMessageCount.current = messages.length;
    }
  }, [messages]);

  // Function to handle scroll events
  const handleScroll = (event: { nativeEvent: { contentOffset: { y: number }, contentSize: { height: number }, layoutMeasurement: { height: number } } }) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    // Show button if scrolled up a significant amount
    const scrolledUp = contentSize.height - layoutMeasurement.height - contentOffset.y > 200;
    setShowScrollButton(scrolledUp && messages.length > 8);
  };

  // Function to manually scroll to bottom
  const scrollToBottom = () => {
    scrollRef.current?.scrollToEnd({ animated: true });
  };

  return {
    scrollRef,
    handleScroll,
    showScrollButton,
    scrollToBottom
  };
};

export default useAutoScroll;