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
            
            const data = await ApiClient.post('/api/registration/wallet');
            console.log('Wallet created:', data);

            const wallet = new Wallet();
            wallet.address = data.address;
            wallet.balance = data.balance;
            wallet.createdAt = data.createdAt;

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
            const walletData = await ApiClient.get(`/api/registration/${data.address}`);

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

            const data = await ApiClient.get(`/api/registration/${this.address}`);
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

            const transaction = await ApiClient.post('/api/transactions', {
                from: this.address,
                to,
                amount: parseFloat(amount)
            });
            
            // Auto-mine the transaction
            await this.mineTransaction();
            
            // Update balance after transaction
            await this.getBalance();
            
            return transaction;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    async mineTransaction() {
        try {
            const data = await ApiClient.post('/api/mining/mine');
            return data;
        } catch (error) {
            console.error('Mining failed:', error);
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