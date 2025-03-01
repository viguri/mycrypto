class Auth {
    constructor() {
        this.isAdmin = false;
        this.isAuthenticated = false;
        this.initElements();
        this.attachEventListeners();
        this.checkAuth();
    }

    initElements() {
        this.elements = {
            loginForm: document.getElementById('login-form'),
            loginError: document.getElementById('login-error'),
            adminSection: document.getElementById('admin-section'),
            logoutBtn: document.getElementById('logout-btn'),
            userSection: document.getElementById('user-section')
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
    }

    async handleLogin(e) {
        e.preventDefault();
        const password = e.target.password.value;

        try {
            if (password === 'admin123') { // In real app, this would be a secure auth endpoint
                this.isAdmin = true;
                this.isAuthenticated = true;
                localStorage.setItem('isAdmin', 'true');
                this.updateUI();
                this.showSuccessMessage('Logged in as admin');
            } else {
                throw new Error('Invalid password');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showError(error.message);
        }

        e.target.reset();
    }

    handleLogout() {
        this.isAdmin = false;
        this.isAuthenticated = false;
        localStorage.removeItem('isAdmin');
        this.updateUI();
    }

    checkAuth() {
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.isAdmin = isAdmin;
        this.isAuthenticated = isAdmin;
        this.updateUI();

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
            this.elements.loginError.textContent = message;
            this.elements.loginError.className = 'error';
            this.elements.loginError.style.display = 'block';
            setTimeout(() => {
                this.elements.loginError.style.display = 'none';
            }, 3000);
        }
    }

    showSuccessMessage(message) {
        if (this.elements.loginError) {
            this.elements.loginError.textContent = message;
            this.elements.loginError.className = 'success';
            this.elements.loginError.style.display = 'block';
            setTimeout(() => {
                this.elements.loginError.style.display = 'none';
                this.elements.loginError.className = 'error';
            }, 3000);
        }
    }
}

// Initialize auth when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});