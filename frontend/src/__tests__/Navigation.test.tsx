import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Navigation from '@/components/Navigation';

// Mock the usePathname hook
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => ({ get: () => null })),
}));

describe('Navigation Component', () => {
  it('renders navigation links correctly', () => {
    render(<Navigation />);
    
    // Check if the main navigation links are rendered
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });

  it('toggles mobile menu when button is clicked', () => {
    render(<Navigation />);
    
    // Mobile menu should be hidden initially
    expect(screen.queryByRole('link', { name: 'Chat' })).toBeInTheDocument();
    
    // Find the mobile menu button and click it
    const menuButton = screen.getByRole('button', { name: /open main menu/i });
    fireEvent.click(menuButton);
    
    // Mobile menu should now be visible
    const mobileMenu = document.getElementById('mobile-menu');
    expect(mobileMenu).toHaveClass('block');
    
    // Click the button again to hide the menu
    fireEvent.click(menuButton);
    expect(mobileMenu).toHaveClass('hidden');
  });
});
