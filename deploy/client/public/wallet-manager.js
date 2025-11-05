class WalletManager {
    constructor() {
        this.walletsContainer = document.getElementById('wallets-container');
        this.modal = document.getElementById('wallet-details-modal');
        this.statusMessage = document.getElementById('status-message');
        this.isAdmin = false;
        this.apiBaseUrl = '/api';
        this.refreshInterval = null;
        this.setupModalListeners();
        this.loadWallets();
        this.startAutoRefresh();

        // Add auto-refresh every 30 seconds
        this.startAutoRefresh();
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
            const walletsResponse = await fetch(`${this.apiBaseUrl}/registration/wallets`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            const data = await walletsResponse.json();
            
            if (!walletsResponse.ok) {
                throw new Error(data.error?.message || data.message || 'Failed to load wallets');
            }

            this.displayWallets(data.data || []);
            this.updateStatusMessage('success', 'Wallets loaded successfully');
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.showError(error.message);
            this.walletsContainer.innerHTML = `
                <div class="error-state">
                    <p class="error">${error.message}</p>
                    <button class="retry-btn" onclick="walletManager.loadWallets()">Retry</button>
                </div>`;
        }
    }

    displayWallets(wallets) {
        if (!Array.isArray(wallets)) {
            console.error('Invalid wallets data:', wallets);
            this.showError('Invalid wallet data received');
            return;
        }

        this.walletsContainer.innerHTML = '';
        let activeWalletCount = 0;
        
        wallets.forEach(wallet => {
            if (!wallet) return;
            const isMainWallet = wallet.address === 'main_wallet';
            if (!isMainWallet) activeWalletCount++;

            const walletElement = document.createElement('div');
            walletElement.className = 'wallet-item';

            walletElement.innerHTML = `
                <div class="wallet-info">
                    <span class="wallet-address">${isMainWallet ? 'Main Wallet' : this.formatAddress(wallet.address)}</span>
                    <span class="wallet-balance">${this.formatBalance(wallet.balance)} VIG</span>
                </div>
                <span class="wallet-actions">
                    <button class="view-btn" onclick="walletManager.viewWalletDetails('${wallet.address}')">
                        ${isMainWallet ? 'View Main Wallet' : 'View Details'}
                    </button>
                    ${this.isAdmin && !isMainWallet ? `
                        <button class="delete-btn" onclick="walletManager.deleteWallet('${wallet.address}')">
                            Delete Wallet
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
            this.showError('Admin privileges required to delete wallets');
            return;
        }

        if (address === 'main_wallet') {
            this.showError('Cannot delete the main wallet');
            return;
        }

        // Stop auto-refresh while showing confirmation dialog
        this.stopAutoRefresh();

        const confirmDialog = document.createElement('div');
        confirmDialog.className = 'confirm-dialog';
        confirmDialog.innerHTML = `
            <div class="confirm-content">
                <h3>Delete Wallet</h3>
                <p>Are you sure you want to delete wallet <strong>${this.formatAddress(address)}</strong>?</p>
                <p class="warning">All funds will be transferred to the main wallet.</p>
                <div class="confirm-actions">
                    <button class="cancel-btn">Cancel</button>
                    <button class="confirm-btn">Delete Wallet</button>
                </div>
            </div>
        `;

        document.body.appendChild(confirmDialog);
        
        try {
            const confirmed = await new Promise((resolve) => {
                const cancelBtn = confirmDialog.querySelector('.cancel-btn');
                const confirmBtn = confirmDialog.querySelector('.confirm-btn');
                
                const cleanup = () => {
                    document.body.removeChild(confirmDialog);
                };
                
                cancelBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(false);
                });
                
                confirmBtn.addEventListener('click', () => {
                    cleanup();
                    resolve(true);
                });
            });

            if (!confirmed) return;

            const deleteResponse = await fetch(`${this.apiBaseUrl}/registration/${address}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin: this.isAdmin })
            });

            if (!deleteResponse.ok) {
                const errorData = await deleteResponse.json();
                throw new Error(errorData.message || 'Failed to delete wallet');
            }

            // Reload wallets to update the UI
            await this.loadWallets();
            this.startAutoRefresh(); // Resume auto-refresh
            
        } catch (error) {
            console.error('Failed to delete wallet:', error);
            this.showError(error.message || 'Failed to delete wallet');
            this.startAutoRefresh(); // Resume auto-refresh even on error
        }
    }

    async viewWalletDetails(address) {
        try {
            const [walletResponse, txResponse] = await Promise.all([
                fetch(`${this.apiBaseUrl}/registration/${address}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                }),
                fetch(`${this.apiBaseUrl}/transactions/wallet/${address}`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include'
                })
            ]);

            const [walletData, txData] = await Promise.all([
                walletResponse.json(),
                txResponse.json()
            ]);

            if (!walletResponse.ok || !txResponse.ok) {
                const errorData = !walletResponse.ok ? walletData : txData;
                throw new Error(errorData.error?.message || errorData.message || 'Failed to load wallet details');
            }

            const wallet = await walletResponse.json();
            const transactions = await txResponse.json();

            this.displayWalletDetails(wallet, transactions || []);
            this.openModal();
        } catch (error) {
            console.error('Error loading wallet details:', error);
            this.showError(error.message || 'Failed to load wallet details');
        }
    }

    displayWalletDetails(wallet, transactions) {
        const modalContent = this.modal.querySelector('.modal-content');
        
        modalContent.querySelector('.wallet-address').textContent = 
            wallet.address === 'main_wallet' ? 'Main Wallet' : this.formatAddress(wallet.address);
        modalContent.querySelector('.wallet-balance').textContent = this.formatBalance(wallet.balance);
        modalContent.querySelector('.wallet-created').textContent = new Date(wallet.createdAt).toLocaleString();

        const transactionsList = modalContent.querySelector('.transactions-list');
        
        if (!transactions.length) {
            transactionsList.innerHTML = `
                <div class="empty-state">
                    <p>No transactions yet</p>
                    <small>Transactions will appear here once you send or receive VIG</small>
                </div>
            `;
            return;
        }

        transactionsList.innerHTML = '';
        transactions.forEach(tx => {
            const isSent = tx.from === wallet.address;
            const txElement = document.createElement('div');
            txElement.className = `transaction-item ${isSent ? 'sent' : 'received'}`;
            
            const formattedTime = new Date(tx.timestamp).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            txElement.innerHTML = `
                <p><strong>${isSent ? 'Sent to' : 'Received from'}:</strong>
                   <span class="address">${this.formatAddress(isSent ? tx.to : tx.from)}</span></p>
                <p class="amount">${isSent ? '-' : '+'} ${this.formatBalance(tx.amount)} VIG</p>
                <p class="time">${formattedTime}</p>
                <p><span class="status ${tx.status.toLowerCase()}">${tx.status}</span></p>
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

    showError(message) {
        console.error('Error:', message);
        const errorToast = document.createElement('div');
        errorToast.className = 'toast error';
        errorToast.textContent = message;
        
        document.body.appendChild(errorToast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (document.body.contains(errorToast)) {
                document.body.removeChild(errorToast);
            }
        }, 5000);

        // Update status message if available
        if (this.statusMessage) {
            this.statusMessage.className = 'status-message error';
            this.statusMessage.textContent = message;
            this.statusMessage.style.display = 'block';
        }
        errorToast.offsetHeight;
        errorToast.classList.add('show');
        
        setTimeout(() => {
            errorToast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(errorToast);
            }, 300); // Match animation duration
        }, 3000);
    }
}

// Initialize wallet manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});

// Clean up when the page is unloaded
window.addEventListener('unload', () => {
    if (window.walletManager) {
        window.walletManager.destroy();
    }
});
