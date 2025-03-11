/**
 * Security Middleware Module
 * Implements advanced security measures for the Express application
 */

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'crypto';
import logger from '../utils/logger/index.js';

// Security configuration
const securityConfig = {
    session: {
        secret: process.env.SESSION_SECRET,
        name: 'sessionId',
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000
        },
        resave: false,
        saveUninitialized: false
    },
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 900000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX_IP) || 100
    },
    cors: {
        origin: process.env.TRUSTED_ORIGINS ? 
            process.env.TRUSTED_ORIGINS.split(',') : 
            ['http://localhost:8080'],
        methods: ['GET', 'POST'],
        credentials: true,
        maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400
    },
    bodyParser: {
        json: {
            limit: process.env.MAX_PAYLOAD_SIZE || '10kb',
            parameterLimit: parseInt(process.env.MAX_PARAMETER_COUNT) || 100
        }
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: (process.env.CSP_SCRIPT_SRC || 'self').split(',').map(src => `'${src}'`),
                styleSrc: (process.env.CSP_STYLE_SRC || 'self').split(',').map(src => `'${src}'`),
                imgSrc: (process.env.CSP_IMG_SRC || 'self,data:,https:').split(',').map(src => `'${src}'`),
                connectSrc: (process.env.CSP_CONNECT_SRC || 'self').split(',').map(src => `'${src}'`),
                fontSrc: (process.env.CSP_FONT_SRC || 'self,https:,data:').split(',').map(src => `'${src}'`),
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
        hsts: {
            maxAge: parseInt(process.env.HSTS_MAX_AGE) || 31536000,
            includeSubDomains: process.env.HSTS_INCLUDE_SUBDOMAINS === 'true',
            preload: process.env.HSTS_PRELOAD === 'true'
        }
    }
};

// URL validation middleware
const validateUrl = (url) => {
    try {
        const whitelist = process.env.TRUSTED_ORIGINS.split(',');
        const parsed = new URL(url);
        return whitelist.includes(parsed.origin);
    } catch (error) {
        return false;
    }
};

// Request validation middleware
const validateRequest = (req, res, next) => {
    // Validate redirect URLs
    if (req.query.redirect && !validateUrl(req.query.redirect)) {
        return res.status(400).json({
            error: 'InvalidRedirect',
            message: 'Invalid redirect URL'
        });
    }

    // Validate content length
    const contentLength = parseInt(req.headers['content-length']);
    const maxSize = parseInt(process.env.MAX_PAYLOAD_SIZE || '10240'); // 10kb default
    if (contentLength > maxSize) {
        return res.status(413).json({
            error: 'PayloadTooLarge',
            message: `Request size ${contentLength} exceeds maximum ${maxSize}`
        });
    }

    // Validate content type
    const contentType = req.headers['content-type'];
    if (req.method === 'POST' && !contentType?.includes('application/json')) {
        return res.status(415).json({
            error: 'UnsupportedMediaType',
            message: 'Content-Type must be application/json'
        });
    }

    next();
};

// Rate limiting middleware
const createRateLimiter = (options = {}) => {
    return rateLimit({
        windowMs: options.windowMs || securityConfig.rateLimit.windowMs,
        max: options.max || securityConfig.rateLimit.max,
        message: {
            error: 'RateLimitExceeded',
            message: 'Too many requests, please try again later'
        },
        standardHeaders: true,
        legacyHeaders: false
    });
};

// Security middleware stack
const securityMiddleware = [
    // 1. Basic security headers
    helmet(securityConfig.helmet),

    // 2. CORS protection
    cors(securityConfig.cors),

    // 3. Cookie parser
    cookieParser(),

    // 4. Session management
    session(securityConfig.session),

    // 5. Body parsing and size limits
    bodyParser.json(securityConfig.bodyParser.json),
    bodyParser.urlencoded({ extended: true, ...securityConfig.bodyParser.json }),

    // 6. Request validation
    validateRequest,

    // 7. Default rate limiting
    createRateLimiter()
];

// Specific rate limiters
const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10 // 10 attempts per window
});

const miningLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.MINING_RATE_LIMIT) || 10
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Log security errors
    if (err.security) {
        console.error('Security error:', {
            error: err.message,
            type: err.type,
            ip: req.ip,
            path: req.path
        });
    }

    // Send safe error response
    res.status(err.status || 500).json({
        error: err.type || 'InternalServerError',
        message: err.public || 'An error occurred'
    });
};

export const createSecurityMiddleware = () => {
    return [
        // Request tracking
        (req, res, next) => {
            const requestId = crypto.randomUUID();
            req.id = requestId;
            
            // Log request start
            logger.debug('Request received', {
                component: 'security',
                requestId,
                method: req.method,
                url: req.url,
                ip: req.ip,
                userId: req.user?.id
            });

            // Track response time
            const start = process.hrtime();
            
            res.on('finish', () => {
                const [seconds, nanoseconds] = process.hrtime(start);
                const ms = (seconds * 1000) + (nanoseconds / 1000000);
                
                logger.debug('Request completed', {
                    component: 'security',
                    requestId,
                    method: req.method,
                    url: req.url,
                    status: res.statusCode,
                    duration: `${ms.toFixed(2)}ms`
                });
            });
            
            next();
        },
        ...securityMiddleware,
        errorHandler
    ];
};

// Helper functions
const sanitizeStrings = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key].trim();
        } else if (typeof obj[key] === 'object') {
            sanitizeStrings(obj[key]);
        }
    });
};

const escapeHtml = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    
    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = obj[key]
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        } else if (typeof obj[key] === 'object') {
            escapeHtml(obj[key]);
        }
    });
};

export default createSecurityMiddleware;
