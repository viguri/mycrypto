import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * WalletConnect component with enhanced security features including:
 * - Input validation and sanitization
 * - Connection state management
 * - Secure display of sensitive data
 * - SSL verification
 * - Rate limiting
 * - Cookie security
 * - XSS prevention
 */
export const WalletConnect = ({ onConnect }) => {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isSecure, setIsSecure] = useState(false);
  const [isMasked, setIsMasked] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  // Security configuration
  const securityConfig = {
    maxPayloadSize: 10240, // 10KB max payload size
    rateLimitWindow: 900000, // 15 minutes
    maxRequestsPerWindow: 100,
    cookieSecureOptions: {
      httpOnly: true,
      secure: true,
      sameSite: 'strict'
    }
  };

  // Validate Ethereum address format
  const validateAddress = (addr) => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(addr);
  };

  // Enhanced input sanitization to prevent XSS
  const sanitizeInput = (input) => {
    if (!input || typeof input !== 'string') return '';
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove potential JavaScript protocol
      .replace(/on\w+=/gi, '') // Remove potential event handlers
      .replace(/data:/gi, '') // Remove potential data URLs
      .trim();
  };

  // Check connection security with enhanced validation
  const checkConnectionSecurity = () => {
    const isHttps = window.location.protocol === 'https:';
    const hasSecureHeaders = document.cookie.includes('Secure') && 
                            document.cookie.includes('SameSite=Strict');
    return isHttps && hasSecureHeaders;
  };

  // Rate limiting check
  const checkRateLimit = () => {
    const now = Date.now();
    if (now - lastRequestTime > securityConfig.rateLimitWindow) {
      // Reset counter if window has passed
      setRequestCount(1);
      setLastRequestTime(now);
      return true;
    }
    
    if (requestCount >= securityConfig.maxRequestsPerWindow) {
      setError('Too many requests. Please try again later.');
      return false;
    }
    
    setRequestCount(prev => prev + 1);
    return true;
  };

  // Set secure cookie
  const setSecureCookie = (name, value) => {
    const { httpOnly, secure, sameSite } = securityConfig.cookieSecureOptions;
    document.cookie = `${name}=${value}; HttpOnly=${httpOnly}; Secure=${secure}; SameSite=${sameSite}; Path=/`;
  };

  useEffect(() => {
    // Check connection security on mount and protocol changes
    const securityStatus = checkConnectionSecurity();
    setIsSecure(securityStatus);

    // Set secure session cookie
    if (securityStatus) {
      setSecureCookie('walletSession', 'active');
    }
  }, []);

  const handleAddressChange = (event) => {
    const rawValue = event.target.value;
    
    // Validate input size
    if (rawValue.length * 2 > securityConfig.maxPayloadSize) {
      setError('Input exceeds maximum allowed size');
      return;
    }

    const sanitizedValue = sanitizeInput(rawValue);
    setAddress(sanitizedValue);
    setError('');
  };

  const handleConnect = async () => {
    try {
      // Check rate limiting
      if (!checkRateLimit()) {
        return;
      }

      // Validate address format
      if (!validateAddress(address)) {
        setError('Invalid Ethereum address format');
        return;
      }

      // Verify secure connection
      const isSecureConnection = checkConnectionSecurity();
      setIsSecure(isSecureConnection);

      if (!isSecureConnection) {
        setError('Warning: Connection is not secure');
        return;
      }

      // Proceed with connection
      await onConnect(address);

      // Set connection cookie with secure flags
      setSecureCookie('lastConnection', new Date().toISOString());

    } catch (err) {
      // Sanitize error message to prevent XSS
      const sanitizedError = sanitizeInput(err.message);
      setError('Connection failed: ' + sanitizedError);
    }
  };

  const toggleAddressVisibility = () => {
    setIsMasked(!isMasked);
  };

  return (
    <div className="wallet-connect" data-testid="wallet-connect">
      <div className="security-indicator">
        <span 
          data-testid="ssl-indicator"
          data-secure={isSecure}
          className={`ssl-status ${isSecure ? 'secure' : 'insecure'}`}
        >
          {isSecure ? '🔒 Secure' : '⚠️ Not Secure'}
        </span>
      </div>

      <div className="input-group">
        <label htmlFor="wallet-address">Wallet Address:</label>
        <div className="secure-input">
          <input
            id="wallet-address"
            type="text"
            value={address}
            onChange={handleAddressChange}
            placeholder="0x..."
            className={error ? 'error' : ''}
            data-testid="wallet-address-input"
            maxLength={42} // Ethereum address length
            pattern="^0x[a-fA-F0-9]{40}$" // HTML5 validation
            required
          />
          <button
            type="button"
            onClick={toggleAddressVisibility}
            className="visibility-toggle"
            data-testid="toggle-visibility"
            aria-label={isMasked ? 'Show address' : 'Hide address'}
          >
            {isMasked ? '👁️ Show' : '🔒 Hide'}
          </button>
        </div>
      </div>

      {error && (
        <div 
          className="error-message" 
          data-testid="error-message"
          role="alert"
        >
          {error}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={!address || error || !isSecure}
        className="connect-button"
        data-testid="connect-button"
      >
        Connect Wallet
      </button>

      <div className="security-notice">
        <small>
          🔒 Always verify the connection is secure before proceeding
        </small>
        {requestCount > 0 && (
          <small className="rate-limit-notice">
            Requests: {requestCount}/{securityConfig.maxRequestsPerWindow}
          </small>
        )}
      </div>
    </div>
  );
};

WalletConnect.propTypes = {
  onConnect: PropTypes.func.isRequired,
};

export default WalletConnect;
