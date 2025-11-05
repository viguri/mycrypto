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
            
            // Show a loading indicator
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.textContent = 'Creating wallet...';
            loadingIndicator.style.position = 'fixed';
            loadingIndicator.style.top = '50%';
            loadingIndicator.style.left = '50%';
            loadingIndicator.style.transform = 'translate(-50%, -50%)';
            loadingIndicator.style.background = 'rgba(0, 0, 0, 0.8)';
            loadingIndicator.style.color = 'white';
            loadingIndicator.style.padding = '20px';
            loadingIndicator.style.borderRadius = '5px';
            loadingIndicator.style.zIndex = '9999';
            document.body.appendChild(loadingIndicator);
            
            try {
                // Use XMLHttpRequest instead of fetch for better compatibility
                const walletData = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/registration/wallet', true);
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.setRequestHeader('Accept', 'application/json');
                    xhr.withCredentials = true;
                    
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try {
                                const responseData = JSON.parse(xhr.responseText);
                                console.log('Wallet creation successful:', responseData);
                                resolve(responseData.data || responseData);
                            } catch (parseError) {
                                console.error('Error parsing response:', parseError);
                                reject(new Error('Invalid response format from server'));
                            }
                        } else {
                            let errorMessage = `Server error: ${xhr.status}`;
                            try {
                                const errorData = JSON.parse(xhr.responseText);
                                errorMessage = errorData.message || errorData.error || errorMessage;
                                console.error('Server error details:', errorData);
                            } catch (parseError) {
                                console.error('Could not parse error response:', parseError);
                            }
                            reject(new Error(errorMessage));
                        }
                    };
                    
                    xhr.onerror = function() {
                        console.error('Network error during wallet creation');
                        reject(new Error('Network error during wallet creation'));
                    };
                    
                    xhr.send(JSON.stringify({}));
                });
                
                console.log('Extracted wallet data:', walletData);
                
                // Validate the wallet data
                if (!walletData || typeof walletData !== 'object') {
                    throw new Error('Invalid wallet data format');
                }
                
                if (!walletData.address) {
                    throw new Error('Wallet address missing in server response');
                }
                
                // Create and initialize the wallet
                const wallet = new Wallet();
                wallet.address = walletData.address;
                wallet.balance = typeof walletData.balance === 'number' ? walletData.balance : 0;
                wallet.createdAt = walletData.createdAt || Date.now();
                
                // Save to local storage
                try {
                    localStorage.setItem('wallet', JSON.stringify({
                        address: wallet.address,
                        balance: wallet.balance,
                        createdAt: wallet.createdAt
                    }));
                    console.log('Wallet saved to localStorage');
                } catch (storageError) {
                    console.warn('Could not save wallet to localStorage:', storageError);
                    // Continue anyway, this is not critical
                }
                
                console.log('Wallet created successfully:', wallet);
                return wallet;
            } finally {
                // Remove loading indicator
                if (document.body.contains(loadingIndicator)) {
                    document.body.removeChild(loadingIndicator);
                }
            }
        } catch (error) {
            console.error('Wallet creation failed:', error);
            // Show error message to user
            alert(`Failed to create wallet: ${error.message || 'Unknown error'}`);
            throw error;
        }
    }

    static async load() {
        try {
            const stored = localStorage.getItem('wallet');
            if (!stored) {
                return null;
            }

            let data;
            try {
                data = JSON.parse(stored);
            } catch (parseError) {
                console.error('Invalid wallet data in localStorage:', parseError);
                localStorage.removeItem('wallet');
                return null;
            }
            
            if (!data || !data.address) {
                console.error('Invalid wallet data format in localStorage');
                localStorage.removeItem('wallet');
                return null;
            }
            
            try {
                // Use direct fetch instead of ApiClient for better error handling
                const response = await fetch(`/api/registration/${data.address}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    // If wallet not found on server, clear local storage
                    if (response.status === 404) {
                        console.error('Wallet not found on server');
                        localStorage.removeItem('wallet');
                        return null;
                    }
                    
                    // For other errors, try to use cached data
                    console.warn(`Server error (${response.status}), using cached wallet data`);
                    const wallet = new Wallet();
                    wallet.address = data.address;
                    wallet.balance = data.balance || 0;
                    wallet.createdAt = data.createdAt || Date.now();
                    return wallet;
                }
                
                const responseData = await response.json();
                const walletData = responseData.data || responseData; // Handle both formats
                
                const wallet = new Wallet();
                wallet.address = walletData.address || data.address;
                wallet.balance = walletData.balance || 0;
                wallet.createdAt = walletData.createdAt || data.createdAt || Date.now();
                
                return wallet;
            } catch (networkError) {
                // If network error, use cached data
                console.warn('Network error, using cached wallet data:', networkError);
                const wallet = new Wallet();
                wallet.address = data.address;
                wallet.balance = data.balance || 0;
                wallet.createdAt = data.createdAt || Date.now();
                return wallet;
            }
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

            try {
                const response = await fetch(`/api/registration/${this.address}`, {
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    console.warn(`Error fetching balance (${response.status}), using cached balance`);
                    return this.balance;
                }
                
                const responseData = await response.json();
                const data = responseData.data || responseData; // Handle both formats
                
                if (data && typeof data.balance === 'number') {
                    this.balance = data.balance;
                }
                
                return this.balance;
            } catch (networkError) {
                console.warn('Network error fetching balance, using cached balance:', networkError);
                return this.balance;
            }
        } catch (error) {
            console.error('Failed to get balance:', error);
            return this.balance; // Return current balance instead of throwing
        }
    }

    async sendTransaction(to, amount) {
        try {
            if (!this.address) {
                throw new Error('Wallet not initialized');
            }
            
            if (!to) {
                throw new Error('Recipient address is required');
            }
            
            // Validate amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                throw new Error('Invalid amount: must be a positive number');
            }
            
            // Check if we have enough balance
            await this.getBalance();
            if (parsedAmount > this.balance) {
                throw new Error(`Insufficient balance: ${this.formatBalance()} available`);
            }

            // Send the transaction
            const response = await fetch('/api/transactions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    from: this.address,
                    to,
                    amount: parsedAmount
                })
            });
            
            if (!response.ok) {
                let errorMessage = 'Transaction failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            const transaction = responseData.data || responseData; // Handle both formats
            
            try {
                // Auto-mine the transaction
                await this.mineTransaction();
            } catch (miningError) {
                console.warn('Mining failed, transaction is pending:', miningError);
            }
            
            try {
                // Update balance after transaction
                await this.getBalance();
            } catch (balanceError) {
                console.warn('Failed to update balance after transaction:', balanceError);
            }
            
            return transaction;
        } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    async mineTransaction() {
        try {
            const response = await fetch('/api/mining/mine', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({})
            });
            
            if (!response.ok) {
                let errorMessage = 'Mining failed';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorData.error || `Server error: ${response.status}`;
                } catch (parseError) {
                    errorMessage = `Server error: ${response.status}`;
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            return responseData.data || responseData; // Handle both formats
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