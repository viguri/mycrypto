# MyCrypto Troubleshooting Guide

This document provides guidance for troubleshooting common issues with the MyCrypto application.

## Table of Contents
1. [Frontend Issues](#frontend-issues)
2. [API Issues](#api-issues)
3. [Wallet Management](#wallet-management)
4. [Transaction Issues](#transaction-issues)
5. [Server Configuration](#server-configuration)

## Frontend Issues

### Blank Screen / No Content Displayed
If the frontend appears blank or doesn't display any content:

1. **Check browser console for JavaScript errors**
   - Open browser developer tools (F12 or Ctrl+Shift+I)
   - Look for errors in the Console tab
   - Common errors include:
     - Undefined variables
     - Failed API requests
     - DOM manipulation errors

2. **Verify static file serving**
   - Ensure the Express server is correctly serving static files
   - Check the server.js configuration:
     ```javascript
     app.use(express.static('server/public'));
     ```
   - Verify file paths are correct

3. **Test with debug page**
   - Access the debug page at `/debug` endpoint
   - This provides basic diagnostics to verify server connectivity

### JavaScript Errors

#### Common Error: "Cannot read properties of undefined"
This typically occurs when trying to access properties of an object that doesn't exist:

1. **Add null checks before accessing properties**
   ```javascript
   // Instead of:
   element.querySelector('.some-class').textContent = 'value';
   
   // Use:
   const subElement = element.querySelector('.some-class');
   if (subElement) {
     subElement.textContent = 'value';
   }
   ```

2. **Use optional chaining when available**
   ```javascript
   element.querySelector('.some-class')?.textContent = 'value';
   ```

#### Error: "Failed to update status"
This occurs when the polling mechanism fails to fetch blockchain data:

1. **Check the startPolling method in app.js**
2. **Ensure proper error handling in API calls**
3. **Verify DOM elements exist before updating them**

## API Issues

### API Request Failures

#### Incorrect API Paths
The application uses the following API prefix structure:
- Base API prefix: `/api` (defined in config/index.js)
- API routes are mounted in server.js:
  ```javascript
  app.use(`${API_PREFIX}/registration`, registrationRoutes(blockchain));
  app.use(`${API_PREFIX}/transactions`, transactionRoutes(blockchain));
  app.use(`${API_PREFIX}/mining`, miningRoutes(blockchain));
  app.use(`${API_PREFIX}/blockchain`, blockchainRoutes(blockchain));
  app.use(`${API_PREFIX}/logs`, logsRoutes());
  ```

When making API requests, ensure you're using the correct path:
```javascript
// Correct:
fetch('/api/registration/wallet', {...});

// Incorrect:
fetch('/registration/wallet', {...});
```

#### Request Format Issues
Common request format issues:

1. **Missing credentials**
   - Always include credentials for authenticated endpoints:
   ```javascript
   fetch('/api/endpoint', {
     credentials: 'include'
   });
   ```

2. **Incorrect Content-Type**
   - Use appropriate content type headers:
   ```javascript
   headers: {
     'Content-Type': 'application/json',
     'Accept': 'application/json'
   }
   ```

3. **Empty request body when not needed**
   - Some POST endpoints don't require a body:
   ```javascript
   // For endpoints that don't need a body:
   fetch('/api/endpoint', {
     method: 'POST',
     headers: { 'Accept': 'application/json' },
     credentials: 'include'
   });
   
   // Instead of:
   fetch('/api/endpoint', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Accept': 'application/json'
     },
     body: JSON.stringify({}),
     credentials: 'include'
   });
   ```

### Response Handling

#### Empty Error Objects
If you see errors like `Error: {}` in the console:

1. **Improve error extraction**
   ```javascript
   if (!response.ok) {
     let errorMessage = 'Request failed';
     try {
       const errorData = await response.json();
       errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
     } catch (parseError) {
       errorMessage = `Server error: ${response.status}`;
     }
     throw new Error(errorMessage);
   }
   ```

2. **Check response format**
   - Server responses should follow a consistent format:
   ```javascript
   // Success format
   {
     data: { ... },
     message: "Success message",
     status: 200
   }
   
   // Error format
   {
     error: "Error type",
     message: "Error message",
     status: 400
   }
   ```

## Wallet Management

### Wallet Creation Issues

#### "Wallet creation failed: {}" Error
This error occurs when the wallet creation API call fails:

1. **Check API endpoint path**
   - Ensure you're using `/api/registration/wallet`

2. **Check request format**
   - The wallet creation endpoint doesn't require a request body
   - Remove `body: JSON.stringify({})` if present

3. **Implement fallback strategy**
   ```javascript
   try {
     // First attempt with ApiClient
     const data = await ApiClient.post('/api/registration/wallet');
     // Process response...
   } catch (apiError) {
     // Fallback to direct fetch
     const response = await fetch('/api/registration/wallet', {
       method: 'POST',
       headers: { 'Accept': 'application/json' },
       credentials: 'include'
     });
     // Process response...
   }
   ```

### Wallet Loading Issues

#### "Failed to load wallet" Error
This occurs when loading wallet data from localStorage or the API fails:

1. **Check localStorage data validity**
   ```javascript
   try {
     const stored = localStorage.getItem('wallet');
     if (!stored) return null;
     
     const data = JSON.parse(stored);
     if (!data || !data.address) {
       localStorage.removeItem('wallet');
       return null;
     }
     // Continue loading...
   } catch (error) {
     localStorage.removeItem('wallet');
     return null;
   }
   ```

2. **Implement offline fallback**
   - If API request fails, use cached data:
   ```javascript
   try {
     const walletData = await ApiClient.get(`/api/registration/${address}`);
     // Use API data...
   } catch (error) {
     console.warn('Using cached wallet data due to API error');
     // Use localStorage data...
   }
   ```

## Transaction Issues

### Transaction Creation Failures

1. **Validate transaction data**
   ```javascript
   if (!to) {
     throw new Error('Recipient address is required');
   }
   
   const parsedAmount = parseFloat(amount);
   if (isNaN(parsedAmount) || parsedAmount <= 0) {
     throw new Error('Invalid amount: must be a positive number');
   }
   ```

2. **Check balance before sending**
   ```javascript
   await this.getBalance();
   if (parsedAmount > this.balance) {
     throw new Error(`Insufficient balance: ${this.formatBalance()} available`);
   }
   ```

3. **Handle mining failures gracefully**
   ```javascript
   try {
     await this.mineTransaction();
   } catch (miningError) {
     console.warn('Mining failed, transaction is pending:', miningError);
     // Continue processing...
   }
   ```

## Server Configuration

### Port Configuration
The server runs on port 3003 (previously 3000):

- Check server configuration in config files
- Update documentation and client code to use the correct port
- Port is defined in the environment-specific config files

### CORS Configuration
Cross-Origin Resource Sharing is configured in server.js:

```javascript
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || securityConfig.trustedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('Blocked request from unauthorized origin', {
        component: 'server',
        origin,
        allowedOrigins: securityConfig.trustedOrigins
      });
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: securityConfig.cors.allowedMethods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  exposedHeaders: securityConfig.cors.exposedHeaders,
  credentials: securityConfig.cors.credentials,
  maxAge: securityConfig.cors.maxAge
}));
```

If experiencing CORS issues:
1. Check the `trustedOrigins` list in security config
2. Ensure credentials are properly handled on both client and server
3. Verify that the appropriate headers are being set

### Security Middleware
The application uses custom security middleware:

```javascript
app.use(createSecurityMiddleware());
```

This includes:
- Rate limiting
- Request validation
- Security headers

If experiencing security-related issues, check the middleware implementation in `/middleware/security.js`.
