class WalletManager {
    constructor() {
        this.walletsContainer = document.getElementById('wallets-container');
        this.modal = document.getElementById('wallet-details-modal');
        this.setupModalListeners();
        this.loadWallets();
    }

    setupModalListeners() {
        // Close modal when clicking the X button
        const closeBtn = this.modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.closeModal());

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }

    async loadWallets() {
        try {
            const response = await fetch('/api/register/wallets');
            if (!response.ok) {
                throw new Error('Failed to load wallets');
            }

            const wallets = await response.json();
            this.displayWallets(wallets.wallets);
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.walletsContainer.innerHTML = '<p class="error">Failed to load wallets</p>';
        }
    }

    displayWallets(wallets) {
        this.walletsContainer.innerHTML = '';
        
        wallets.forEach(wallet => {
            const walletElement = document.createElement('div');
            walletElement.className = 'wallet-item';
            walletElement.innerHTML = `
                <span>${this.formatAddress(wallet.address)}</span>
                <span>${this.formatBalance(wallet.balance)} VIG</span>
                <span>
                    <button onclick="walletManager.viewWalletDetails('${wallet.address}')">Details</button>
                </span>
            `;
            this.walletsContainer.appendChild(walletElement);
        });
    }

    async viewWalletDetails(address) {
        try {
            // Get wallet details
            const detailsResponse = await fetch(`/api/register/${address}`);
            if (!detailsResponse.ok) throw new Error('Failed to load wallet details');
            const wallet = await detailsResponse.json();

            // Get wallet transactions
            const txResponse = await fetch(`/api/transactions/wallet/${address}`);
            if (!txResponse.ok) throw new Error('Failed to load transactions');
            const transactions = await txResponse.json();

            this.displayWalletDetails(wallet, transactions);
            this.openModal();
        } catch (error) {
            console.error('Error loading wallet details:', error);
        }
    }

    displayWalletDetails(wallet, transactions) {
        const modalContent = this.modal.querySelector('.modal-content');
        
        // Update wallet info
        modalContent.querySelector('.wallet-address').textContent = wallet.address;
        modalContent.querySelector('.wallet-balance').textContent = this.formatBalance(wallet.balance);
        modalContent.querySelector('.wallet-created').textContent = new Date(wallet.createdAt).toLocaleString();

        // Update transactions
        const transactionsList = modalContent.querySelector('.transactions-list');
        transactionsList.innerHTML = transactions.length ? '' : '<p>No transactions found</p>';

        transactions.forEach(tx => {
            const txElement = document.createElement('div');
            txElement.className = 'transaction-item';
            txElement.innerHTML = `
                <p>Type: ${tx.from === wallet.address ? 'Sent' : 'Received'}</p>
                <p>${tx.from === wallet.address ? 'To' : 'From'}: ${this.formatAddress(tx.from === wallet.address ? tx.to : tx.from)}</p>
                <p>Amount: ${this.formatBalance(tx.amount)} VIG</p>
                <p>Time: ${new Date(tx.timestamp).toLocaleString()}</p>
            `;
            transactionsList.appendChild(txElement);
        });
    }

    formatAddress(address) {
        return address.substring(0, 8) + '...' + address.substring(address.length - 8);
    }

    formatBalance(balance) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(balance);
    }

    openModal() {
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Initialize wallet manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});