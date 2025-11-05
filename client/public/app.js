class App {
    constructor() {
        this.wallet = null;
        this.initElements();
        this.loadWallet();
        this.attachEventListeners();
        this.startPolling();
    }

    initElements() {
        this.elements = {
            createWalletBtn: document.getElementById('create-wallet'),
            walletInfo: document.getElementById('wallet-info'),
            walletDetails: document.getElementById('wallet-details'),
            walletAddress: document.getElementById('wallet-address'),
            walletBalance: document.getElementById('wallet-balance'),
            transactionSection: document.getElementById('transaction-section'),
            sendForm: document.getElementById('send-form'),
            blockCount: document.getElementById('block-count'),
            pendingCount: document.getElementById('pending-count'),
            statusMessage: document.getElementById('status-message')
        };
    }

    async loadWallet() {
        try {
            this.wallet = await Wallet.load();
            if (this.wallet) {
                this.updateWalletUI();
                this.showMessage('Wallet loaded successfully', 'success');
            }
        } catch (error) {
            console.error('Failed to load wallet:', error);
            this.showMessage('Failed to load wallet: ' + error.message, 'error');
        }
    }

    updateWalletUI() {
        if (this.wallet) {
            this.elements.walletAddress.textContent = this.wallet.formatAddress();
            this.elements.walletBalance.textContent = this.wallet.formatBalance();
            this.elements.walletInfo.style.display = 'none';
            this.elements.walletDetails.style.display = 'block';
            this.elements.transactionSection.style.display = 'block';
        } else {
            this.elements.walletInfo.style.display = 'block';
            this.elements.walletDetails.style.display = 'none';
            this.elements.transactionSection.style.display = 'none';
        }
    }

    attachEventListeners() {
        // Wallet creation
        this.elements.createWalletBtn.addEventListener('click', () => this.createWallet());

        // Send transaction
        this.elements.sendForm.addEventListener('submit', (e) => this.handleSendTransaction(e));
    }

    async createWallet() {
        try {
            this.showMessage('Creating wallet...', 'pending');
            this.elements.createWalletBtn.disabled = true;

            this.wallet = await Wallet.create();
            this.updateWalletUI();
            this.showMessage('Wallet created successfully!', 'success');

        } catch (error) {
            console.error('Failed to create wallet:', error);
            this.showMessage('Failed to create wallet: ' + error.message, 'error');
        } finally {
            this.elements.createWalletBtn.disabled = false;
        }
    }

    async handleSendTransaction(e) {
        e.preventDefault();

        if (!this.wallet) {
            this.showMessage('No wallet available', 'error');
            return;
        }

        const form = e.target;
        const recipient = form.recipient.value;
        const amount = parseFloat(form.amount.value);

        if (amount <= 0) {
            this.showMessage('Amount must be greater than 0', 'error');
            return;
        }

        const submitButton = form.querySelector('button');
        submitButton.disabled = true;

        try {
            this.showMessage('Processing transaction...', 'pending');

            // Check if recipient exists
            try {
                await ApiClient.get(`/api/registration/${recipient}`);
            } catch (error) {
                // Try to resolve as alias
                const aliasCheck = await ApiClient.get(`/api/registration/${recipient}`);
                if (!aliasCheck) {
                    throw new Error('Invalid recipient address or alias');
                }
            }

            await this.wallet.sendTransaction(recipient, amount);
            
            form.reset();
            await this.wallet.getBalance();
            this.updateWalletUI();
            
            this.showMessage('Transaction completed successfully!', 'success');

        } catch (error) {
            console.error('Transaction failed:', error);
            this.showMessage('Failed to send transaction: ' + error.message, 'error');
        } finally {
            submitButton.disabled = false;
        }
    }

    showMessage(message, type) {
        if (!this.elements.statusMessage) return;
        
        this.elements.statusMessage.textContent = message;
        this.elements.statusMessage.className = `status-message ${type}`;
        this.elements.statusMessage.style.display = 'block';

        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                this.elements.statusMessage.style.display = 'none';
            }, 5000);
        }
    }

    startPolling() {
        // Update blockchain info every 5 seconds
        setInterval(async () => {
            try {
                const blockchainData = await ApiClient.get('/api/blockchain');
                
                // Check if blockchain data is valid
                if (blockchainData && typeof blockchainData === 'object') {
                    // Use stats if available, otherwise count chain length
                    if (blockchainData.stats) {
                        this.elements.blockCount.textContent = blockchainData.stats.blockCount || '0';
                        this.elements.pendingCount.textContent = blockchainData.stats.pendingCount || '0';
                    } else if (blockchainData.chain && Array.isArray(blockchainData.chain)) {
                        this.elements.blockCount.textContent = blockchainData.chain.length.toString();
                        this.elements.pendingCount.textContent = 
                            (blockchainData.pendingTransactions && Array.isArray(blockchainData.pendingTransactions)) 
                                ? blockchainData.pendingTransactions.length.toString() 
                                : '0';
                    } else {
                        throw new Error('Invalid blockchain data format');
                    }
                } else {
                    throw new Error('Invalid response from blockchain API');
                }
                
                // Update wallet balance if exists
                if (this.wallet) {
                    await this.wallet.getBalance();
                    this.elements.walletBalance.textContent = this.wallet.formatBalance();
                }
            } catch (error) {
                console.error('Failed to update status:', error);
                // Set default values on error
                this.elements.blockCount.textContent = '0';
                this.elements.pendingCount.textContent = '0';
            }
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});