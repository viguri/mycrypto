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
            this.showMessage('Failed to load wallet: ' + this.getErrorMessage(error), 'error');
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
            this.showMessage('Failed to create wallet: ' + this.getErrorMessage(error), 'error');
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

            // Check if the recipient is a known address first
            const response = await fetch(`/api/register/${recipient}`);
            let recipientAddress;

            if (response.ok) {
                // It's a valid address
                recipientAddress = recipient;
            } else {
                // Try to convert it as an alias
                recipientAddress = await CryptoUtils.aliasToAddress(recipient);
                // Verify the generated alias address exists
                const aliasCheck = await fetch(`/api/register/${recipientAddress}`);
                if (!aliasCheck.ok) {
                    throw new Error('Invalid recipient address or alias');
                }
            }

            await this.wallet.sendTransaction(recipientAddress, amount);
            
            form.reset();
            await this.wallet.getBalance();
            this.updateWalletUI();
            
            this.showMessage('Transaction completed successfully!', 'success');

        } catch (error) {
            console.error('Transaction failed:', error);
            this.showMessage('Failed to send transaction: ' + this.getErrorMessage(error), 'error');
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

    getErrorMessage(error) {
        if (error.message.includes('<!DOCTYPE')) {
            return 'Server error. Please try again later.';
        }
        return error.message;
    }

    startPolling() {
        // Update blockchain info
        setInterval(async () => {
            try {
                const response = await fetch('/api/blockchain');
                if (!response.ok) return;
                
                const data = await response.json();
                this.elements.blockCount.textContent = data.chain.length;
                this.elements.pendingCount.textContent = data.pendingTransactions.length;
                
                // Update wallet balance if exists
                if (this.wallet) {
                    await this.wallet.getBalance();
                    this.elements.walletBalance.textContent = this.wallet.formatBalance();
                }
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});