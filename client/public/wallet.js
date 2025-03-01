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
            
            const response = await fetch('/api/registration/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response format');
            }

            const data = await response.json();
            console.log('Server response:', data);
            if (!response.ok) {
                throw new Error(data.message || 'Failed to create wallet');
            }

            console.log('Wallet created:', data);

            const wallet = new Wallet();
            wallet.address = data.wallet?.address || data.address;
            wallet.balance = data.wallet?.balance || data.balance;
            wallet.createdAt = data.wallet?.createdAt || data.createdAt;

            // Save to local storage
            localStorage.setItem('wallet', JSON.stringify({
                address: wallet.address,
                balance: wallet.balance,
                createdAt: wallet.createdAt
            }));

            return wallet;
        } catch (error) {
            console.error('Wallet creation failed:', error);
            if (error.name === 'SyntaxError') {
                throw new Error('Server returned invalid data format');
            }
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
            
            const response = await fetch(`/api/registration/${data.address}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response format');
            }

            const walletData = await response.json();

            if (!response.ok) {
                localStorage.removeItem('wallet');
                throw new Error(walletData.message || 'Failed to load wallet');
            }

            const wallet = new Wallet();
            wallet.address = walletData.address;
            wallet.balance = walletData.balance;
            wallet.createdAt = walletData.createdAt;
            
            return wallet;
        } catch (error) {
            console.error('Failed to load wallet:', error);
            localStorage.removeItem('wallet');
            if (error.name === 'SyntaxError') {
                throw new Error('Server returned invalid data format');
            }
            return null;
        }
    }

    async getBalance() {
        try {
            if (!this.address) {
                throw new Error('Wallet not initialized');
            }

            const response = await fetch(`/api/registration/${this.address}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response format');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to get wallet info');
            }

            this.balance = data.balance;
            return this.balance;
        } catch (error) {
            console.error('Failed to get balance:', error);
            if (error.name === 'SyntaxError') {
                throw new Error('Server returned invalid data format');
            }
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
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    from: this.address,
                    to,
                    amount: parseFloat(amount)
                })
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response format');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Transaction failed');
            }

            const transaction = data;
            
            // Auto-mine the transaction
            await this.mineTransaction();
            
            // Update balance after transaction
            await this.getBalance();
            
            return transaction;
        } catch (error) {
            console.error('Transaction failed:', error);
            if (error.name === 'SyntaxError') {
                throw new Error('Server returned invalid data format');
            }
            throw error;
        }
    }

    async mineTransaction() {
        try {
            const response = await fetch('/api/mining/mine', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            });

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned invalid response format');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Mining failed');
            }

            return data;
        } catch (error) {
            console.error('Mining failed:', error);
            if (error.name === 'SyntaxError') {
                throw new Error('Server returned invalid data format');
            }
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