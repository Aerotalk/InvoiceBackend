const { ZodError } = require('zod');
const AppError = require('../utils/AppError');

const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error && error.name === 'ZodError') {
        const errorsList = error.issues || error.errors || [];
        const errors = errorsList.map((err) => ({
          field: err.path ? err.path.join('.') : 'unknown',
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors
        });
      }
      next(error);
    }
  };
};

module.exports = validateRequest;
