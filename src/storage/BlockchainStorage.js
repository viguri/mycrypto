const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class BlockchainStorage {
    constructor(basePath = 'src/storage') {
        this.basePath = basePath;
        this.chainPath = path.join(basePath, 'chain.json');
        this.walletsPath = path.join(basePath, 'wallets.json');
        this.pendingPath = path.join(basePath, 'pending.json');
    }

    async initialize() {
        try {
            // Ensure storage directory exists
            await fs.mkdir(this.basePath, { recursive: true });

            // Create empty files with default values if they don't exist
            const defaults = {
                [this.chainPath]: JSON.stringify([]),
                [this.walletsPath]: JSON.stringify({}),
                [this.pendingPath]: JSON.stringify([])
            };

            for (const [file, defaultContent] of Object.entries(defaults)) {
                try {
                    await fs.access(file);
                    // If file exists but is empty, write default content
                    const content = await fs.readFile(file, 'utf8');
                    if (!content.trim()) {
                        await fs.writeFile(file, defaultContent);
                    }
                } catch {
                    await fs.writeFile(file, defaultContent);
                    logger.info('Created storage file', {
                        component: 'storage',
                        file: path.basename(file)
                    });
                }
            }

            logger.info('Blockchain storage initialized', {
                component: 'storage',
                path: this.basePath
            });
        } catch (error) {
            logger.error('Failed to initialize storage', {
                component: 'storage',
                error: error.message,
                critical: true
            });
            throw error;
        }
    }

    async loadFile(filePath, defaultValue) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            const trimmed = data.trim();
            if (!trimmed) {
                return defaultValue;
            }
            try {
                return JSON.parse(trimmed);
            } catch (parseError) {
                logger.error('Invalid JSON in storage file', {
                    component: 'storage',
                    file: path.basename(filePath),
                    error: parseError.message
                });
                return defaultValue;
            }
        } catch (error) {
            logger.error('Failed to load file', {
                component: 'storage',
                file: path.basename(filePath),
                error: error.message
            });
            return defaultValue;
        }
    }

    async saveFile(filePath, data) {
        try {
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            logger.info('File saved', {
                component: 'storage',
                file: path.basename(filePath)
            });
        } catch (error) {
            logger.error('Failed to save file', {
                component: 'storage',
                file: path.basename(filePath),
                error: error.message
            });
            throw error;
        }
    }

    async saveChain(chain) {
        if (!Array.isArray(chain)) {
            throw new Error('Invalid chain data type');
        }
        await this.saveFile(this.chainPath, chain);
        logger.info('Chain saved', {
            component: 'storage',
            blocks: chain.length
        });
    }

    async loadChain() {
        const chain = await this.loadFile(this.chainPath, []);
        if (!Array.isArray(chain)) {
            logger.warn('Invalid chain data format, resetting', {
                component: 'storage'
            });
            return [];
        }
        logger.info('Chain loaded', {
            component: 'storage',
            blocks: chain.length
        });
        return chain;
    }

    async saveWallets(wallets) {
        if (!(wallets instanceof Map)) {
            throw new Error('Invalid wallets data type');
        }
        const walletsData = Object.fromEntries(wallets);
        await this.saveFile(this.walletsPath, walletsData);
        logger.info('Wallets saved', {
            component: 'storage',
            count: wallets.size
        });
    }

    async loadWallets() {
        const walletsData = await this.loadFile(this.walletsPath, {});
        if (typeof walletsData !== 'object') {
            logger.warn('Invalid wallets data format, resetting', {
                component: 'storage'
            });
            return new Map();
        }
        const wallets = new Map(Object.entries(walletsData));
        logger.info('Wallets loaded', {
            component: 'storage',
            count: wallets.size
        });
        return wallets;
    }

    async savePendingTransactions(transactions) {
        if (!Array.isArray(transactions)) {
            throw new Error('Invalid transactions data type');
        }
        await this.saveFile(this.pendingPath, transactions);
        logger.info('Pending transactions saved', {
            component: 'storage',
            count: transactions.length
        });
    }

    async loadPendingTransactions() {
        const transactions = await this.loadFile(this.pendingPath, []);
        if (!Array.isArray(transactions)) {
            logger.warn('Invalid pending transactions format, resetting', {
                component: 'storage'
            });
            return [];
        }
        logger.info('Pending transactions loaded', {
            component: 'storage',
            count: transactions.length
        });
        return transactions;
    }
}

module.exports = BlockchainStorage;