const customerService = require('../services/customerService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createCustomer = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new customer... 🛠️`);
    const payload = { ...req.body, userId: req.user.id };
    const customer = await customerService.createCustomer(payload);
    logger.info(`🎉 Successfully created customer: ${customer.displayName} 🏢 ✅`);
    res.status(201).json({ success: true, data: customer });
});

const getCustomers = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching customers for user ${req.user.id}... 🔍`);
    const customers = await customerService.getCustomersByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${customers.length} customers! 🚀`);
    res.status(200).json({ success: true, data: customers });
});

const getCustomerById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching customer details for ID: ${req.params.id}... 🔎`);
    const customer = await customerService.getCustomerById(req.params.id);
    
    if (customer.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for customer ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this customer', 403);
    }

    logger.info(`✅ Successfully fetched customer details for ${customer.displayName} 📈`);
    res.status(200).json({ success: true, data: customer });
});

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById
};
