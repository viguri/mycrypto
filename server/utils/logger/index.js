import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';

// Configuration
const MAX_LOGS = 1000; // Maximum number of logs to keep in memory
const ROTATION_SIZE = 800; // Number of logs to keep after rotation
const LOG_DIR = path.join(process.cwd(), 'server', 'logs'); // Use server/logs directory
const LOG_FILE = path.join(LOG_DIR, 'app.log');
const LOG_ARCHIVE = path.join(LOG_DIR, 'archive');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per log file
const MAX_ARCHIVE_FILES = 5; // Keep 5 archived files

// Ensure log directories exist and have correct permissions
async function ensureDirectories() {
    try {
        // Create directories with proper permissions (755)
        await fs.promises.mkdir(LOG_DIR, { recursive: true, mode: 0o755 });
        await fs.promises.mkdir(LOG_ARCHIVE, { recursive: true, mode: 0o755 });
        
        // Create empty log file if it doesn't exist (644 permissions)
        if (!fs.existsSync(LOG_FILE)) {
            await fs.promises.writeFile(LOG_FILE, '', { mode: 0o644 });
        }
        
        // Clean up any stale temporary files
        try {
            const files = await fs.promises.readdir(LOG_DIR);
            for (const file of files) {
                if (file.endsWith('.tmp')) {
                    try {
                        await fs.promises.unlink(path.join(LOG_DIR, file));
                    } catch (cleanupErr) {
                        console.error(`Failed to clean up stale temp file ${file}:`, cleanupErr);
                    }
                }
            }
        } catch (readErr) {
            console.error('Failed to read log directory:', readErr);
            // Continue execution, don't throw here
        }
    } catch (err) {
        console.error('Failed to create log directories:', err);
        // Don't throw, just log the error and continue
        console.warn('Continuing without file logging');
    }
}

// Initialize directories
(async () => {
    try {
        await ensureDirectories();
        console.log('Logger directories initialized successfully');
    } catch (err) {
        console.error('Logger initialization error:', err);
        // Continue execution anyway
    }
})();

// Promisify fs functions
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const rename = promisify(fs.rename);
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const createReadStream = fs.createReadStream;
const createWriteStream = fs.createWriteStream;

// Store logs in memory with indexing and persistence
class LogStore {
    constructor() {
        this.logs = [];
        this.timestampIndex = new Map(); // Index logs by timestamp
        this.componentIndex = new Map(); // Index logs by component
        this.levelIndex = new Map(); // Index logs by level
        this.loadLogsFromDisk(); // Load existing logs on startup
    }

    async loadLogsFromDisk() {
        let fileHandle = null;
        try {
            if (fs.existsSync(LOG_FILE)) {
                fileHandle = await fs.promises.open(LOG_FILE, 'r');
                const data = await fileHandle.readFile('utf8');
                await fileHandle.close();
                fileHandle = null;
                
                const logs = data.split('\n')
                    .filter(line => line.trim())
                    .map(line => JSON.parse(line));
                logs.forEach(log => this.add(log, false));
            }

            // Load compressed archives if any exist
            const archives = fs.readdirSync(LOG_ARCHIVE)
                .filter(f => f.endsWith('.gz'))
                .sort();

            for (const archive of archives) {
                try {
                    fileHandle = await fs.promises.open(path.join(LOG_ARCHIVE, archive), 'r');
                    const compressedData = await fileHandle.readFile();
                    await fileHandle.close();
                    fileHandle = null;
                    
                    const data = await gunzip(compressedData);
                    const logs = data.toString('utf8').split('\n')
                        .filter(line => line.trim())
                        .map(line => JSON.parse(line));
                    logs.forEach(log => this.add(log, false));
                } catch (archiveErr) {
                    console.error(`Failed to load archive ${archive}:`, archiveErr);
                } finally {
                    if (fileHandle) await fileHandle.close();
                }
            }
        } catch (err) {
            console.error('Failed to load logs from disk:', err);
        } finally {
            if (fileHandle) await fileHandle.close();
        }
    }

    async persistToDisk(log) {
        let fileHandle = null;
        let tempFile = null;
        try {
            // Ensure directories exist
            await ensureDirectories();
            
            // Check file size
            let stats;
            try {
                stats = await stat(LOG_FILE);
            } catch (err) {
                // File doesn't exist yet
                stats = { size: 0 };
                // Create empty file with proper permissions
                await fs.promises.writeFile(LOG_FILE, '', { mode: 0o644 });
            }

            // Rotate file if too large
            if (stats.size >= MAX_FILE_SIZE) {
                await this.rotateLogFile();
            }

            // Write directly to the log file in development mode
            if (process.env.NODE_ENV === 'development') {
                fileHandle = await fs.promises.open(LOG_FILE, 'a');
                await fileHandle.writeFile(JSON.stringify(log) + '\n');
                await fileHandle.sync(); // Ensure data is written to disk
                await fileHandle.close();
                fileHandle = null;
                return;
            }

            // In production, use atomic writes with temporary files
            const tempDir = path.dirname(LOG_FILE);
            
            // Create a unique temporary file with proper permissions
            const timestamp = Date.now();
            tempFile = path.join(tempDir, `app-${timestamp}.log.tmp`);
            
            // Create new temp file with proper permissions
            await fs.promises.writeFile(tempFile, '', { mode: 0o644 });
            
            // Copy existing content if the log file exists
            if (fs.existsSync(LOG_FILE)) {
                const content = await fs.promises.readFile(LOG_FILE, 'utf8');
                await fs.promises.writeFile(tempFile, content, { flag: 'w' });
            }
            
            // Append the new log
            await fs.promises.appendFile(tempFile, JSON.stringify(log) + '\n');
            
            // Ensure temp file exists before attempting rename
            if (!fs.existsSync(tempFile)) {
                throw new Error('Temporary file was not created successfully');
            }
            
            // Atomic rename with retries
            let retries = 3;
            while (retries > 0) {
                try {
                    // Ensure both files exist before rename
                    if (fs.existsSync(tempFile)) {
                        await fs.promises.rename(tempFile, LOG_FILE);
                        break;
                    } else {
                        console.error('Temp file does not exist before rename');
                        throw new Error('Temp file missing');
                    }
                } catch (renameErr) {
                    retries--;
                    console.error(`Rename attempt failed (${retries} retries left):`, renameErr);
                    if (retries === 0) {
                        // On final failure, try to write directly
                        try {
                            await fs.promises.appendFile(LOG_FILE, JSON.stringify(log) + '\n');
                            console.log('Used direct append as fallback');
                            break;
                        } catch (appendErr) {
                            console.error('Direct append fallback failed:', appendErr);
                            throw renameErr;
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
                }
            }
        } catch (err) {
            console.error('Failed to persist log to disk:', err);
            // Clean up temporary file if it exists
            if (tempFile && fs.existsSync(tempFile)) {
                try {
                    await fs.promises.unlink(tempFile);
                } catch (cleanupErr) {
                    console.error('Failed to clean up temporary file:', cleanupErr);
                }
            }
        } finally {
            if (fileHandle) await fileHandle.close();
        }
    }

    async rotateLogFile() {
        let sourceHandle = null;
        let tempFile = null;
        let archivePath = null;

        try {
            // Ensure directories exist
            await ensureDirectories();
            
            // Get list of existing archive files
            const files = await fs.promises.readdir(LOG_ARCHIVE)
                .then(files => files.filter(f => f.endsWith('.gz')).sort())
                .catch(() => []);

            // Remove oldest files if we have too many, keeping track of space freed
            let spaceFreed = 0;
            for (const file of files.slice(0, -MAX_ARCHIVE_FILES + 1)) {
                try {
                    const filePath = path.join(LOG_ARCHIVE, file);
                    const stats = await fs.promises.stat(filePath);
                    spaceFreed += stats.size;
                    await fs.promises.unlink(filePath);
                } catch (err) {
                    console.error(`Failed to delete old archive ${file}:`, err);
                }
            }

            // Read current log file with proper error handling
            let logData = '';
            try {
                if (fs.existsSync(LOG_FILE)) {
                    logData = await fs.promises.readFile(LOG_FILE, 'utf8');
                }
            } catch (readErr) {
                console.error('Failed to read log file:', readErr);
                logData = ''; // Reset to empty if read fails
            }

            // Only proceed with compression if we have data
            if (logData.trim().length > 0) {
                // Compress with optimal settings
                const compressedData = await gzip(logData, { level: 9 });
                
                // Create archive file with timestamp
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                archivePath = path.join(LOG_ARCHIVE, `app.${timestamp}.log.gz`);
                
                // Write compressed file atomically using temp file
                const archiveTempFile = `${archivePath}.tmp`;
                await fs.promises.writeFile(archiveTempFile, compressedData, { mode: 0o644 });
                await fs.promises.rename(archiveTempFile, archivePath);
                
                // Clear the current log file atomically
                tempFile = `${LOG_FILE}.tmp`;
                await fs.promises.writeFile(tempFile, '', { mode: 0o644 });
                await fs.promises.rename(tempFile, LOG_FILE);
                
                // Log compression stats
                const compressionRatio = ((1 - (compressedData.length / logData.length)) * 100).toFixed(2);
                console.log(`Log rotation complete:\n` +
                    `- Original size: ${logData.length} bytes\n` +
                    `- Compressed size: ${compressedData.length} bytes\n` +
                    `- Compression ratio: ${compressionRatio}%\n` +
                    `- Space freed from old archives: ${spaceFreed} bytes\n` +
                    `- Archive path: ${archivePath}`);
            }
        } catch (err) {
            console.error('Failed to rotate log file:', err);
            // Clean up temporary files if they exist
            if (tempFile && fs.existsSync(tempFile)) {
                try {
                    await fs.promises.unlink(tempFile);
                } catch (cleanupErr) {
                    console.error('Failed to clean up temporary log file:', cleanupErr);
                }
            }
            if (archivePath && fs.existsSync(`${archivePath}.tmp`)) {
                try {
                    await fs.promises.unlink(`${archivePath}.tmp`);
                } catch (cleanupErr) {
                    console.error('Failed to clean up temporary archive file:', cleanupErr);
                }
            }
        } finally {
            if (sourceHandle) await sourceHandle.close();
        }
    }

    add(log, persist = true) {
        // Check if we need to rotate logs
        if (this.logs.length >= MAX_LOGS) {
            this.rotate();
        }

        // Add to main storage
        this.logs.push(log);

        // Persist to disk if needed
        if (persist) {
            this.persistToDisk(log).catch(err => {
                console.error('Failed to persist log:', err);
            });
        }

        // Update indices
        const timestamp = new Date(log.timestamp).getTime();
        if (!this.timestampIndex.has(timestamp)) {
            this.timestampIndex.set(timestamp, []);
        }
        this.timestampIndex.get(timestamp).push(log);

        if (log.component) {
            if (!this.componentIndex.has(log.component)) {
                this.componentIndex.set(log.component, []);
            }
            this.componentIndex.get(log.component).push(log);
        }

        if (!this.levelIndex.has(log.level)) {
            this.levelIndex.set(log.level, []);
        }
        this.levelIndex.get(log.level).push(log);
    }

    rotate() {
        // Keep the most recent ROTATION_SIZE logs
        const logsToKeep = this.logs.slice(-ROTATION_SIZE);
        
        // Clear all indices
        this.timestampIndex.clear();
        this.componentIndex.clear();
        this.levelIndex.clear();

        // Reset storage
        this.logs = [];

        // Re-add all logs to rebuild indices
        logsToKeep.forEach(log => this.add(log));
    }

    query(options = {}) {
        const { level, component, from, to } = options;
        let result = [];

        // Use level index if only filtering by level
        if (level && !component && !from && !to) {
            return this.levelIndex.get(level) || [];
        }

        // Use component index if only filtering by component
        if (component && !level && !from && !to) {
            return this.componentIndex.get(component) || [];
        }

        // Use timestamp index for date range queries
        if (from || to) {
            const fromTime = from ? new Date(from).getTime() : 0;
            const toTime = to ? new Date(to).getTime() : Date.now();

            // Get all timestamps within range
            for (const [timestamp, logs] of this.timestampIndex) {
                if (timestamp >= fromTime && timestamp <= toTime) {
                    result.push(...logs);
                }
            }
        } else {
            result = this.logs;
        }

        // Apply additional filters
        if (level) {
            result = result.filter(log => log.level === level);
        }
        if (component) {
            result = result.filter(log => log.component === component);
        }

        return result;
    }
}

// Only initialize logging if not disabled
const logStore = process.env.DISABLE_LOGGING ? null : new LogStore();

// Create a custom transport that stores logs in memory
class MemoryTransport extends winston.Transport {
    constructor(opts) {
        super(opts);
        this.name = 'memory';
    }

    log(info, callback) {
        try {
            const logEntry = {
                level: info.level,
                message: info.message,
                timestamp: info.timestamp,
                component: info.component,
                ...info
            };
            logStore.add(logEntry);
            callback();
        } catch (err) {
            console.error('Failed to store log:', err);
            callback();
        }
    }
}

// Create custom file transport with proper file descriptor handling
class SafeFileTransport extends winston.Transport {
    constructor(options) {
        super(options);
        this.name = 'safeFile';
        this.filename = options.filename;
        this._fileHandle = null;
    }

    async log(info, callback) {
        try {
            if (!this._fileHandle) {
                this._fileHandle = await fs.promises.open(this.filename, 'a');
            }
            await this._fileHandle.writeFile(JSON.stringify(info) + '\n');
            callback();
        } catch (err) {
            callback(err);
        }
    }

    async close() {
        if (this._fileHandle) {
            await this._fileHandle.close();
            this._fileHandle = null;
        }
    }
}

// Create file transport if logging is enabled and not in development
const fileTransport = process.env.DISABLE_LOGGING || process.env.NODE_ENV === 'development' ? null : new SafeFileTransport({
    filename: LOG_FILE,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    )
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: process.env.DISABLE_LOGGING ? [
        // Use a silent transport during tests to avoid warnings
        new winston.transports.Console({ silent: true })
    ] : [
        new winston.transports.Console(),
        new MemoryTransport(),
        ...(fileTransport ? [fileTransport] : [])
    ]
});

// Add query capabilities
logger.query = async (options = {}) => {
    const { level, component, from, to, fail } = options;

    // For testing error cases
    if (fail === true) {
        throw new Error('Query failed');
    }

    try {
        if (process.env.DISABLE_LOGGING) {
            // Return empty results when logging is disabled
            return Promise.resolve({
                info: [],
                error: []
            });
        }

        // Query logs using the store
        const filteredLogs = logStore.query({ level, component, from, to });

        // Group logs by level for API compatibility
        const result = {
            info: filteredLogs.filter(log => log.level === 'info'),
            error: filteredLogs.filter(log => log.level === 'error')
        };

        return Promise.resolve(result);
    } catch (err) {
        console.error('Failed to query logs:', err);
        throw new Error('Failed to query logs');
    }
};

export default logger;