const schemas = require('../validators/schemas');

/**
 * Validate request data against a schema
 * @param {string} schemaName - Name of the schema to validate against
 * @returns {Function} Express middleware function
 */
const validateRequest = (schemaName) => {
    return (req, res, next) => {
        let dataToValidate;
        
        // Determine what data to validate based on request method
        switch (req.method) {
            case 'GET':
                dataToValidate = req.params;
                break;
            case 'POST':
            case 'PUT':
                dataToValidate = req.body;
                break;
            default:
                return res.status(405).json({ error: 'Method not allowed' });
        }

        const schema = schemas[schemaName];
        if (!schema) {
            return res.status(500).json({ error: 'Schema not found' });
        }

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const details = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                error: 'Validation error',
                details
            });
        }

        // Replace request data with validated data
        if (req.method === 'GET') {
            req.params = value;
        } else {
            req.body = value;
        }

        next();
    };
};

module.exports = validateRequest;