class WalletManager {
    constructor() {
        this.walletsContainer = document.getElementById('wallets-container');
        this.modal = document.getElementById('wallet-details-modal');
        this.isAdmin = false;
        this.setupModalListeners();
        this.loadWallets();
    }

    setupModalListeners() {
        const closeBtn = this.modal.querySelector('.close-modal');
        closeBtn.addEventListener('click', () => this.closeModal());

        window.addEventListener('click', (event) => {
            if (event.target === this.modal) {
                this.closeModal();
            }
        });
    }

    async loadWallets() {
        try {
            const walletsResponse = await fetch('/api/registration/wallets');
            if (!walletsResponse.ok) {
                throw new Error('Failed to load wallets');
            }

            const data = await walletsResponse.json();
            this.displayWallets(data.wallets);
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.walletsContainer.innerHTML = '<p class="error">Failed to load wallets</p>';
        }
    }

    displayWallets(wallets) {
        this.walletsContainer.innerHTML = '';
        let activeWalletCount = 0;
        
        wallets.forEach(wallet => {
            if (!wallet) return;
            const isMainWallet = wallet.address === 'main_wallet';
            if (!isMainWallet) activeWalletCount++;

            const walletElement = document.createElement('div');
            walletElement.className = 'wallet-item';

            walletElement.innerHTML = `
                <span>${isMainWallet ? 'Main Wallet' : this.formatAddress(wallet.address)}</span>
                <span>${this.formatBalance(wallet.balance)} VIG</span>
                <span class="wallet-actions">
                    <button onclick="walletManager.viewWalletDetails('${wallet.address}')">
                        ${isMainWallet ? 'View Main Wallet' : 'Details'}
                    </button>
                    ${this.isAdmin && !isMainWallet ? `
                        <button class="delete-btn" onclick="walletManager.deleteWallet('${wallet.address}')">
                            Delete
                        </button>
                    ` : ''}
                </span>
            `;
            this.walletsContainer.appendChild(walletElement);
        });

        document.getElementById('wallet-count').textContent = activeWalletCount;
    }

    async deleteWallet(address) {
        if (!this.isAdmin) {
            alert('Admin privileges required');
            return;
        }

        if (!confirm(`Are you sure you want to delete wallet ${this.formatAddress(address)}?\nAll funds will be transferred to the main wallet.`)) {
            return;
        }

        try {
            const deleteResponse = await fetch(`/api/registration/${address}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin: this.isAdmin })
            });

            if (!deleteResponse.ok) {
                throw new Error('Failed to delete wallet');
            }

            // Reload wallets to update the UI
            await this.loadWallets();
            
        } catch (error) {
            console.error('Failed to delete wallet:', error);
            alert('Failed to delete wallet: ' + error.message);
        }
    }

    async viewWalletDetails(address) {
        try {
            const [walletResponse, txResponse] = await Promise.all([
                fetch(`/api/registration/${address}`),
                fetch(`/api/transactions/wallet/${address}`)
            ]);

            if (!walletResponse.ok || !txResponse.ok) {
                throw new Error('Failed to load wallet details');
            }

            const wallet = await walletResponse.json();
            const transactions = await txResponse.json();

            this.displayWalletDetails(wallet, transactions);
            this.openModal();
        } catch (error) {
            console.error('Error loading wallet details:', error);
            alert('Failed to load wallet details: ' + error.message);
        }
    }

    displayWalletDetails(wallet, transactions) {
        const modalContent = this.modal.querySelector('.modal-content');
        
        modalContent.querySelector('.wallet-address').textContent = 
            wallet.address === 'main_wallet' ? 'Main Wallet' : wallet.address;
        modalContent.querySelector('.wallet-balance').textContent = this.formatBalance(wallet.balance);
        modalContent.querySelector('.wallet-created').textContent = new Date(wallet.createdAt).toLocaleString();

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
                <p>Status: ${tx.status}</p>
            `;
            transactionsList.appendChild(txElement);
        });
    }

    formatAddress(address) {
        if (address === 'main_wallet') return 'Main Wallet';
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
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    setAdmin(isAdmin) {
        this.isAdmin = isAdmin;
        this.loadWallets();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});
