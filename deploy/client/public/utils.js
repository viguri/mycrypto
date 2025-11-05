// Wallet management
class Wallet {
    constructor(address, publicKey, privateKey) {
        this.address = address;
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    static fromStorage(address) {
        const data = localStorage.getItem(`wallet_${address}`);
        if (!data) return null;
        const { publicKey, privateKey } = JSON.parse(data);
        return new Wallet(address, publicKey, privateKey);
    }

    save() {
        localStorage.setItem(`wallet_${this.address}`, JSON.stringify({
            publicKey: this.publicKey,
            privateKey: this.privateKey
        }));
    }

    static list() {
        const wallets = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('wallet_')) {
                const address = key.replace('wallet_', '');
                const wallet = Wallet.fromStorage(address);
                if (wallet) wallets.push(wallet);
            }
        }
        return wallets;
    }
}

const cryptoUtils = {
    // Generate test address for transactions
    generateTestAddress() {
        // Generate a random 40-character hex string
        return Array.from(
            { length: 40 },
            () => Math.floor(Math.random() * 16).toString(16)
        ).join('');
    },
    
    // Convert ArrayBuffer to Base64 string
    arrayBufferToBase64(buffer) {
        const binary = String.fromCharCode.apply(null, new Uint8Array(buffer));
        return window.btoa(binary);
    },

    // Format key as PEM
    formatAsPEM(base64Data, type) {
        const wrappedLines = base64Data.match(/.{1,64}/g).join('\n');
        return `-----BEGIN ${type}-----\n${wrappedLines}\n-----END ${type}-----`;
    },

    // Generate cryptographic keys
    async generateKeyPair() {
        try {
            // Generate RSA key pair
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: { name: 'SHA-256' },
                },
                true,
                ['sign', 'verify']
            );

            // Export the keys
            const publicKeyBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
            const privateKeyBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

            // Convert to PEM format
            const publicKeyBase64 = this.arrayBufferToBase64(publicKeyBuffer);
            const privateKeyBase64 = this.arrayBufferToBase64(privateKeyBuffer);

            return {
                publicKey: this.formatAsPEM(publicKeyBase64, 'PUBLIC KEY'),
                privateKey: this.formatAsPEM(privateKeyBase64, 'PRIVATE KEY')
            };
        } catch (error) {
            console.error('Key generation failed:', error);
            throw new Error('Failed to generate cryptographic keys');
        }
    },

    // Sign transaction
    async signTransaction(privateKeyPEM, transaction) {
        try {
            console.log('Signing transaction:', transaction);
            
            // Remove PEM headers and convert to binary
            const pemHeader = '-----BEGIN PRIVATE KEY-----';
            const pemFooter = '-----END PRIVATE KEY-----';
            const pemContents = privateKeyPEM.substring(
                pemHeader.length,
                privateKeyPEM.length - pemFooter.length
            ).replace(/\n/g, '');
            
            // Convert base64 to ArrayBuffer
            const binaryDer = window.atob(pemContents);
            const privateKeyBuffer = new Uint8Array(binaryDer.length);
            for (let i = 0; i < binaryDer.length; i++) {
                privateKeyBuffer[i] = binaryDer.charCodeAt(i);
            }

            // Import the private key
            const privateKey = await window.crypto.subtle.importKey(
                'pkcs8',
                privateKeyBuffer,
                {
                    name: 'RSASSA-PKCS1-v1_5',
                    hash: { name: 'SHA-256' },
                },
                false,
                ['sign']
            );

            // Ensure consistent ordering of properties for signature
            const transactionToSign = {
                fromAddress: transaction.fromAddress,
                toAddress: transaction.toAddress,
                amount: transaction.amount
            };
            
            const transactionData = new TextEncoder().encode(
                JSON.stringify(transactionToSign, Object.keys(transactionToSign).sort())
            );

            const signature = await window.crypto.subtle.sign(
                'RSASSA-PKCS1-v1_5',
                privateKey,
                transactionData
            );
            
            // Convert signature to hex string
            const hexSignature = Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            
            console.log('Generated signature:', hexSignature);
            return hexSignature;
        } catch (error) {
            console.error('Transaction signing failed:', error);
            throw new Error('Failed to sign transaction');
        }
    }
};

const api = {
    async createWallet() {
        try {
            // Generate key pair
            const { publicKey, privateKey } = await cryptoUtils.generateKeyPair();
            console.log('Generated key pair:', {
                publicKey: publicKey.substring(0, 64) + '...',
                privateKey: 'hidden'
            });

            // Register with blockchain
            const response = await fetch('http://localhost:8080/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ publicKey })
            });

            const responseText = await response.text();
            console.log('Registration response:', responseText);

            if (!response.ok) {
                const error = JSON.parse(responseText);
                throw new Error(error.message || `Registration failed: ${response.status}`);
            }

            const registrationResult = JSON.parse(responseText);
            if (!registrationResult.address) {
                throw new Error('Registration response missing address');
            }

            console.log('Wallet registered:', registrationResult);

            // Create and save wallet
            const wallet = new Wallet(registrationResult.address, publicKey, privateKey);
            wallet.save();

            return wallet;
        } catch (error) {
            console.error('Wallet creation failed:', error);
            throw new Error('Failed to create wallet: ' + (error.message || 'Unknown error'));
        }
    }
};

// Export to window
window.utils = {
    Wallet,
    api,
    cryptoUtils
};
