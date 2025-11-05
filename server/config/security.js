/**
 * Security Configuration Module
 * Centralizes all security-related configurations and constants
 */

// Helper to get env variable with default
const getEnvVar = (key, defaultValue) => {
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
};

// Parse comma-separated string to array
const parseArrayValue = (value, defaultValue) => {
    if (!value) return defaultValue;
    return value.split(',').map(item => item.trim());
};

export const securityConfig = {
    // Session security
    session: {
        name: 'sessionId',
        secret: getEnvVar('SESSION_SECRET', 'change-this-in-production'),
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            sameSite: 'strict',
            maxAge: parseInt(getEnvVar('SESSION_MAX_AGE', '86400000')),
            path: '/',
        },
        resave: false,
        saveUninitialized: false,
    },

    // Request validation
    validation: {
        maxPayloadSize: getEnvVar('MAX_PAYLOAD_SIZE', '10kb'),
        maxParameterCount: parseInt(getEnvVar('MAX_PARAMETER_COUNT', '100')),
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        sanitization: {
            removeXSS: true,
            trimStrings: true,
            escapeHTML: true,
        }
    },

    // API Security
    api: {
        maxRequestSize: getEnvVar('MAX_TRANSACTION_SIZE', '100kb'),
        timeoutMs: parseInt(getEnvVar('REQUEST_TIMEOUT', '30000')),
        rateLimiting: {
            windowMs: parseInt(getEnvVar('RATE_LIMIT_WINDOW', '900000')),
            maxRequestsPerIp: parseInt(getEnvVar('RATE_LIMIT_MAX_IP', '100')),
            maxRequestsPerUser: parseInt(getEnvVar('RATE_LIMIT_MAX_USER', '1000')),
        }
    },

    // Crypto settings
    crypto: {
        saltRounds: parseInt(getEnvVar('CRYPTO_SALT_ROUNDS', '12')),
        keyLength: parseInt(getEnvVar('CRYPTO_KEY_LENGTH', '32')),
        algorithm: getEnvVar('CRYPTO_ALGORITHM', 'sha256'),
        encoding: 'hex'
    },

    // CORS configuration
    cors: {
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
        maxAge: parseInt(getEnvVar('CORS_MAX_AGE', '86400')),
        credentials: true,
    },

    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: parseArrayValue(getEnvVar('CSP_SCRIPT_SRC'), ["'self'"]),
            styleSrc: parseArrayValue(getEnvVar('CSP_STYLE_SRC'), ["'self'", "'unsafe-inline'"]),
            imgSrc: parseArrayValue(getEnvVar('CSP_IMG_SRC'), ["'self'", "data:", "https:"]),
            connectSrc: parseArrayValue(getEnvVar('CSP_CONNECT_SRC'), ["'self'"]),
            fontSrc: parseArrayValue(getEnvVar('CSP_FONT_SRC'), ["'self'", "https:", "data:"]),
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        }
    },

    // Trusted origins for CORS
    trustedOrigins: parseArrayValue(
        getEnvVar('TRUSTED_ORIGINS'),
        [
            'http://localhost:8080', 
            'http://127.0.0.1:62480',
            'http://127.0.0.1:57770', // Browser preview URL
            'http://localhost:3003',   // Direct server URL
            'http://localhost:3000'    // Legacy port reference
        ]
    ),

    // Security headers
    headers: {
        hsts: {
            maxAge: parseInt(getEnvVar('HSTS_MAX_AGE', '31536000')),
            includeSubDomains: getEnvVar('HSTS_INCLUDE_SUBDOMAINS', 'true') === 'true',
            preload: getEnvVar('HSTS_PRELOAD', 'true') === 'true'
        },
        expectCt: {
            enforce: true,
            maxAge: 86400
        },
        referrerPolicy: 'strict-origin-when-cross-origin',
        permissionsPolicy: {
            camera: ["'none'"],
            microphone: ["'none'"],
            geolocation: ["'none'"]
        }
    },

    // Blockchain-specific security
    blockchain: {
        verification: {
            timeoutMs: parseInt(getEnvVar('BLOCK_VERIFICATION_TIMEOUT', '5000')),
            maxTransactionSize: getEnvVar('MAX_TRANSACTION_SIZE', '100kb'),
            maxBlockSize: getEnvVar('MAX_BLOCK_SIZE', '1mb'),
        },
        mining: {
            rateLimit: {
                windowMs: 60000, // 1 minute
                maxRequests: parseInt(getEnvVar('MINING_RATE_LIMIT', '10')),
            },
            // Proof of Work difficulty increases with more miners
            difficultyAdjustment: {
                enabled: true,
                interval: 10, // blocks
                targetTime: 120000, // 2 minutes
            }
        },
        transactions: {
            validation: {
                requireSignature: true,
                maxInputs: 100,
                maxOutputs: 100,
                minFee: '0.0001',
            }
        }
    }
};

export default securityConfig;
