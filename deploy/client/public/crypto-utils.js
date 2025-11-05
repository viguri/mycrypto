class CryptoUtils {
    static async hash(data) {
        const msgBuffer = new TextEncoder().encode(JSON.stringify(data));
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async sign(data, privateKey) {
        const msgBuffer = new TextEncoder().encode(JSON.stringify(data));
        const signature = await window.crypto.subtle.sign(
            {
                name: "ECDSA",
                hash: { name: "SHA-256" },
            },
            privateKey,
            msgBuffer
        );
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static async verify(signature, data, publicKey) {
        try {
            const msgBuffer = new TextEncoder().encode(JSON.stringify(data));
            const signatureBuffer = new Uint8Array(
                signature.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
            
            return await window.crypto.subtle.verify(
                {
                    name: "ECDSA",
                    hash: { name: "SHA-256" },
                },
                publicKey,
                signatureBuffer,
                msgBuffer
            );
        } catch (error) {
            console.error('Verification failed:', error);
            return false;
        }
    }

    static generateNonce() {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0].toString(16);
    }

    static async createKeyPair() {
        try {
            return await window.crypto.subtle.generateKey(
                {
                    name: "ECDSA",
                    namedCurve: "P-256"
                },
                true,
                ["sign", "verify"]
            );
        } catch (error) {
            console.error('Key pair generation failed:', error);
            throw error;
        }
    }

    static formatAddress(address) {
        if (!address || typeof address !== 'string') {
            return '';
        }
        const start = address.slice(0, 8);
        const end = address.slice(-8);
        return `${start}...${end}`;
    }

    static formatAmount(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(amount);
    }
    
    static async aliasToAddress(alias) {
        try {
            // Add a prefix to distinguish aliases from direct addresses
            const aliasData = `alias:${alias.toLowerCase()}`;
            const address = await this.hash(aliasData);
            return address;
        } catch (error) {
            console.error('Failed to convert alias to address:', error);
            throw error;
        }
    }
}

// Export for browser
window.CryptoUtils = CryptoUtils;