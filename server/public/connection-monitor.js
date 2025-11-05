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
            const data = await response.json();
            
            if (data.status === 'ok') {
                this.setConnected();
            } else {
                this.setDisconnected();
            }
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
    try {
        // Create a debug element
        const debugElement = document.createElement('div');
        debugElement.style.position = 'fixed';
        debugElement.style.bottom = '10px';
        debugElement.style.right = '10px';
        debugElement.style.background = 'rgba(0,0,0,0.8)';
        debugElement.style.color = 'white';
        debugElement.style.padding = '10px';
        debugElement.style.borderRadius = '5px';
        debugElement.style.zIndex = '9999';
        debugElement.style.maxWidth = '300px';
        debugElement.style.maxHeight = '200px';
        debugElement.style.overflow = 'auto';
        
        // Add debug info
        debugElement.innerHTML = `
            <h3>Debug Info</h3>
            <p>Page loaded at: ${new Date().toISOString()}</p>
            <p>Scripts loaded: ${document.scripts.length}</p>
            <p>Styles loaded: ${document.styleSheets.length}</p>
        `;
        
        // Add to body
        document.body.appendChild(debugElement);
        
        console.log('Debug element added to page');
        
        // Initialize connection monitor
        window.connectionMonitor = new ConnectionMonitor();
    } catch (error) {
        console.error('Error in connection-monitor initialization:', error);
        
        // Create an error element
        const errorElement = document.createElement('div');
        errorElement.style.position = 'fixed';
        errorElement.style.top = '10px';
        errorElement.style.left = '10px';
        errorElement.style.background = 'rgba(255,0,0,0.8)';
        errorElement.style.color = 'white';
        errorElement.style.padding = '10px';
        errorElement.style.borderRadius = '5px';
        errorElement.style.zIndex = '9999';
        
        errorElement.textContent = `Error: ${error.message}`;
        document.body.appendChild(errorElement);
    }
});