const CryptoService = require('../services/CryptoService');
const logger = require('../utils/logger');

class Transaction {
    /**
     * Create a new transaction
     * @param {string} fromAddress - Sender's wallet address
     * @param {string} toAddress - Recipient's wallet address
     * @param {number} amount - Amount to transfer
     */
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.signature = null;

        logger.info('New transaction created', {
            fromAddress,
            toAddress,
            amount,
            timestamp: this.timestamp,
            source: 'transaction'
        });
    }

    /**
     * Calculate transaction hash
     * @returns {string} Transaction hash
     */
    calculateHash() {
        const hash = CryptoService.hash({
            fromAddress: this.fromAddress,
            toAddress: this.toAddress,
            amount: this.amount,
            timestamp: this.timestamp
        });

        logger.info('Transaction hash calculated', {
            hash,
            source: 'transaction'
        });

        return hash;
    }

    /**
     * Sign the transaction with given private key
     * @param {string} signingKey - Private key to sign the transaction
     * @param {string} publicKey - Public key of the sender
     */
    sign(signingKey, publicKey) {
        try {
            // Verify that the signer is the sender
            const derivedAddress = CryptoService.generateAddress(publicKey);
            if (derivedAddress !== this.fromAddress) {
                logger.error('Unauthorized signing attempt', {
                    expectedAddress: this.fromAddress,
                    actualAddress: derivedAddress,
                    source: 'transaction'
                });
                throw new Error('You cannot sign transactions for other wallets!');
            }

            // Calculate hash and sign it
            const hash = this.calculateHash();
            this.signature = CryptoService.signTransaction(signingKey, hash);

            logger.info('Transaction signed successfully', {
                hash,
                fromAddress: this.fromAddress,
                source: 'transaction'
            });
        } catch (error) {
            logger.error('Transaction signing failed', {
                error: error.message,
                stack: error.stack,
                fromAddress: this.fromAddress,
                source: 'transaction'
            });
            throw error;
        }
    }

    /**
     * Verify transaction signature and validity
     * @param {string} publicKey - Public key to verify the signature
     * @returns {boolean} Whether the transaction is valid
     */
    isValid(publicKey) {
        // Mining reward transactions don't need signatures
        if (this.fromAddress === null) {
            logger.info('Mining reward transaction validated', {
                toAddress: this.toAddress,
                amount: this.amount,
                source: 'transaction'
            });
            return true;
        }

        if (!this.signature || this.signature.length === 0) {
            logger.error('Missing transaction signature', {
                fromAddress: this.fromAddress,
                source: 'transaction'
            });
            throw new Error('No signature in this transaction');
        }

        if (this.amount <= 0) {
            logger.error('Invalid transaction amount', {
                amount: this.amount,
                fromAddress: this.fromAddress,
                source: 'transaction'
            });
            throw new Error('Transaction amount must be positive');
        }

        const isValid = CryptoService.verifySignature(
            publicKey,
            this.calculateHash(),
            this.signature
        );

        logger.info('Transaction signature verification', {
            isValid,
            fromAddress: this.fromAddress,
            source: 'transaction'
        });

        return isValid;
    }
}

module.exports = Transaction;