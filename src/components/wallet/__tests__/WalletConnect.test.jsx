import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnect } from '../WalletConnect';

describe('WalletConnect Component', () => {
  const mockOnConnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock secure connection by default
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:' },
      writable: true
    });
    // Mock secure cookie
    document.cookie = 'walletSession=active; Secure=true; SameSite=Strict';
  });

  test('renders wallet connect component with security indicator', () => {
    render(<WalletConnect onConnect={mockOnConnect} />);
    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
    expect(screen.getByTestId('ssl-indicator')).toHaveTextContent('🔒 Secure');
  });

  test('validates Ethereum wallet address format', () => {
    render(<WalletConnect onConnect={mockOnConnect} />);
    const input = screen.getByTestId('wallet-address-input');
    
    // Test invalid address
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid Ethereum address format');
    
    // Test valid address
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } });
    expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
  });

  test('implements rate limiting', async () => {
    render(<WalletConnect onConnect={mockOnConnect} />);
    const input = screen.getByTestId('wallet-address-input');
    const connectButton = screen.getByTestId('connect-button');
    const validAddress = '0x1234567890123456789012345678901234567890';

    fireEvent.change(input, { target: { value: validAddress } });

    // Simulate multiple rapid requests
    for (let i = 0; i < 101; i++) {
      await act(async () => {
        fireEvent.click(connectButton);
      });
    }

    expect(screen.getByTestId('error-message')).toHaveTextContent('Too many requests');
  });

  test('prevents XSS in wallet address input', () => {
    render(<WalletConnect onConnect={mockOnConnect} />);
    const input = screen.getByTestId('wallet-address-input');
    const maliciousInput = '<script>alert("xss")</script>';
    
    fireEvent.change(input, { target: { value: maliciousInput } });
    expect(input.value).not.toContain('<script>');
    expect(input.value).not.toContain('javascript:');
  });

  test('toggles address visibility', () => {
    render(<WalletConnect onConnect={mockOnConnect} />);
    const toggleButton = screen.getByTestId('toggle-visibility');
    
    expect(toggleButton).toHaveTextContent('👁️ Show');
    fireEvent.click(toggleButton);
    expect(toggleButton).toHaveTextContent('🔒 Hide');
  });

  test('enforces secure connection requirement', () => {
    // Mock insecure connection
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:' },
      writable: true
    });
    document.cookie = '';

    render(<WalletConnect onConnect={mockOnConnect} />);
    const input = screen.getByTestId('wallet-address-input');
    const validAddress = '0x1234567890123456789012345678901234567890';
    
    fireEvent.change(input, { target: { value: validAddress } });
    expect(screen.getByTestId('ssl-indicator')).toHaveTextContent('⚠️ Not Secure');
    expect(screen.getByTestId('connect-button')).toBeDisabled();
  });
});
