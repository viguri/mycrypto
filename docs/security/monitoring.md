# Security Monitoring Guide

## Overview

This guide outlines the security monitoring practices implemented in MyCrypto, focusing on real-time threat detection, logging, and alerting.

## Logging Configuration

### Winston Logger Setup

```javascript
const winston = require('winston');
const { format } = winston;

const securityLogger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
        format.timestamp(),
        format.json()
    ),
    defaultMeta: { service: 'security' },
    transports: [
        // File transport for all levels
        new winston.transports.File({
            filename: 'logs/security.log',
            level: 'info',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            tailable: true
        }),
        // Error-specific log file
        new winston.transports.File({
            filename: 'logs/security-error.log',
            level: 'error'
        }),
        // Console output in development
        new winston.transports.Console({
            format: format.combine(
                format.colorize(),
                format.simple()
            ),
            level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
        })
    ]
});
```

### Log Categories

```javascript
// 1. Authentication Events
securityLogger.info('User authentication', {
    event: 'auth_attempt',
    userId: user.id,
    success: true,
    ip: req.ip,
    userAgent: req.headers['user-agent']
});

// 2. Rate Limit Violations
securityLogger.warn('Rate limit exceeded', {
    event: 'rate_limit',
    endpoint: req.path,
    ip: req.ip,
    count: requestCount
});

// 3. Invalid Requests
securityLogger.warn('Invalid request detected', {
    event: 'invalid_request',
    type: 'xss_attempt',
    payload: sanitize(req.query),
    ip: req.ip
});

// 4. Blockchain Security
securityLogger.error('Blockchain security violation', {
    event: 'blockchain_security',
    type: 'double_spend_attempt',
    transactionId: tx.id,
    blockHeight: block.height
});
```

## Real-time Monitoring

### Express Middleware

```javascript
const monitorRequest = (req, res, next) => {
    const startTime = Date.now();
    
    // Monitor response
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        // Log slow responses
        if (duration > process.env.SLOW_RESPONSE_THRESHOLD) {
            securityLogger.warn('Slow response detected', {
                path: req.path,
                duration,
                method: req.method,
                ip: req.ip
            });
        }
        
        // Log error responses
        if (res.statusCode >= 400) {
            securityLogger.warn('Error response', {
                path: req.path,
                statusCode: res.statusCode,
                method: req.method,
                ip: req.ip
            });
        }
    });
    
    next();
};
```

### Security Event Monitoring

```javascript
class SecurityMonitor {
    constructor() {
        this.failedLogins = new Map();
        this.suspiciousIPs = new Set();
        this.rateLimitViolations = new Map();
    }

    trackFailedLogin(ip) {
        const attempts = (this.failedLogins.get(ip) || 0) + 1;
        this.failedLogins.set(ip, attempts);

        if (attempts >= process.env.MAX_LOGIN_ATTEMPTS) {
            this.suspiciousIPs.add(ip);
            securityLogger.warn('Multiple failed login attempts', {
                ip,
                attempts
            });
        }
    }

    trackRateLimit(ip, endpoint) {
        const key = `${ip}:${endpoint}`;
        const violations = (this.rateLimitViolations.get(key) || 0) + 1;
        this.rateLimitViolations.set(key, violations);

        if (violations >= process.env.RATE_LIMIT_ALERT_THRESHOLD) {
            securityLogger.warn('Excessive rate limit violations', {
                ip,
                endpoint,
                violations
            });
        }
    }

    clearOldEntries() {
        const oneHourAgo = Date.now() - 3600000;
        this.failedLogins.clear();
        this.suspiciousIPs.clear();
        this.rateLimitViolations.clear();
    }
}

const securityMonitor = new SecurityMonitor();
setInterval(() => securityMonitor.clearOldEntries(), 3600000);
```

## Metrics Collection

### Prometheus Integration

```javascript
const prometheus = require('prom-client');

// Counter for security events
const securityEvents = new prometheus.Counter({
    name: 'security_events_total',
    help: 'Count of security events by type',
    labelNames: ['event_type', 'severity']
});

// Histogram for request durations
const requestDuration = new prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'HTTP request duration in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [50, 100, 200, 500, 1000, 2000, 5000]
});

// Gauge for rate limit status
const rateLimitStatus = new prometheus.Gauge({
    name: 'rate_limit_remaining',
    help: 'Remaining rate limit by IP',
    labelNames: ['ip']
});
```

### Metrics Middleware

```javascript
const collectMetrics = (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
        const duration = process.hrtime(start);
        const durationMs = duration[0] * 1000 + duration[1] / 1000000;

        requestDuration.labels(
            req.method,
            req.route?.path || 'unknown',
            res.statusCode
        ).observe(durationMs);

        if (res.statusCode >= 400) {
            securityEvents.labels(
                'http_error',
                res.statusCode >= 500 ? 'error' : 'warn'
            ).inc();
        }
    });

    next();
};
```

## Alerting System

### Alert Configuration

```javascript
const alertConfig = {
    thresholds: {
        failedLogins: parseInt(process.env.FAILED_LOGIN_ALERT_THRESHOLD),
        rateLimitViolations: parseInt(process.env.RATE_LIMIT_ALERT_THRESHOLD),
        errorRate: parseFloat(process.env.ERROR_RATE_ALERT_THRESHOLD),
        responseTime: parseInt(process.env.RESPONSE_TIME_ALERT_THRESHOLD)
    },
    channels: {
        email: process.env.ALERT_EMAIL,
        slack: process.env.SLACK_WEBHOOK_URL
    }
};
```

### Alert Implementation

```javascript
class SecurityAlert {
    constructor(config) {
        this.config = config;
        this.pendingAlerts = new Map();
    }

    async sendAlert(type, data) {
        const key = `${type}:${data.ip || 'system'}`;
        
        // Prevent alert flooding
        if (this.pendingAlerts.has(key)) {
            return;
        }
        
        this.pendingAlerts.set(key, Date.now());
        
        try {
            // Log alert
            securityLogger.error('Security alert triggered', {
                type,
                ...data
            });

            // Send to configured channels
            await Promise.all([
                this.sendEmailAlert(type, data),
                this.sendSlackAlert(type, data)
            ]);
        } catch (error) {
            securityLogger.error('Failed to send alert', {
                error: error.message,
                type,
                data
            });
        }

        // Clear alert after cooldown
        setTimeout(() => {
            this.pendingAlerts.delete(key);
        }, 300000); // 5 minutes cooldown
    }

    async sendEmailAlert(type, data) {
        if (!this.config.channels.email) return;
        
        const emailService = require('./email-service');
        await emailService.sendAlert({
            to: this.config.channels.email,
            subject: `Security Alert: ${type}`,
            body: JSON.stringify(data, null, 2)
        });
    }

    async sendSlackAlert(type, data) {
        if (!this.config.channels.slack) return;
        
        const slackService = require('./slack-service');
        await slackService.sendAlert({
            webhook: this.config.channels.slack,
            message: {
                text: `🚨 *Security Alert*: ${type}`,
                attachments: [{
                    color: 'danger',
                    fields: Object.entries(data).map(([key, value]) => ({
                        title: key,
                        value: String(value),
                        short: true
                    }))
                }]
            }
        });
    }
}

const securityAlert = new SecurityAlert(alertConfig);
```

## Dashboard Integration

### Grafana Dashboard Configuration

```javascript
const dashboardConfig = {
    panels: [
        {
            title: 'Security Events',
            type: 'graph',
            metrics: ['security_events_total'],
            alert: {
                name: 'High Security Event Rate',
                conditions: [{
                    type: 'query',
                    query: { params: ['A', '5m', 'now'] },
                    reducer: 'avg',
                    evaluator: { type: 'gt', params: [100] }
                }]
            }
        },
        {
            title: 'Response Times',
            type: 'heatmap',
            metrics: ['http_request_duration_ms'],
            alert: {
                name: 'High Response Times',
                conditions: [{
                    type: 'query',
                    query: { params: ['A', '5m', 'now'] },
                    reducer: 'avg',
                    evaluator: { type: 'gt', params: [1000] }
                }]
            }
        }
    ]
};
```

## Best Practices

### 1. Logging
- Use structured logging
- Include relevant context
- Implement log rotation
- Secure sensitive data

### 2. Monitoring
- Monitor all security events
- Track performance metrics
- Implement rate limiting
- Monitor system resources

### 3. Alerting
- Configure appropriate thresholds
- Prevent alert fatigue
- Use multiple channels
- Include actionable data

### 4. Maintenance
- Regular log review
- Update alert thresholds
- Monitor alert effectiveness
- Maintain dashboard accuracy
