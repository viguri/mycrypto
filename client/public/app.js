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
            pendingCount: document.getElementById('pending-count')
        };
    }

    async loadWallet() {
        try {
            this.wallet = await Wallet.load();
            if (this.wallet) {
                this.updateWalletUI();
            }
        } catch (error) {
            console.error('Failed to load wallet:', error);
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
            this.elements.createWalletBtn.disabled = true;
            this.elements.createWalletBtn.textContent = 'Creating...';

            this.wallet = await Wallet.create();
            this.updateWalletUI();

        } catch (error) {
            console.error('Failed to create wallet:', error);
            alert('Failed to create wallet: ' + error.message);
        } finally {
            this.elements.createWalletBtn.disabled = false;
            this.elements.createWalletBtn.textContent = 'Create New Wallet';
        }
    }

    async handleSendTransaction(e) {
        e.preventDefault();

        if (!this.wallet) {
            alert('No wallet available');
            return;
        }

        const form = e.target;
        const recipient = form.recipient.value;
        const amount = parseFloat(form.amount.value);

        if (amount <= 0) {
            alert('Amount must be greater than 0');
            return;
        }

        let recipientAddress;
        try {
            // Convert alias to address if it's not already a valid address
            recipientAddress = /^[0-9a-f]{64}$/i.test(recipient) 
                ? recipient 
                : await CryptoUtils.aliasToAddress(recipient);
        } catch (error) {
            alert('Failed to process recipient address or alias');
            return;
        }

        try {
            form.querySelector('button').disabled = true;
            await this.wallet.sendTransaction(recipientAddress, amount);
            
            form.reset(); // Clear the form
            await this.wallet.getBalance();
            this.updateWalletUI();
            
            alert('Transaction sent successfully!');

        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Failed to send transaction: ' + error.message);
        } finally {
            form.querySelector('button').disabled = false;
        }
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