import React from 'react';
import { render, screen } from '@testing-library/react';

describe('Sample Test', () => {
  it('passes a basic test', () => {
    expect(true).toBe(true);
  });

  it('can render React components', () => {
    render(<div data-testid="test-element">Test Content</div>);
    expect(screen.getByTestId('test-element')).toHaveTextContent('Test Content');
  });
}); 