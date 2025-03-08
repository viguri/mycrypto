# Security Configuration Guide

## Environment Variables

### Core Security Settings

```properties
# Session Security
SESSION_SECRET=your-secure-random-string-here  # At least 32 characters
SESSION_MAX_AGE=86400000                      # 24 hours in milliseconds

# Rate Limiting
RATE_LIMIT_WINDOW=900000        # 15 minutes in milliseconds
RATE_LIMIT_MAX_IP=100          # Maximum requests per IP
RATE_LIMIT_MAX_USER=1000       # Maximum requests per authenticated user

# Request Validation
MAX_PAYLOAD_SIZE=10kb          # Maximum request body size
MAX_PARAMETER_COUNT=100        # Maximum number of parameters
REQUEST_TIMEOUT=30000          # Request timeout in milliseconds

# CORS Settings
TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:62480
CORS_MAX_AGE=86400            # CORS preflight cache duration

# Content Security Policy
CSP_SCRIPT_SRC=self
CSP_STYLE_SRC=self,unsafe-inline
CSP_IMG_SRC=self,data:,https:
CSP_CONNECT_SRC=self
CSP_FONT_SRC=self,https:,data:

# Security Headers
HSTS_MAX_AGE=31536000         # 1 year in seconds
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# Blockchain Security
BLOCK_VERIFICATION_TIMEOUT=5000
MAX_TRANSACTION_SIZE=100kb
MAX_BLOCK_SIZE=1mb
MINING_RATE_LIMIT=10
```

## Configuration Modules

### Security Configuration (`src/config/security.js`)

The security configuration module centralizes all security settings:

```javascript
export const securityConfig = {
    session: {
        // Session security settings
        name: 'sessionId',
        secret: process.env.SESSION_SECRET,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict'
        }
    },
    validation: {
        // Request validation settings
        maxPayloadSize: process.env.MAX_PAYLOAD_SIZE,
        maxParameterCount: parseInt(process.env.MAX_PARAMETER_COUNT)
    },
    blockchain: {
        // Blockchain-specific security settings
        verification: {
            timeoutMs: parseInt(process.env.BLOCK_VERIFICATION_TIMEOUT),
            maxTransactionSize: process.env.MAX_TRANSACTION_SIZE
        }
    }
};
```

## Configuration Examples

### 1. Session Security

```javascript
// In security.js
const sessionConfig = {
    name: 'sessionId',          // Custom session ID name
    secret: process.env.SESSION_SECRET,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,         // Prevent XSS access to cookie
        sameSite: 'strict',     // Prevent CSRF
        maxAge: parseInt(process.env.SESSION_MAX_AGE),
    },
    resave: false,
    saveUninitialized: false    // Prevent session fixation
};

// Usage in Express
app.use(session(sessionConfig));
```

### 2. Rate Limiting

```javascript
// Basic rate limiting
const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
    max: parseInt(process.env.RATE_LIMIT_MAX_IP)
});

// User-specific rate limiting
const userRateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW),
    max: parseInt(process.env.RATE_LIMIT_MAX_USER),
    keyGenerator: (req) => req.user?.id || req.ip
});

// Apply to routes
app.use('/api/', rateLimiter);
app.use('/api/user/', userRateLimiter);
```

### 3. Request Validation

```javascript
// Body parser configuration
app.use(express.json({
    limit: process.env.MAX_PAYLOAD_SIZE,
    parameterLimit: parseInt(process.env.MAX_PARAMETER_COUNT)
}));

// URL validation middleware
const validateUrl = (url) => {
    const whitelist = process.env.TRUSTED_ORIGINS.split(',');
    const parsed = new URL(url);
    return whitelist.includes(parsed.origin);
};

app.use((req, res, next) => {
    if (req.query.redirect && !validateUrl(req.query.redirect)) {
        return res.status(400).json({
            error: 'InvalidRedirect',
            message: 'Invalid redirect URL'
        });
    }
    next();
});
```

### 4. Content Security Policy

```javascript
// CSP configuration
const cspConfig = {
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: process.env.CSP_SCRIPT_SRC.split(',').map(src => `'${src}'`),
        styleSrc: process.env.CSP_STYLE_SRC.split(',').map(src => `'${src}'`),
        imgSrc: process.env.CSP_IMG_SRC.split(',').map(src => `'${src}'`),
        connectSrc: process.env.CSP_CONNECT_SRC.split(',').map(src => `'${src}'`),
        fontSrc: process.env.CSP_FONT_SRC.split(',').map(src => `'${src}'`),
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
    }
};

// Apply CSP
app.use(helmet.contentSecurityPolicy(cspConfig));
```

## Environment-Specific Configurations

### Development

```properties
NODE_ENV=development
SESSION_SECRET=dev-secret-change-in-production
TRUSTED_ORIGINS=http://localhost:8080
CSP_STYLE_SRC=self,unsafe-inline
```

### Production

```properties
NODE_ENV=production
SESSION_SECRET=long-random-string-at-least-32-chars
TRUSTED_ORIGINS=https://app.mycrypto.com
CSP_STYLE_SRC=self
RATE_LIMIT_MAX_IP=50
```

### Testing

```properties
NODE_ENV=test
SESSION_SECRET=test-secret
RATE_LIMIT_WINDOW=1000
RATE_LIMIT_MAX_IP=10
```

## Security Checklist

### Session Security
- [ ] Use strong SESSION_SECRET in production
- [ ] Enable secure cookies in production
- [ ] Set appropriate session timeout
- [ ] Configure sameSite cookie policy

### Rate Limiting
- [ ] Set appropriate window size
- [ ] Configure IP-based limits
- [ ] Set user-specific limits
- [ ] Monitor rate limit violations

### Request Validation
- [ ] Configure maximum payload size
- [ ] Set parameter count limits
- [ ] Validate redirect URLs
- [ ] Sanitize user input

### Content Security
- [ ] Configure CSP directives
- [ ] Enable HSTS in production
- [ ] Set frame protection
- [ ] Configure CORS properly

## Monitoring Configuration

```javascript
// Security event logging
const securityLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'security' },
    transports: [
        new winston.transports.File({ 
            filename: 'logs/security.log',
            level: 'info'
        }),
        new winston.transports.Console({
            format: winston.format.simple(),
            level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
        })
    ]
});

// Usage
securityLogger.warn('Rate limit exceeded', {
    ip: req.ip,
    endpoint: req.path,
    attempts: attempts
});
```

## Updating Security Configuration

When updating security settings:

1. Document changes in CHANGELOG.md
2. Update security.env.example
3. Notify team of required changes
4. Test in staging environment
5. Deploy with zero downtime
6. Monitor for issues

## Best Practices

1. **Secrets Management**
   - Never commit secrets to version control
   - Use environment variables
   - Rotate secrets regularly
   - Use secure secret storage

2. **Configuration Validation**
   - Validate at startup
   - Check required settings
   - Verify value ranges
   - Ensure secure defaults

3. **Error Handling**
   - Log configuration errors
   - Fail securely
   - Provide clear messages
   - Handle edge cases

4. **Monitoring**
   - Log configuration changes
   - Monitor security events
   - Track rate limits
   - Alert on violations
