class Wallet {
    constructor() {
        this.address = null;
        this.balance = 0;
        this.transactions = [];
        this.createdAt = null;
    }

    static async create() {
        try {
            console.log('Creating new wallet...');
            
            const response = await fetch('/api/register/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create wallet');
            }

            const data = await response.json();
            console.log('Wallet created:', data);

            const wallet = new Wallet();
            wallet.address = data.wallet.address;
            wallet.balance = data.wallet.balance;
            wallet.createdAt = data.wallet.createdAt;

            // Save to local storage
            localStorage.setItem('wallet', JSON.stringify({
                address: wallet.address,
                balance: wallet.balance,
                createdAt: wallet.createdAt
            }));

            return wallet;
        } catch (error) {
            console.error('Wallet creation failed:', error);
            throw error;
        }
    }

    static async load() {
        try {
            const stored = localStorage.getItem('wallet');
            if (!stored) {
                return null;
            }

            const data = JSON.parse(stored);
            
            // Verify wallet still exists on blockchain
            const response = await fetch(`/api/register/${data.address}`);
            if (!response.ok) {
                localStorage.removeItem('wallet');
                return null;
            }

            const walletData = await response.json();
            const wallet = new Wallet();
            wallet.address = walletData.address;
            wallet.balance = walletData.balance;
            wallet.createdAt = walletData.createdAt;
            
            return wallet;
        } catch (error) {
            console.error('Failed to load wallet:', error);
            localStorage.removeItem('wallet');
            return null;
        }
    }

    async getBalance() {
        try {
            if (!this.address) {
                throw new Error('Wallet not initialized');
            }

            const response = await fetch(`/api/register/${this.address}`);
            if (!response.ok) {
                throw new Error('Failed to get wallet info');
            }

            const data = await response.json();
            this.balance = data.balance;
            return this.balance;
        } catch (error) {
            console.error('Failed to get balance:', error);
            throw error;
        }
    }

    async sendTransaction(to, amount) {
        try {
            if (!this.address) {
                throw new Error('Wallet not initialized');
            }

            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: this.address,
                    to,
                    amount: parseFloat(amount)
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Transaction failed');
            }

            const transaction = await response.json();
            
            // Update balance after transaction
            await this.getBalance();
            
            return transaction;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    formatAddress() {
        if (!this.address) return '';
        return this.address.substring(0, 8) + '...' + this.address.substring(this.address.length - 8);
    }

    formatBalance() {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(this.balance);
    }
}

// Export for browser
window.Wallet = Wallet;