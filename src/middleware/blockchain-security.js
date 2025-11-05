/**
 * Blockchain Security Middleware
 * Implements security measures specific to blockchain operations
 */

import { securityConfig } from '../config/security.js';
import logger from '../utils/logger/index.js';

// Transaction size validation
export const validateTransactionSize = (req, res, next) => {
    const transaction = req.body;
    const size = Buffer.from(JSON.stringify(transaction)).length;
    const maxSize = parseInt(securityConfig.blockchain.verification.maxTransactionSize);

    if (size > maxSize) {
        logger.warn('Transaction size exceeded limit', {
            component: 'blockchain-security',
            size,
            maxSize,
            transactionId: transaction.id
        });

        return res.status(413).json({
            error: 'TransactionTooLarge',
            message: `Transaction size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`
        });
    }
    next();
};

// Block size validation
export const validateBlockSize = (req, res, next) => {
    const block = req.body;
    const size = Buffer.from(JSON.stringify(block)).length;
    const maxSize = parseInt(securityConfig.blockchain.verification.maxBlockSize);

    if (size > maxSize) {
        logger.warn('Block size exceeded limit', {
            component: 'blockchain-security',
            size,
            maxSize,
            blockHeight: block.height
        });

        return res.status(413).json({
            error: 'BlockTooLarge',
            message: `Block size ${size} bytes exceeds maximum allowed size of ${maxSize} bytes`
        });
    }
    next();
};

// Mining rate limiter
export const miningRateLimit = (req, res, next) => {
    const { windowMs, maxRequests } = securityConfig.blockchain.mining.rateLimit;
    const key = req.user?.id || req.ip;
    const now = Date.now();
    
    // Get or initialize miner's request history
    const miners = req.app.locals.miners = req.app.locals.miners || new Map();
    const miner = miners.get(key) || { requests: [], lastReset: now };
    
    // Clean up old requests
    miner.requests = miner.requests.filter(time => time > now - windowMs);
    
    // Check rate limit
    if (miner.requests.length >= maxRequests) {
        logger.warn('Mining rate limit exceeded', {
            component: 'blockchain-security',
            miner: key,
            requestCount: miner.requests.length,
            maxRequests
        });

        return res.status(429).json({
            error: 'TooManyMiningRequests',
            message: `Mining rate limit of ${maxRequests} requests per ${windowMs/1000} seconds exceeded`
        });
    }
    
    // Add current request
    miner.requests.push(now);
    miners.set(key, miner);
    
    next();
};

// Transaction validation
export const validateTransaction = (req, res, next) => {
    const transaction = req.body;
    const config = securityConfig.blockchain.transactions.validation;

    // Basic structure validation
    if (!transaction || typeof transaction !== 'object') {
        return res.status(400).json({
            error: 'InvalidTransaction',
            message: 'Invalid transaction format'
        });
    }

    // Validate inputs and outputs
    if (!Array.isArray(transaction.inputs) || !Array.isArray(transaction.outputs)) {
        return res.status(400).json({
            error: 'InvalidTransaction',
            message: 'Transaction must have inputs and outputs arrays'
        });
    }

    // Check input/output limits
    if (transaction.inputs.length > config.maxInputs) {
        return res.status(400).json({
            error: 'TooManyInputs',
            message: `Transaction cannot have more than ${config.maxInputs} inputs`
        });
    }

    if (transaction.outputs.length > config.maxOutputs) {
        return res.status(400).json({
            error: 'TooManyOutputs',
            message: `Transaction cannot have more than ${config.maxOutputs} outputs`
        });
    }

    // Validate signature if required
    if (config.requireSignature && !transaction.signature) {
        return res.status(400).json({
            error: 'SignatureRequired',
            message: 'Transaction must be signed'
        });
    }

    // Validate minimum fee
    const fee = calculateTransactionFee(transaction);
    if (fee < parseFloat(config.minFee)) {
        return res.status(400).json({
            error: 'InsufficientFee',
            message: `Transaction fee ${fee} is below minimum required fee ${config.minFee}`
        });
    }

    next();
};

// Block verification timeout
export const blockVerificationTimeout = (req, res, next) => {
    const timeout = securityConfig.blockchain.verification.timeoutMs;
    
    // Set timeout for block verification
    req.setTimeout(timeout, () => {
        logger.warn('Block verification timeout', {
            component: 'blockchain-security',
            timeout,
            blockHeight: req.body?.height
        });

        res.status(408).json({
            error: 'BlockVerificationTimeout',
            message: `Block verification exceeded timeout of ${timeout}ms`
        });
    });

    next();
};

// Helper function to calculate transaction fee
const calculateTransactionFee = (transaction) => {
    const totalInput = transaction.inputs.reduce((sum, input) => sum + (input.amount || 0), 0);
    const totalOutput = transaction.outputs.reduce((sum, output) => sum + (output.amount || 0), 0);
    return totalInput - totalOutput;
};

// Export middleware factory
export const createBlockchainSecurityMiddleware = () => {
    return {
        transaction: [validateTransactionSize, validateTransaction],
        block: [validateBlockSize, blockVerificationTimeout],
        mining: [miningRateLimit]
    };
};

export default createBlockchainSecurityMiddleware;
