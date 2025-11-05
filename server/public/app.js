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

            // Add a timeout to prevent hanging UI if the server is unresponsive
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Request timed out')), 15000);
            });

            try {
                // Race between wallet creation and timeout
                this.wallet = await Promise.race([
                    Wallet.create(),
                    timeoutPromise
                ]);
                
                // Validate the wallet object
                if (!this.wallet || !this.wallet.address) {
                    throw new Error('Invalid wallet data received');
                }
                
                this.updateWalletUI();
                this.showMessage('Wallet created successfully!', 'success');
            } catch (walletError) {
                // Handle specific error types
                if (walletError.message.includes('timed out')) {
                    this.showMessage('Server is not responding. Please try again later.', 'error');
                } else if (walletError.message.includes('network') || walletError.message.includes('fetch')) {
                    this.showMessage('Network error. Please check your connection.', 'error');
                } else {
                    this.showMessage('Failed to create wallet: ' + walletError.message, 'error');
                }
                throw walletError; // Re-throw for logging
            }
        } catch (error) {
            console.error('Failed to create wallet:', error);
            // Error message already displayed in inner catch block
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
                // Check if elements exist before trying to update them
                if (!this.elements.blockCount || !this.elements.pendingCount) {
                    return; // Skip update if elements don't exist
                }
                
                try {
                    const response = await fetch('/api/blockchain');
                    if (!response.ok) {
                        throw new Error(`API responded with status: ${response.status}`);
                    }
                    
                    const blockchainData = await response.json();
                    
                    // Check if the response has the expected structure
                    if (blockchainData && blockchainData.chain && Array.isArray(blockchainData.chain)) {
                        this.elements.blockCount.textContent = blockchainData.chain.length;
                    }
                    
                    if (blockchainData && blockchainData.pendingTransactions && Array.isArray(blockchainData.pendingTransactions)) {
                        this.elements.pendingCount.textContent = blockchainData.pendingTransactions.length;
                    }
                    
                    // Update wallet balance if exists
                    if (this.wallet && typeof this.wallet.getBalance === 'function') {
                        await this.wallet.getBalance();
                        if (typeof this.wallet.formatBalance === 'function' && this.elements.walletBalance) {
                            this.elements.walletBalance.textContent = this.wallet.formatBalance();
                        }
                    }
                } catch (apiError) {
                    // Silently handle API errors to prevent console spam
                    // Only log in development mode or first occurrence
                    if (!this._hasLoggedApiError) {
                        console.error('API update error:', apiError.message);
                        this._hasLoggedApiError = true;
                    }
                }
            } catch (error) {
                // Only log critical errors that should never happen
                console.error('Critical polling error:', error);
            }
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});