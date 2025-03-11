# Security Monitoring Testing Guide

## Overview
This document outlines the testing procedures for security monitoring and logging features in MyCrypto, following the monitoring requirements documented in `docs/security/monitoring.md`.

## Test Suites

### 1. Winston Logger Tests

#### Logger Configuration
```javascript
describe('Winston Logger Configuration', () => {
    it('initializes with correct security settings', () => {
        expect(logger.level).toBe(process.env.LOG_LEVEL || 'info');
        expect(logger.transports).toContainEqual(
            expect.objectContaining({
                name: 'safeFile',
                filename: expect.stringContaining('logs/app.log')
            })
        );
    });

    it('enforces log rotation', async () => {
        const logStore = new LogStore();
        const maxSize = 5 * 1024 * 1024; // 5MB
        
        // Generate logs until rotation
        for (let i = 0; i < 1000; i++) {
            await logStore.persistToDisk({
                level: 'info',
                message: 'Test log entry',
                timestamp: new Date().toISOString()
            });
        }

        const stats = await fs.promises.stat(LOG_FILE);
        expect(stats.size).toBeLessThan(maxSize);
    });
});
```

### 2. Real-time Security Monitoring

#### Security Event Tracking
```javascript
describe('Security Event Monitoring', () => {
    it('tracks rate limit violations', async () => {
        // Trigger rate limit
        const requests = Array(101).fill().map(() => 
            request(app).get('/api/health')
        );
        await Promise.all(requests);

        // Check security logs
        const logs = await logger.query({
            from: new Date() - 1000, // Last second
            until: new Date(),
            limit: 100,
            fields: ['message', 'level', 'component']
        });

        expect(logs).toContainEqual(
            expect.objectContaining({
                level: 'warn',
                component: 'security',
                message: expect.stringContaining('Rate limit exceeded')
            })
        );
    });

    it('monitors failed authentication attempts', async () => {
        await request(app)
            .post('/api/wallet/connect')
            .send({ address: 'invalid-address' });

        const logs = await logger.query({
            component: 'security',
            level: 'warn'
        });

        expect(logs).toContainEqual(
            expect.objectContaining({
                message: expect.stringContaining('Invalid authentication attempt')
            })
        );
    });
});
```

### 3. Prometheus Metrics Tests

#### Metrics Collection
```javascript
describe('Prometheus Metrics', () => {
    it('collects security metrics', async () => {
        const response = await request(app).get('/metrics');
        
        expect(response.text).toContain('rate_limit_exceeded_total');
        expect(response.text).toContain('authentication_failures_total');
        expect(response.text).toContain('security_events_total');
    });

    it('tracks request durations', async () => {
        await request(app).get('/api/health');
        
        const metricsResponse = await request(app).get('/metrics');
        expect(metricsResponse.text).toContain('http_request_duration_seconds');
    });
});
```

### 4. Alert System Tests

#### Alert Configuration
```javascript
describe('Security Alerts', () => {
    it('triggers alerts on security events', async () => {
        const alertSystem = new AlertSystem();
        const securityEvent = {
            level: 'error',
            component: 'security',
            message: 'Potential security breach detected',
            timestamp: new Date().toISOString()
        };

        await alertSystem.processEvent(securityEvent);

        expect(alertSystem.getAlerts()).toContainEqual(
            expect.objectContaining({
                severity: 'high',
                type: 'security_breach',
                status: 'triggered'
            })
        );
    });

    it('respects alert thresholds', async () => {
        const alertSystem = new AlertSystem();
        
        // Generate warning events below threshold
        for (let i = 0; i < 4; i++) {
            await alertSystem.processEvent({
                level: 'warn',
                component: 'security',
                message: 'Rate limit warning'
            });
        }

        expect(alertSystem.getAlerts()).toHaveLength(0);

        // Exceed threshold
        await alertSystem.processEvent({
            level: 'warn',
            component: 'security',
            message: 'Rate limit warning'
        });

        expect(alertSystem.getAlerts()).toHaveLength(1);
    });
});
```

### 5. Grafana Dashboard Tests

#### Dashboard Validation
```javascript
describe('Grafana Dashboards', () => {
    it('validates dashboard configuration', () => {
        const dashboard = require('../../grafana/dashboards/security.json');
        
        expect(dashboard.panels).toContainEqual(
            expect.objectContaining({
                title: 'Security Events',
                type: 'graph'
            })
        );

        expect(dashboard.templating.list).toContainEqual(
            expect.objectContaining({
                name: 'severity',
                type: 'query'
            })
        );
    });

    it('checks alert rules', () => {
        const alerts = require('../../grafana/alerts/security.json');
        
        expect(alerts).toContainEqual(
            expect.objectContaining({
                name: 'High Rate of Authentication Failures',
                frequency: '1m',
                conditions: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'query',
                        evaluator: {
                            type: 'gt',
                            params: [10]
                        }
                    })
                ])
            })
        );
    });
});
```

## Running Monitoring Tests

### Test Commands
```bash
# Run all monitoring tests
yarn test:monitoring

# Run specific monitoring suite
yarn test tests/monitoring/security.test.js -t "Prometheus Metrics"

# Run with coverage
yarn test:coverage tests/monitoring/security.test.js
```

## Best Practices

### Monitoring Testing Guidelines
1. Verify log rotation and retention
2. Test alert thresholds and triggers
3. Validate metric collection
4. Check dashboard configurations
5. Test alert notifications
6. Monitor system resources
7. Verify audit trail integrity

### Common Monitoring Scenarios
1. Log file rotation
2. Alert threshold breaches
3. Metric collection accuracy
4. Dashboard data validation
5. Alert notification delivery
6. System resource monitoring
7. Security event correlation

## Continuous Integration

### Monitoring Test Workflow
```yaml
monitoring-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Setup monitoring stack
      run: docker-compose up -d prometheus grafana
    - name: Run monitoring tests
      run: yarn test:monitoring
    - name: Validate dashboards
      run: yarn validate:dashboards
```

## Security Metrics

### Coverage Requirements
```javascript
// jest.config.js
module.exports = {
    coverageThreshold: {
        './src/monitoring/': {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    }
};
```
