const CryptoService = require('../services/CryptoService');
const logger = require('../utils/logger');

class Block {
    /**
     * Create a new block
     * @param {number} timestamp - Block creation timestamp
     * @param {Transaction[]} transactions - Array of transactions
     * @param {string} previousHash - Hash of the previous block
     */
    constructor(timestamp, transactions, previousHash = '') {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = this.calculateHash();
        this.merkleRoot = this.calculateMerkleRoot();

        logger.info('New block created', {
            timestamp,
            transactionCount: transactions.length,
            hash: this.hash,
            previousHash,
            merkleRoot: this.merkleRoot,
            source: 'block'
        });
    }

    /**
     * Calculate block hash
     * @returns {string} Block hash
     */
    calculateHash() {
        const hash = CryptoService.hash({
            previousHash: this.previousHash,
            timestamp: this.timestamp,
            merkleRoot: this.merkleRoot,
            nonce: this.nonce
        });

        logger.info('Block hash calculated', {
            hash,
            nonce: this.nonce,
            source: 'block'
        });

        return hash;
    }

    /**
     * Calculate Merkle root of transactions
     * @returns {string} Merkle root hash
     */
    calculateMerkleRoot() {
        if (this.transactions.length === 0) {
            const emptyHash = CryptoService.hash('');
            logger.info('Empty Merkle root calculated', {
                hash: emptyHash,
                source: 'block'
            });
            return emptyHash;
        }
        
        let hashes = this.transactions.map(tx => tx.calculateHash());
        logger.info('Initial transaction hashes calculated', {
            count: hashes.length,
            source: 'block'
        });
        
        while (hashes.length > 1) {
            const newHashes = [];
            for (let i = 0; i < hashes.length; i += 2) {
                const left = hashes[i];
                const right = i + 1 < hashes.length ? hashes[i + 1] : left;
                const combined = CryptoService.hash(left + right);
                newHashes.push(combined);
            }
            hashes = newHashes;

            logger.info('Merkle tree level processed', {
                remainingHashes: hashes.length,
                source: 'block'
            });
        }
        
        logger.info('Merkle root calculated', {
            root: hashes[0],
            source: 'block'
        });

        return hashes[0];
    }

    /**
     * Mine block with proof of work
     * @param {number} difficulty - Number of leading zeros required
     */
    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join('0');
        const startTime = Date.now();
        
        logger.info('Starting block mining', {
            difficulty,
            target,
            initialHash: this.hash,
            source: 'block'
        });

        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash();

            if (this.nonce % 100000 === 0) {
                logger.info('Mining progress', {
                    nonce: this.nonce,
                    currentHash: this.hash,
                    source: 'block'
                });
            }
        }

        const endTime = Date.now();
        logger.info('Block successfully mined', {
            finalHash: this.hash,
            nonce: this.nonce,
            timeSpent: endTime - startTime,
            source: 'block'
        });
    }

    /**
     * Verify all transactions in the block
     * @param {Map<string, string>} publicKeys - Map of addresses to public keys
     * @returns {boolean} Whether all transactions are valid
     */
    hasValidTransactions(publicKeys) {
        try {
            for (const tx of this.transactions) {
                if (!tx.isValid(publicKeys.get(tx.fromAddress))) {
                    logger.error('Invalid transaction found in block', {
                        transactionFrom: tx.fromAddress,
                        transactionTo: tx.toAddress,
                        amount: tx.amount,
                        source: 'block'
                    });
                    return false;
                }
            }

            logger.info('All block transactions verified', {
                transactionCount: this.transactions.length,
                source: 'block'
            });

            return true;
        } catch (error) {
            logger.error('Error verifying block transactions', {
                error: error.message,
                stack: error.stack,
                source: 'block'
            });
            throw error;
        }
    }

    /**
     * Verify block integrity
     * @returns {boolean} Whether the block is valid
     */
    isValid() {
        try {
            // Verify hash
            const currentHash = this.calculateHash();
            if (this.hash !== currentHash) {
                logger.error('Invalid block hash', {
                    storedHash: this.hash,
                    calculatedHash: currentHash,
                    source: 'block'
                });
                return false;
            }

            // Verify Merkle root
            const currentMerkleRoot = this.calculateMerkleRoot();
            if (this.merkleRoot !== currentMerkleRoot) {
                logger.error('Invalid merkle root', {
                    storedRoot: this.merkleRoot,
                    calculatedRoot: currentMerkleRoot,
                    source: 'block'
                });
                return false;
            }

            logger.info('Block validated successfully', {
                hash: this.hash,
                merkleRoot: this.merkleRoot,
                source: 'block'
            });

            return true;
        } catch (error) {
            logger.error('Error validating block', {
                error: error.message,
                stack: error.stack,
                source: 'block'
            });
            throw error;
        }
    }
}

module.exports = Block;