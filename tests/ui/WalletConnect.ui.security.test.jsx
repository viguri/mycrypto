import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { WalletConnect } from '../../src/components/wallet/WalletConnect';

describe('WalletConnect Security Tests', () => {
  const mockOnConnect = jest.fn();
  const validAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';

  beforeEach(() => {
    mockOnConnect.mockClear();
    // Reset cookies
    document.cookie = '';
    // Mock secure environment
    Object.defineProperty(window, 'location', {
      value: {
        protocol: 'https:'
      },
      writable: true
    });
    // Mock secure cookies
    document.cookie = 'Secure=true; SameSite=Strict';
  });

  describe('Input Validation & Sanitization', () => {
    it('should prevent XSS attacks in input', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'onclick=alert("xss")'
      ];
      
      for (const maliciousInput of maliciousInputs) {
        await userEvent.clear(input);
        await userEvent.type(input, maliciousInput);
        expect(input.value).not.toMatch(/[<>]|javascript:|data:|on\w+=/i);
      }
    });

    it('should enforce input size limits', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      const largeInput = '0x' + 'a'.repeat(1000);
      
      await userEvent.type(input, largeInput);
      expect(screen.getByTestId('error-message')).toHaveTextContent('Input exceeds maximum allowed size');
    });

    it('should validate Ethereum address format', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      const invalidAddresses = [
        '0xinvalid',
        '0x123',
        '1x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      ];
      
      for (const invalidAddress of invalidAddresses) {
        await userEvent.clear(input);
        await userEvent.type(input, invalidAddress);
        fireEvent.click(screen.getByTestId('connect-button'));
        expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid Ethereum address format');
        expect(mockOnConnect).not.toHaveBeenCalled();
      }
    });

    it('should accept valid Ethereum address format', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      fireEvent.click(screen.getByTestId('connect-button'));
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(mockOnConnect).toHaveBeenCalledWith(validAddress);
    });
  });

  describe('Connection Security', () => {
    it('should enforce HTTPS and secure cookies', () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const sslIndicator = screen.getByTestId('ssl-indicator');
      expect(sslIndicator).toHaveAttribute('data-secure', 'true');
      expect(sslIndicator).toHaveTextContent('🔒 Secure');
    });

    it('should prevent connection on insecure protocol', async () => {
      // Mock insecure environment
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:' },
        writable: true
      });

      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      
      const connectButton = screen.getByTestId('connect-button');
      expect(connectButton).toBeDisabled();
      
      fireEvent.click(connectButton);
      expect(mockOnConnect).not.toHaveBeenCalled();
      expect(screen.getByTestId('error-message')).toHaveTextContent('Warning: Connection is not secure');
    });

    it('should prevent connection without secure cookies', async () => {
      document.cookie = ''; // Clear secure cookies
      
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      
      const connectButton = screen.getByTestId('connect-button');
      expect(connectButton).toBeDisabled();
      
      fireEvent.click(connectButton);
      expect(mockOnConnect).not.toHaveBeenCalled();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce request rate limits', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      const connectButton = screen.getByTestId('connect-button');
      
      // Attempt multiple rapid connections
      for (let i = 0; i < 101; i++) {
        await userEvent.clear(input);
        await userEvent.type(input, validAddress);
        fireEvent.click(connectButton);
      }
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Too many requests');
      expect(screen.getByTestId('connect-button')).toBeDisabled();
    });

    it('should display request count', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      fireEvent.click(screen.getByTestId('connect-button'));
      
      expect(screen.getByText(/Requests: 1\/100/)).toBeInTheDocument();
    });
  });

  describe('Cookie Security', () => {
    it('should set secure cookies on successful connection', async () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      fireEvent.click(screen.getByTestId('connect-button'));
      
      expect(document.cookie).toMatch(/walletSession=active/);
      expect(document.cookie).toMatch(/Secure/);
      expect(document.cookie).toMatch(/SameSite=Strict/);
    });
  });

  describe('Error Handling Security', () => {
    it('should sanitize error messages', async () => {
      const mockError = new Error('<script>alert("xss")</script>error');
      mockOnConnect.mockRejectedValueOnce(mockError);

      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      fireEvent.click(screen.getByTestId('connect-button'));
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.innerHTML).not.toMatch(/<script>|javascript:|data:|on\w+=/i);
      });
    });

    it('should handle connection errors securely', async () => {
      const sensitiveError = new Error('API_KEY: abc123');
      mockOnConnect.mockRejectedValueOnce(sensitiveError);

      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const input = screen.getByTestId('wallet-address-input');
      await userEvent.type(input, validAddress);
      fireEvent.click(screen.getByTestId('connect-button'));
      
      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage.textContent).not.toContain('API_KEY');
      });
    });
  });

  describe('Accessibility & Security Indicators', () => {
    it('should provide accessible security status', () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      const sslIndicator = screen.getByTestId('ssl-indicator');
      expect(sslIndicator).toHaveAttribute('data-secure');
      expect(sslIndicator).toHaveClass('ssl-status');
    });

    it('should update security indicators appropriately', () => {
      render(<WalletConnect onConnect={mockOnConnect} />);
      
      // Test secure state
      let sslIndicator = screen.getByTestId('ssl-indicator');
      expect(sslIndicator).toHaveClass('secure');
      
      // Test insecure state
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:' },
        writable: true
      });
      
      render(<WalletConnect onConnect={mockOnConnect} />);
      sslIndicator = screen.getAllByTestId('ssl-indicator')[1];
      expect(sslIndicator).toHaveClass('insecure');
    });
  });
});
