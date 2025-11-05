#!/bin/bash
set -e

echo "Applying comprehensive fix for MyCrypto application..."

# 1. Fix client-side JavaScript to use relative URLs
echo "Fixing client-side JavaScript files..."

# Update wallet-manager.js
echo "Updating wallet-manager.js..."
cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js.bak
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js << 'WALLETJS'
/**
 * Manages wallet operations in the UI
 */
class WalletManager {
    constructor() {
        this.wallets = [];
        this.selectedWallet = null;
        this.isAdmin = false;
        this.apiBaseUrl = '/api';  // Use relative URL
        this.refreshInterval = null;
        this.setupModalListeners();
        this.loadWallets();
        this.startAutoRefresh();

    }

    /**
     * Set up event listeners for wallet modals
     */
    setupModalListeners() {
        document.getElementById('create-wallet-form').addEventListener('submit', this.handleCreateWallet.bind(this));
        document.getElementById('send-transaction-form').addEventListener('submit', this.handleSendTransaction.bind(this));
    }

    /**
     * Display error message in the UI
     */
    showError(message) {
        console.error(message);
        const errorElement = document.getElementById('error-message');
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
        setTimeout(() => {
            errorElement.classList.add('hidden');
        }, 5000);
    }

    /**
     * Display success message in the UI
     */
    showSuccess(message) {
        const successElement = document.getElementById('success-message');
        successElement.textContent = message;
        successElement.classList.remove('hidden');
        setTimeout(() => {
            successElement.classList.add('hidden');
        }, 5000);
    }

    /**
     * Start auto-refresh of wallet data
     */
    startAutoRefresh() {
        // Refresh wallet data every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadWallets();
        }, 30000);
    }

    /**
     * Stop auto-refresh of wallet data
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    /**
     * Load wallets from the API
     */
    async loadWallets() {
        try {
            console.log('Loading wallets from API...');
            const walletsResponse = await fetch(`${this.apiBaseUrl}/registration/wallets`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!walletsResponse.ok) {
                throw new Error(`API responded with status: ${walletsResponse.status}`);
            }
            
            const contentType = walletsResponse.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('Server returned non-JSON response');
            }
            
            const data = await walletsResponse.json();
            this.wallets = data.data || [];
            this.renderWalletList();
            this.updateStats();
            return this.wallets;
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.showError(error.message);
            return [];
        }
    }

    /**
     * Render the wallet list in the UI
     */
    renderWalletList() {
        const walletList = document.getElementById('wallet-list');
        walletList.innerHTML = '';

        if (this.wallets.length === 0) {
            walletList.innerHTML = '<tr><td colspan="4" class="text-center">No wallets found</td></tr>';
            return;
        }

        this.wallets.forEach(wallet => {
            const row = document.createElement('tr');
            
            // Format address for display
            const displayAddress = this.formatAddress(wallet.address);
            
            row.innerHTML = `
                <td class="address-cell" title="${wallet.address}">${displayAddress}</td>
                <td>${wallet.balance}</td>
                <td>${new Date(wallet.createdAt).toLocaleString()}</td>
                <td>
                    <button class="view-btn" data-address="${wallet.address}">View</button>
                    ${this.isAdmin || wallet.isMainWallet ? '' : `<button class="delete-btn" data-address="${wallet.address}">Delete</button>`}
                </td>
            `;
            
            walletList.appendChild(row);
        });

        // Add event listeners to buttons
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', () => {
                const address = button.getAttribute('data-address');
                this.viewWalletDetails(address);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const address = button.getAttribute('data-address');
                this.confirmDeleteWallet(address);
            });
        });
    }

    /**
     * Format wallet address for display
     */
    formatAddress(address) {
        if (!address) return 'Unknown';
        
        // Special case for named wallets
        if (address === 'main_wallet') return 'Main Wallet 🏦';
        if (address === 'test_wallet') return 'Test Wallet 🧪';
        
        // Truncate long addresses
        if (address.length > 16) {
            return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`;
        }
        
        return address;
    }

    /**
     * Update blockchain statistics in the UI
     */
    updateStats() {
        const totalWallets = this.wallets.length;
        const totalBalance = this.wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        
        document.getElementById('total-wallets').textContent = totalWallets;
        document.getElementById('total-balance').textContent = totalBalance;
    }

    /**
     * Handle wallet creation form submission
     */
    async handleCreateWallet(event) {
        event.preventDefault();
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/registration/wallet`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                throw new Error(`Failed to create wallet: ${response.status}`);
            }
            
            const data = await response.json();
            this.showSuccess('Wallet created successfully!');
            this.loadWallets();
            
            // Close modal
            const modal = document.getElementById('create-wallet-modal');
            modal.classList.add('hidden');
        } catch (error) {
            this.showError(`Failed to create wallet: ${error.message}`);
        }
    }

    /**
     * Confirm wallet deletion
     */
    confirmDeleteWallet(address) {
        if (confirm(`Are you sure you want to delete wallet ${this.formatAddress(address)}?`)) {
            this.deleteWallet(address);
        }
    }

    /**
     * Delete a wallet
     */
    async deleteWallet(address) {
        try {
            const deleteResponse = await fetch(`${this.apiBaseUrl}/registration/${address}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ isAdmin: this.isAdmin })
            });
            
            if (!deleteResponse.ok) {
                throw new Error(`Failed to delete wallet: ${deleteResponse.status}`);
            }
            
            const data = await deleteResponse.json();
            this.showSuccess('Wallet deleted successfully!');
            this.loadWallets();
        } catch (error) {
            this.showError(`Failed to delete wallet: ${error.message}`);
        }
    }

    /**
     * View wallet details
     */
    async viewWalletDetails(address) {
        try {
            // Get wallet details
            const walletResponse = await fetch(`${this.apiBaseUrl}/registration/${address}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!walletResponse.ok) {
                throw new Error(`Failed to get wallet details: ${walletResponse.status}`);
            }
            
            const walletData = await walletResponse.json();
            
            // Get wallet transactions
            const txResponse = await fetch(`${this.apiBaseUrl}/transactions/wallet/${address}`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            
            if (!txResponse.ok) {
                throw new Error(`Failed to get wallet transactions: ${txResponse.status}`);
            }
            
            const txData = await txResponse.json();
            
            // Display wallet details
            this.displayWalletDetails(walletData.data, txData.data || []);
            
            // Show modal
            const modal = document.getElementById('wallet-details-modal');
            modal.classList.remove('hidden');
        } catch (error) {
            this.showError(`Failed to view wallet details: ${error.message}`);
        }
    }

    /**
     * Display wallet details in the UI
     */
    displayWalletDetails(wallet, transactions) {
        if (!wallet) {
            this.showError('Wallet details not available');
            return;
        }
        
        this.selectedWallet = wallet;
        
        // Update wallet details in the modal
        document.getElementById('wallet-address').textContent = wallet.address;
        document.getElementById('wallet-balance').textContent = wallet.balance;
        document.getElementById('wallet-created').textContent = new Date(wallet.createdAt).toLocaleString();
        
        // Update transaction list
        const txList = document.getElementById('transaction-list');
        txList.innerHTML = '';
        
        if (!transactions || transactions.length === 0) {
            txList.innerHTML = '<tr><td colspan="5" class="text-center">No transactions found</td></tr>';
            return;
        }
        
        transactions.forEach(tx => {
            const row = document.createElement('tr');
            const isIncoming = tx.to === wallet.address;
            
            row.innerHTML = `
                <td>${tx.hash.substring(0, 8)}...</td>
                <td>${this.formatAddress(tx.from)}</td>
                <td>${this.formatAddress(tx.to)}</td>
                <td>${tx.amount}</td>
                <td>${new Date(tx.timestamp).toLocaleString()}</td>
            `;
            
            // Highlight incoming/outgoing transactions
            if (isIncoming) {
                row.classList.add('incoming-tx');
            } else {
                row.classList.add('outgoing-tx');
            }
            
            txList.appendChild(row);
        });
    }

    /**
     * Handle send transaction form submission
     */
    async handleSendTransaction(event) {
        event.preventDefault();
        
        const recipientAddress = document.getElementById('recipient-address').value;
        const amount = parseInt(document.getElementById('tx-amount').value, 10);
        
        if (!this.selectedWallet) {
            this.showError('No wallet selected');
            return;
        }
        
        if (!recipientAddress) {
            this.showError('Recipient address is required');
            return;
        }
        
        if (isNaN(amount) || amount <= 0) {
            this.showError('Amount must be a positive number');
            return;
        }
        
        if (amount > this.selectedWallet.balance) {
            this.showError('Insufficient balance');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: this.selectedWallet.address,
                    to: recipientAddress,
                    amount
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to send transaction: ${response.status}`);
            }
            
            const data = await response.json();
            this.showSuccess('Transaction sent successfully!');
            
            // Close modal and refresh wallets
            const modal = document.getElementById('send-transaction-modal');
            modal.classList.add('hidden');
            this.loadWallets();
            
            // Clear form
            document.getElementById('recipient-address').value = '';
            document.getElementById('tx-amount').value = '';
        } catch (error) {
            this.showError(`Failed to send transaction: ${error.message}`);
        }
    }

    /**
     * Set admin status
     */
    setAdmin(isAdmin) {
        this.isAdmin = isAdmin;
        this.loadWallets();
        
        // Update UI for admin
        if (isAdmin) {
            document.body.classList.add('admin-mode');
        } else {
            document.body.classList.remove('admin-mode');
        }
    }
}

// Initialize wallet manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.walletManager = new WalletManager();
});
WALLETJS

# Check app.js
echo "Updating app.js..."
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js; then
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js
fi

# Check connection-monitor.js
echo "Updating connection-monitor.js..."
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js; then
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js
fi

# Check auth.js
echo "Updating auth.js..."
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js; then
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js
fi

# 2. Create a more robust Apache configuration
echo "Creating robust Apache configuration..."

cat > /tmp/crypto.viguri.org.conf << 'APACHECONF'
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Document root
    DocumentRoot /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    
    # Directory configuration
    <Directory /var/www/vhosts/viguri.org/crypto.viguri.org/client/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Rewrite rules for SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API Proxy Configuration
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Set proxy timeout
    ProxyTimeout 300
    
    # Add CORS headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    
    # Handle OPTIONS requests for CORS preflight
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://localhost:3003/api
    ProxyPassReverse /api http://localhost:3003/api
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
    
    # Set log level to debug temporarily
    LogLevel debug
</VirtualHost>
APACHECONF

# Copy the updated configuration file to the correct location
sudo cp /tmp/crypto.viguri.org.conf /etc/apache2/sites-available/crypto.viguri.org.conf

# Make sure all required modules are enabled
echo "Enabling required Apache modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite

# Test the Apache configuration
echo "Testing Apache configuration..."
sudo apache2ctl configtest

# Reload Apache to apply changes
echo "Reloading Apache..."
sudo systemctl reload apache2

# 3. Test the API endpoints
echo "Testing API endpoints..."
sleep 2

echo "Testing /api/test endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/test
echo " <- HTTP status code for localhost"

curl -s -o /dev/null -w "%{http_code}" http://crypto.viguri.org/api/test
echo " <- HTTP status code for crypto.viguri.org"

echo "Testing /api/registration/wallets endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/registration/wallets
echo " <- HTTP status code for localhost"

curl -s -o /dev/null -w "%{http_code}" http://crypto.viguri.org/api/registration/wallets
echo " <- HTTP status code for crypto.viguri.org"

echo "All fixes have been applied successfully!"
echo "Please refresh your browser and try again."
