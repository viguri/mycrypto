import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')));

// Configure proxy settings
const proxyConfig = {
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: path => path,  // keep original paths
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
            error: 'ProxyError',
            message: 'Failed to connect to API server'
        });
    },
    logLevel: 'warn'
};

// Proxy all /api requests
app.use('/api', createProxyMiddleware(proxyConfig));

// Handle client-side routing
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => {
    console.log('\n[CLIENT] Server started:');
    console.log(`- Client app running at http://localhost:${port}`);
    console.log(`- API endpoints available at http://localhost:${port}/api/*`);
    console.log('- Proxying API requests to http://localhost:3000');
});
