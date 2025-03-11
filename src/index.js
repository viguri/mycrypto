import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Security check for HTTPS in production
if (process.env.NODE_ENV === 'production' && window.location.protocol !== 'https:') {
  window.location.href = window.location.href.replace('http:', 'https:');
}

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
