const Joi = require('joi');

const schemas = {
    // Transaction validation schema
    transaction: Joi.object({
        fromAddress: Joi.string()
            .required()
            .regex(/^[a-fA-F0-9]{40}$/)
            .message('Invalid address format'),
        toAddress: Joi.string()
            .required()
            .regex(/^[a-fA-F0-9]{40}$/)
            .message('Invalid address format'),
        amount: Joi.number()
            .required()
            .positive()
            .message('Amount must be positive'),
        signature: Joi.string()
            .required()
            .regex(/^[a-fA-F0-9]+$/)
            .message('Invalid signature format')
    }),

    // Mining request validation schema
    mining: Joi.object({
        minerAddress: Joi.string()
            .required()
            .regex(/^[a-fA-F0-9]{40}$/)
            .message('Invalid miner address format')
    }),

    // Address registration validation schema
    registration: Joi.object({
        publicKey: Joi.string()
            .required()
            .regex(/^-----BEGIN PUBLIC KEY-----[\s\S]*-----END PUBLIC KEY-----$/)
            .message('Invalid public key format')
    }),

    // Address parameter validation schema
    address: Joi.object({
        address: Joi.string()
            .required()
            .regex(/^[a-fA-F0-9]{40}$/)
            .message('Invalid address format')
    })
};

module.exports = schemas;