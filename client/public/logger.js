class Logger {
    constructor() {
        this.storageKey = 'vigcoin_logs';
        this.maxLogs = 100;
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };
        this.level = 'info';
        this.requestId = null;
    }

    _getStoredLogs() {
        const logs = localStorage.getItem(this.storageKey);
        return logs ? JSON.parse(logs) : [];
    }

    _storeLogs(logs) {
        // Keep only the most recent logs
        const trimmedLogs = logs.slice(-this.maxLogs);
        localStorage.setItem(this.storageKey, JSON.stringify(trimmedLogs));
    }

    async _sendToServer(level, message, meta = {}) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                level,
                message: message instanceof Error ? message.message : message,
                stack: message instanceof Error ? message.stack : null,
                source: 'frontend',
                requestId: this.requestId,
                ...meta
            };

            await fetch('/api/logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(logEntry)
            });
        } catch (error) {
            console.error('Failed to send log to server:', error);
        }
    }

    _consoleLog(level, message, meta = {}) {
        const colors = {
            error: '#FF4136', // red
            warn: '#FF851B',  // orange
            info: '#0074D9',  // blue
            debug: '#AAAAAA'  // gray
        };

        const timestamp = new Date().toISOString();
        const prefix = `%c[${timestamp}] ${level.toUpperCase()}:`;
        const style = `color: ${colors[level]}; font-weight: bold;`;

        console.log(prefix, style, message);
        if (Object.keys(meta).length > 0) {
            console.log('%cContext:', 'color: #AAAAAA', meta);
        }
        if (message instanceof Error && message.stack) {
            console.log('%cStack:', 'color: #AAAAAA', message.stack);
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.level];
    }

    setRequestId(id) {
        this.requestId = id;
    }

    async log(level, message, meta = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message: message instanceof Error ? message.message : message,
            stack: message instanceof Error ? message.stack : null,
            requestId: this.requestId,
            ...meta
        };

        // Store in localStorage
        const logs = this._getStoredLogs();
        logs.push(logEntry);
        this._storeLogs(logs);

        // Console output
        this._consoleLog(level, message, meta);

        // Send to server
        await this._sendToServer(level, message, meta);

        return logEntry;
    }

    async error(message, meta = {}) {
        return this.log('error', message, meta);
    }

    async warn(message, meta = {}) {
        return this.log('warn', message, meta);
    }

    async info(message, meta = {}) {
        return this.log('info', message, meta);
    }

    async debug(message, meta = {}) {
        return this.log('debug', message, meta);
    }

    getLogs() {
        return this._getStoredLogs();
    }

    clearLogs() {
        localStorage.removeItem(this.storageKey);
    }

    // Create child logger with additional default metadata
    child(defaultMeta = {}) {
        const childLogger = Object.create(this);
        const parentLog = childLogger.log.bind(childLogger);

        childLogger.log = async (level, message, meta = {}) => {
            return parentLog(level, message, {
                ...defaultMeta,
                ...meta
            });
        };

        return childLogger;
    }
}

// Create global instance
window.logger = new Logger();

// Add global error handler
window.onerror = function(msg, url, line, col, error) {
    window.logger.error(error || msg, {
        url,
        line,
        col,
        type: 'uncaught'
    });
};

// Add promise error handler
window.onunhandledrejection = function(event) {
    window.logger.error(event.reason, {
        type: 'unhandledRejection'
    });
};