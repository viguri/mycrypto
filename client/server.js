const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;
const API_TARGET = 'http://localhost:3000';

// Request logging
const logRequest = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [CLIENT] ${req.method} ${req.originalUrl}`);
    next();
};

app.use(logRequest);

// Serve static files from the public directory with caching disabled
app.use(express.static(path.join(__dirname, 'public'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));

// Create API proxy middleware
const apiProxy = createProxyMiddleware({
    target: API_TARGET,
    changeOrigin: true,
    pathRewrite: { '^/api': '' }, // Strip /api prefix when forwarding
    onProxyReq: (proxyReq, req, res) => {
        // Handle POST requests with JSON body
        if (req.method === 'POST' && req.body) {
            const bodyData = JSON.stringify(req.body);
            // Update headers
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
            // Write body data
            proxyReq.write(bodyData);
        }

        // Log proxy requests
        console.log('[PROXY]', {
            from: req.originalUrl,
            to: API_TARGET + proxyReq.path,
            method: req.method,
            body: req.body
        });
    },
    onError: (err, req, res) => {
        console.error('[PROXY] Error:', err);
        res.status(500).json({
            error: 'ProxyError',
            message: 'Failed to connect to blockchain node'
        });
    }
});

// Parse JSON bodies before proxy middleware
app.use(express.json());

// Mount API routes
app.use('/api', apiProxy);

// Error handler
app.use((err, req, res, next) => {
    console.error('[CLIENT] Error:', err);
    res.status(500).json({
        error: 'ServerError',
        message: err.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
[CLIENT] Server started:
- Client app running at http://localhost:${PORT}
- API endpoints available at http://localhost:${PORT}/api/*
- Proxying API requests to ${API_TARGET}
    `);
});
