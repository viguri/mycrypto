import crypto from 'crypto';

class CryptoService {
    async generateKeyPair() {
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });

        // Generate an address from the public key
        const address = this.hash(publicKey);
        return address;
    }

    getPublicKey() {
        return 'public-key'; // Simplified for testing
    }

    getPrivateKey() {
        return 'private-key'; // Simplified for testing
    }

    sign(data, privateKey) {
        const sign = crypto.createSign('SHA256');
        sign.update(data);
        return sign.sign(privateKey, 'hex');
    }

    verify(data, signature, publicKey) {
        const verify = crypto.createVerify('SHA256');
        verify.update(data);
        return verify.verify(publicKey, signature, 'hex');
    }

    hash(data) {
        return crypto
            .createHash('sha256')
            .update(typeof data === 'string' ? data : JSON.stringify(data))
            .digest('hex');
    }

    async generateBlockHash(block) {
        // Create a copy without the hash field
        const blockData = {
            ...block,
            hash: undefined
        };
        return this.hash(blockData);
    }

    generateTransactionHash(transaction) {
        // Create a copy without the hash field
        const txData = {
            ...transaction,
            hash: undefined
        };
        return this.hash(txData);
    }
}

// Export singleton instance
const cryptoService = new CryptoService();
export default cryptoService;