class Auth {
    constructor() {
        this.isAdmin = false;
        this.isAuthenticated = false;
        this.rateLimitConfig = {
            maxAttempts: 5,
            lockoutDuration: 300000, // 5 minutes in milliseconds
            minWaitBetweenAttempts: 2000 // 2 seconds in milliseconds
        };
        this.initElements();
        this.attachEventListeners();
        this.checkAuth();
        this.logActivity('Auth system initialized');
    }

    logActivity(message, level = 'info', extraData = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            component: 'Auth',
            message,
            userId: this.isAdmin ? 'admin' : 'anonymous',
            ...extraData
        };

        // Add rate limit info if available
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        if (attempts > 0) {
            logEntry.attempts = attempts;
            logEntry.maxAttempts = this.rateLimitConfig.maxAttempts;
        }

        console.log(`[${timestamp}] [${level.toUpperCase()}] Auth: ${message}`, logEntry);
        return logEntry;
    }

    checkRateLimit() {
        const now = Date.now();
        const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
        const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
        const timeSinceLastAttempt = now - lastAttempt;

        // Check if we need to reset attempts due to lockout period expiring
        if (attempts >= this.rateLimitConfig.maxAttempts && 
            timeSinceLastAttempt >= this.rateLimitConfig.lockoutDuration) {
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lastLoginAttempt');
            this.logActivity('Rate limit reset after lockout period', 'info', { attempts: 0 });
            return { allowed: true, message: '' };
        }

        // Check minimum wait time between attempts
        if (timeSinceLastAttempt < this.rateLimitConfig.minWaitBetweenAttempts) {
            const waitTime = Math.ceil((this.rateLimitConfig.minWaitBetweenAttempts - timeSinceLastAttempt) / 1000);
            return {
                allowed: false,
                message: `Please wait ${waitTime} seconds before trying again`
            };
        }

        // Check if account is locked
        if (attempts >= this.rateLimitConfig.maxAttempts && 
            timeSinceLastAttempt < this.rateLimitConfig.lockoutDuration) {
            const remainingTime = Math.ceil(
                (this.rateLimitConfig.lockoutDuration - timeSinceLastAttempt) / 60000
            );
            return {
                allowed: false,
                message: `Account locked. Try again in ${remainingTime} minutes`
            };
        }

        return { allowed: true, message: '' };
    }

    initElements() {
        this.elements = {
            loginForm: document.getElementById('login-form'),
            loginError: document.getElementById('login-error'),
            loginSuccess: document.getElementById('login-success'),
            adminSection: document.getElementById('admin-section'),
            logoutBtn: document.getElementById('logout-btn'),
            userSection: document.getElementById('user-section'),
            passwordInput: document.getElementById('password'),
            togglePassword: document.getElementById('toggle-password'),
            attemptsInfo: document.getElementById('attempts-info'),
            loginBtn: document.getElementById('login-btn')
        };

        // Add password hint for testing
        const hintElement = document.createElement('p');
        hintElement.className = 'hint';
        hintElement.textContent = 'Testing password: admin123';
        if (this.elements.loginForm) {
            this.elements.loginForm.appendChild(hintElement);
        }
    }

    attachEventListeners() {
        if (this.elements.loginForm) {
            this.elements.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        if (this.elements.togglePassword) {
            this.elements.togglePassword.addEventListener('click', () => {
                const type = this.elements.passwordInput.type === 'password' ? 'text' : 'password';
                this.elements.passwordInput.type = type;
                this.elements.togglePassword.textContent = type === 'password' ? '👁️' : '👂';
            });
        }
    }

    async handleLogin(e) {
        this.logActivity('Login attempt started');
        e.preventDefault();
        const password = e.target.password.value.trim();

        // Disable login button and show loading state
        if (this.elements.loginBtn) {
            this.elements.loginBtn.disabled = true;
            this.elements.loginBtn.textContent = 'Logging in...';
        }

        try {
            // Basic validation
            if (!password) {
                throw new Error('Password is required');
            }

            if (password.length < 6 || password.length > 32) {
                throw new Error('Password must be between 6 and 32 characters');
            }

            // Check rate limiting
            const rateLimit = this.checkRateLimit();
            if (!rateLimit.allowed) {
                throw new Error(rateLimit.message);
            }
            
            const now = Date.now();
            localStorage.setItem('lastLoginAttempt', now.toString());
            
            if (password === 'admin123') { // In real app, this would be a secure auth endpoint
                this.isAdmin = true;
                this.isAuthenticated = true;
                localStorage.setItem('isAdmin', 'true');
                localStorage.removeItem('loginAttempts'); // Reset attempts on success
                
                // Show success message before updating UI
                if (this.elements.loginSuccess) {
                    this.elements.loginSuccess.style.display = 'block';
                }
                this.logActivity('Admin login successful');

                // Delay UI update to show success message
                setTimeout(() => {
                    this.updateUI();
                    this.showSuccessMessage('Logged in as admin');
                }, 1000);
            } else {
                localStorage.setItem('loginAttempts', (attempts + 1).toString());
                throw new Error('Invalid password');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showError(error.message);
            this.logActivity(`Login failed: ${error.message}`, 'error');
        } finally {
            // Re-enable login button and restore text
            if (this.elements.loginBtn) {
                this.elements.loginBtn.disabled = false;
                this.elements.loginBtn.textContent = 'Login';
            }
        }

        e.target.reset();
    }

    handleLogout() {
        this.logActivity('Logout initiated');
        this.isAdmin = false;
        this.isAuthenticated = false;
        localStorage.removeItem('isAdmin');
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
        this.updateUI();
        this.showSuccessMessage('Logged out successfully');
        this.logActivity('Logout completed successfully');
    }

    checkAuth() {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.isAdmin = isAdmin;
        this.isAuthenticated = isAdmin;
        this.updateUI();
        this.logActivity(`Auth check: User is ${isAdmin ? 'admin' : 'not admin'}`);

        // Notify wallet manager of admin status only if it exists
        if (window.walletManager) {
            window.walletManager.setAdmin(isAdmin);
        }
    }

    updateUI() {
        if (this.elements.adminSection) {
            this.elements.adminSection.style.display = this.isAdmin ? 'block' : 'none';
        }
        
        if (this.elements.loginForm) {
            this.elements.loginForm.style.display = this.isAuthenticated ? 'none' : 'block';
        }

        if (this.elements.logoutBtn) {
            this.elements.logoutBtn.style.display = this.isAuthenticated ? 'block' : 'none';
        }

        if (this.elements.userSection) {
            this.elements.userSection.style.display = this.isAuthenticated ? 'block' : 'none';
        }

        // Update wallet manager only if it exists
        if (window.walletManager) {
            window.walletManager.setAdmin(this.isAdmin);
        }
    }

    showError(message) {
        if (this.elements.loginError) {
            // Hide success message if visible
            if (this.elements.loginSuccess) {
                this.elements.loginSuccess.style.display = 'none';
            }

            this.elements.loginError.textContent = message;
            this.elements.loginError.className = 'error';
            this.elements.loginError.style.display = 'block';
            
            // Show remaining attempts info
            const attempts = parseInt(localStorage.getItem('loginAttempts') || '0');
            const remainingAttempts = 5 - attempts;
            
            if (this.elements.attemptsInfo) {
                if (remainingAttempts > 0) {
                    const attemptsText = remainingAttempts === 1 ? 'attempt' : 'attempts';
                    this.elements.attemptsInfo.textContent = `${remainingAttempts} ${attemptsText} remaining`;
                    this.elements.attemptsInfo.style.display = 'block';
                } else {
                    const now = Date.now();
                    const lastAttempt = parseInt(localStorage.getItem('lastLoginAttempt') || '0');
                    const remainingTime = Math.ceil((300000 - (now - lastAttempt)) / 60000);
                    this.elements.attemptsInfo.textContent = `Account locked. Try again in ${remainingTime} minutes`;
                    this.elements.attemptsInfo.style.display = 'block';
                }
            }
            
            // Don't auto-hide error for lockout messages
            if (!message.includes('Account locked')) {
                setTimeout(() => {
                    this.elements.loginError.style.display = 'none';
                    if (this.elements.attemptsInfo) {
                        this.elements.attemptsInfo.style.display = 'none';
                    }
                }, 3000);
            }
        }
    }

    showSuccessMessage(message) {
        // Hide error messages if visible
        if (this.elements.loginError) {
            this.elements.loginError.style.display = 'none';
        }
        if (this.elements.attemptsInfo) {
            this.elements.attemptsInfo.style.display = 'none';
        }

        // Show success message in the dedicated success element
        if (this.elements.loginSuccess) {
            this.elements.loginSuccess.textContent = message;
            this.elements.loginSuccess.style.display = 'block';
            this.elements.loginSuccess.className = 'success show';
            
            setTimeout(() => {
                this.elements.loginSuccess.style.display = 'none';
                this.elements.loginSuccess.className = 'success';
            }, 3000);
        }
    }
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});