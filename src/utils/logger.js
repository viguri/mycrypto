const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logFile) {
        this.logFile = logFile;
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        const dir = path.dirname(this.logFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    log(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message: message instanceof Error ? message.message : message,
            stack: message instanceof Error ? message.stack : null,
            context
        };

        const logLine = JSON.stringify(logEntry) + '\n';
        fs.appendFileSync(this.logFile, logLine);

        // Console output with color
        const colors = {
            error: '\x1b[31m', // red
            warn: '\x1b[33m',  // yellow
            info: '\x1b[36m',  // cyan
            reset: '\x1b[0m'
        };

        console.log(`${colors[level]}[${timestamp}] ${level.toUpperCase()}: ${logEntry.message}${colors.reset}`);
        if (logEntry.stack) {
            console.log(`${colors[level]}${logEntry.stack}${colors.reset}`);
        }
        if (Object.keys(context).length) {
            console.log(`${colors[level]}Context:${colors.reset}`, context);
        }
    }

    error(message, context = {}) {
        this.log('error', message, context);
    }

    warn(message, context = {}) {
        this.log('warn', message, context);
    }

    info(message, context = {}) {
        this.log('info', message, context);
    }
}

const logger = new Logger(path.join(__dirname, '../../logs/backend.log'));

module.exports = logger;