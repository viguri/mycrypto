import React, { useState, useEffect } from 'react';
import { WalletConnect } from './components/wallet/WalletConnect';
import './styles/App.css';

const App = () => {
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: false,
    message: 'Checking security...'
  });

  useEffect(() => {
    // Check security requirements
    const checkSecurity = () => {
      const isHttps = window.location.protocol === 'https:';
      const hasSecureHeaders = document.cookie.includes('Secure') && 
                              document.cookie.includes('SameSite=Strict');
      
      setSecurityStatus({
        isSecure: isHttps && hasSecureHeaders,
        message: isHttps && hasSecureHeaders ? 
          '🔒 Secure Connection' : 
          '⚠️ Insecure Connection'
      });
    };

    checkSecurity();
  }, []);

  const handleWalletConnect = async (address) => {
    try {
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Prevent CSRF
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({ address }),
        // Ensure cookies are sent
        credentials: 'same-origin'
      });

      if (!response.ok) {
        throw new Error('Connection failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>MyCrypto Wallet</h1>
        <div className="security-status" data-testid="security-status">
          {securityStatus.message}
        </div>
      </header>
      
      <main className="app-main">
        <WalletConnect onConnect={handleWalletConnect} />
      </main>

      <footer className="app-footer">
        <p>Secure Blockchain Wallet - {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default App;
