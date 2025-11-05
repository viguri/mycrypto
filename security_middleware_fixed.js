import helmet from 'helmet';
import cors from 'cors';

const securityConfig = {
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8080', 'http://localhost:3003'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true
    },
    helmet: {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: process.env.CSP_SCRIPT_SRC ? 
                    process.env.CSP_SCRIPT_SRC.split(',').map(src => src === 'self' ? "'self'" : src) : 
                    ["'self'"],
                styleSrc: process.env.CSP_STYLE_SRC ? 
                    process.env.CSP_STYLE_SRC.split(',').map(src => src === 'self' ? "'self'" : src) : 
                    ["'self'", "'unsafe-inline'"],
                imgSrc: process.env.CSP_IMG_SRC ? 
                    process.env.CSP_IMG_SRC.split(',').map(src => src === 'self' ? "'self'" : src) : 
                    ["'self'", "data:", "https:"],
                connectSrc: process.env.CSP_CONNECT_SRC ? 
                    process.env.CSP_CONNECT_SRC.split(',').map(src => src === 'self' ? "'self'" : src) : 
                    ["'self'"],
                fontSrc: process.env.CSP_FONT_SRC ? 
                    process.env.CSP_FONT_SRC.split(',').map(src => src === 'self' ? "'self'" : src) : 
                    ["'self'", "https:", "data:"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"]
            }
        },
    },
};

export { securityConfig };

export function createSecurityMiddleware() {
    return (req, res, next) => {
        // Apply CORS middleware
        cors(securityConfig.cors)(req, res, (err) => {
            if (err) return next(err);
            
            // Apply Helmet middleware for security headers
            helmet(securityConfig.helmet)(req, res, (err) => {
                if (err) return next(err);
                
                // Additional security headers
                res.setHeader('X-XSS-Protection', '1; mode=block');
                res.setHeader('X-Content-Type-Options', 'nosniff');
                res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
                next();
            });
        });
    };
}

export default (app) => {
    // CORS middleware
    app.use(cors(securityConfig.cors));
    
    // Helmet middleware for security headers
    app.use(helmet(securityConfig.helmet));
    
    // Additional security headers
    app.use((req, res, next) => {
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
        next();
    });
};
