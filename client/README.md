# MyCrypto Client

This directory contains the frontend client implementation for the MyCrypto blockchain application.

## Directory Structure

- `public/`: Static assets and HTML files
  - `index.html`: Main entry point for the application
  - Other static files (images, fonts, etc.)

- `src/`: Client source code
  - `components/`: UI components
    - `app.js`: Main application component
    - `auth.js`: Authentication component
    - `wallet.js`: Wallet component
    - `wallet-manager.js`: Wallet management component
  
  - `services/`: API clients and services
    - `api-client.js`: Client for interacting with the backend API
  
  - `utils/`: Client utilities
    - `connection-monitor.js`: Network connection monitoring
    - `crypto-utils.js`: Client-side cryptographic utilities
    - `logger.js`: Client-side logging
  
  - `styles/`: CSS files
    - `styles.css`: Main stylesheet

## Getting Started

To run the client:

```bash
# Using a simple HTTP server
cd client/public
python -m http.server 8080
```

Or you can use any static file server of your choice.

## Features

- Wallet creation and management
- Transaction sending and viewing
- Blockchain explorer
- Admin panel for wallet management
