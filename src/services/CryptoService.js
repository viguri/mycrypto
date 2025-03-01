const crypto = require('crypto');
const logger = require('../utils/logger');

class CryptoService {
    /**
     * Hash data using SHA-256
     */
    static hash(data) {
        try {
            const stringData = typeof data === 'string' ? data : JSON.stringify(data);
            const hash = crypto.createHash('sha256').update(stringData).digest('hex');
            
            logger.info('Data hashed successfully', {
                component: 'crypto',
                dataType: typeof data,
                hashLength: hash.length
            });

            return hash;
        } catch (error) {
            logger.error('Hashing failed', {
                component: 'crypto',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Validate address format
     */
    static isValidAddress(address) {
        try {
            return typeof address === 'string' && /^[0-9a-f]{64}$/i.test(address);
        } catch {
            return false;
        }
    }

    /**
     * Generate transaction hash
     */
    static generateTransactionHash(transaction) {
        const data = {
            from: transaction.from,
            to: transaction.to,
            amount: transaction.amount,
            timestamp: transaction.timestamp,
            nonce: transaction.nonce
        };
        return this.hash(data);
    }

    /**
     * Generate block hash
     */
    static generateBlockHash(block) {
        const data = {
            previousHash: block.previousHash,
            timestamp: block.timestamp,
            transactions: block.transactions,
            nonce: block.nonce
        };
        return this.hash(data);
    }
}

module.exports = CryptoService;