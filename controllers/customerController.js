const customerService = require('../services/customerService');
const logger = require('../utils/logger');

const createCustomer = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new customer... 🛠️`);
        const payload = { ...req.body, userId: req.user.id };
        const customer = await customerService.createCustomer(payload);
        logger.info(`🎉 Successfully created customer: ${customer.displayName} 🏢 ✅`);
        res.status(201).json({ success: true, data: customer });
    } catch (error) {
        logger.error(`❌ Failed to create customer: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getCustomers = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching customers for user ${req.user.id}... 🔍`);
        const customers = await customerService.getCustomersByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${customers.length} customers! 🚀`);
        res.status(200).json({ success: true, data: customers });
    } catch (error) {
        logger.error(`❌ Error fetching customers: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getCustomerById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching customer details for ID: ${req.params.id}... 🔎`);
        const customer = await customerService.getCustomerById(req.params.id);
        
        if (customer.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for customer ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this customer' });
        }

        logger.info(`✅ Successfully fetched customer details for ${customer.displayName} 📈`);
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        logger.error(`❌ Customer not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

module.exports = {
    createCustomer,
    getCustomers,
    getCustomerById
};
