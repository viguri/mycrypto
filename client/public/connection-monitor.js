class ConnectionMonitor {
    constructor() {
        this.statusElement = document.getElementById('connection-status');
        this.checkInterval = 5000; // Check every 5 seconds
        this.isConnected = false;
        this.start();
    }

    async checkConnection() {
        try {
            const response = await fetch('/api/test');
            if (response.ok) {
                const data = await response.json();
                if (data.message === 'API test endpoint successful') {
                    this.setConnected();
                    return;
                }
            }
            this.setDisconnected();
        } catch (error) {
            this.setDisconnected();
        }
    }

    setConnected() {
        if (!this.isConnected) {
            this.statusElement.textContent = 'Connected';
            this.statusElement.style.backgroundColor = '#4CAF50';
            this.isConnected = true;
        }
    }

    setDisconnected() {
        if (this.isConnected) {
            this.statusElement.textContent = 'Disconnected';
            this.statusElement.style.backgroundColor = '#f44336';
            this.isConnected = false;
        }
    }

    start() {
        this.checkConnection();
        setInterval(() => this.checkConnection(), this.checkInterval);
    }
}

// Initialize connection monitor when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.connectionMonitor = new ConnectionMonitor();
});