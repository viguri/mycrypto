// Manual test script for API connectivity
async function testApiConnectivity() {
    console.group('API Connectivity Test');
    
    try {
        // Test endpoints
        const endpoints = [
            '/api/test',
            '/api/health',
            '/api/blockchain',
            '/api/blockchain/stats'
        ];

        for (const endpoint of endpoints) {
            console.log(`Testing endpoint: ${endpoint}`);
            const startTime = Date.now();
            
            const response = await fetch(endpoint);
            const duration = Date.now() - startTime;
            
            console.log(`Response status: ${response.status} (${duration}ms)`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${endpoint}: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
        }

        console.log('✅ All API endpoints tested successfully');
        return true;
    } catch (error) {
        console.error('❌ API test failed:', error);
        return false;
    } finally {
        console.groupEnd();
    }
}

// Run test immediately and log result
testApiConnectivity().then(success => {
    const message = success 
        ? '✨ API connectivity test passed' 
        : '❌ API connectivity test failed';
    
    console.log('\n' + message);
    
    // Update UI if running in browser
    if (typeof document !== 'undefined') {
        const resultDiv = document.getElementById('test-result');
        if (resultDiv) {
            resultDiv.textContent = message;
            resultDiv.className = success ? 'success' : 'error';
        }
    }
});