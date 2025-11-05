import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../../utils/logger/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class BlockchainStorage {
    constructor() {
        this.storagePath = __dirname;
        this.chainFile = path.join(this.storagePath, 'chain.json');
        this.walletsFile = path.join(this.storagePath, 'wallets.json');
        this.pendingFile = path.join(this.storagePath, 'pending.json');
    }

    async initialize() {
        try {
            // Ensure storage directory exists
            await fs.mkdir(this.storagePath, { recursive: true });

            // Initialize empty files if they don't exist
            await Promise.all([
                this.initializeFile(this.chainFile, '[]'),
                this.initializeFile(this.walletsFile, '[]'),
                this.initializeFile(this.pendingFile, '[]')
            ]);

            logger.info('Blockchain storage initialized', {
                component: 'storage',
                path: this.storagePath
            });
        } catch (error) {
            logger.error('Failed to initialize storage', {
                component: 'storage',
                error: error.message
            });
            throw error;
        }
    }

    async initializeFile(filePath, defaultContent) {
        try {
            await fs.access(filePath);
        } catch {
            await fs.writeFile(filePath, defaultContent);
        }
    }

    async loadState() {
        try {
            const [chain, wallets, pending] = await Promise.all([
                this.readFile(this.chainFile),
                this.readFile(this.walletsFile),
                this.readFile(this.pendingFile)
            ]);

            logger.info('Chain loaded', {
                component: 'storage',
                blocks: chain.length
            });

            logger.info('Wallets loaded', {
                component: 'storage',
                count: wallets.length
            });

            logger.info('Pending transactions loaded', {
                component: 'storage',
                count: pending.length
            });

            return {
                chain: chain || [],
                wallets: wallets || [],
                pendingTransactions: pending || []
            };
        } catch (error) {
            logger.error('Failed to load blockchain state', {
                component: 'storage',
                error: error.message
            });
            throw error;
        }
    }

    async saveState(state) {
        try {
            await Promise.all([
                this.writeFile(this.chainFile, state.chain),
                this.writeFile(this.walletsFile, state.wallets),
                this.writeFile(this.pendingFile, state.pendingTransactions)
            ]);

            logger.info('Blockchain state saved', {
                component: 'storage',
                blocks: state.chain.length,
                wallets: state.wallets.length,
                pending: state.pendingTransactions.length
            });
        } catch (error) {
            logger.error('Failed to save blockchain state', {
                component: 'storage',
                error: error.message
            });
            throw error;
        }
    }

    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async writeFile(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
}

export default BlockchainStorage;