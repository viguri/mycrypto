import React, { useState } from 'react';
import PropTypes from 'prop-types';

export const WalletConnect = ({ onConnect }) => {
  const [address, setAddress] = useState('');
  const [isVisible, setIsVisible] = useState(true);
  const [error, setError] = useState('');
  const [isSecure, setIsSecure] = useState(false);

  // Validate Ethereum address format
  const validateAddress = (addr) => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(addr);
  };

  // Check connection security
  React.useEffect(() => {
    const checkSecurity = () => {
      const isHttps = window.location.protocol === 'https:';
      const hasSecureHeaders = document.cookie.includes('Secure') && 
                              document.cookie.includes('SameSite=Strict');
      setIsSecure(isHttps && hasSecureHeaders);
    };
    checkSecurity();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateAddress(address)) {
      setError('Invalid Ethereum address format');
      return;
    }

    try {
      await onConnect(address);
    } catch (err) {
      setError(err.message || 'Connection failed');
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="wallet-connect" data-testid="wallet-connect">
      <div className="security-indicator" data-testid="ssl-indicator" data-secure={isSecure}>
        {isSecure ? '🔒 Secure' : '⚠️ Not Secure'}
      </div>

      <form onSubmit={handleSubmit} className="connect-form">
        <div className="secure-input">
          <input
            type={isVisible ? 'text' : 'password'}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter Ethereum Address"
            data-testid="wallet-address-input"
            className={error ? 'error' : ''}
            maxLength={42}
          />
          <button
            type="button"
            onClick={toggleVisibility}
            className="visibility-toggle"
            data-testid="toggle-visibility"
            aria-label={isVisible ? 'Hide address' : 'Show address'}
          >
            {isVisible ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {error && (
          <div className="error-message" data-testid="error-message">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="connect-button"
          data-testid="connect-button"
          disabled={!address || !isSecure}
        >
          Connect Wallet
        </button>
      </form>

      <div className="connection-status" data-testid="connection-status">
        {address ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

WalletConnect.propTypes = {
  onConnect: PropTypes.func.isRequired
};
