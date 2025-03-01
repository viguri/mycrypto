import crypto from 'crypto';

class CryptoService {
    /**
     * Generate a new keypair and return the public key as wallet address
     */
    static async generateKeyPair() {
        try {
            const { publicKey } = crypto.generateKeyPairSync('rsa', {
                modulusLength: 2048,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'der'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'der'
                }
            });

            // Use the hash of the public key as the wallet address
            return crypto.createHash('sha256')
                .update(publicKey)
                .digest('hex');
        } catch (error) {
            throw new Error('Failed to generate wallet address: ' + error.message);
        }
    }

    /**
     * Generate hash for a block
     */
    static async generateBlockHash(block) {
        try {
            const blockString = JSON.stringify({
                index: block.index,
                timestamp: block.timestamp,
                merkleRoot: block.merkleRoot,
                previousHash: block.previousHash,
                nonce: block.nonce
            });

            return crypto.createHash('sha256')
                .update(blockString)
                .digest('hex');
        } catch (error) {
            throw new Error('Failed to generate block hash: ' + error.message);
        }
    }

    /**
     * Generate hash for a transaction
     */
    static generateTransactionHash(transaction) {
        try {
            const txString = JSON.stringify({
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                timestamp: transaction.timestamp,
                nonce: transaction.nonce
            });

            return crypto.createHash('sha256')
                .update(txString)
                .digest('hex');
        } catch (error) {
            throw new Error('Failed to generate transaction hash: ' + error.message);
        }
    }

    /**
     * Generate a simple hash for any input
     */
    static hash(data) {
        try {
            return crypto.createHash('sha256')
                .update(typeof data === 'string' ? data : JSON.stringify(data))
                .digest('hex');
        } catch (error) {
            throw new Error('Failed to generate hash: ' + error.message);
        }
    }
}

export default CryptoService;