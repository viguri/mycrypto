import express from 'express';
import logsRoutes from './api/routes/logs/index.js';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/api/logs', logsRoutes());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: err.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
