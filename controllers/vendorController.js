const vendorService = require('../services/vendorService');
const logger = require('../utils/logger');

const createVendor = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new vendor... 🏭`);
        const payload = { ...req.body, userId: req.user.id };
        const vendor = await vendorService.createVendor(payload);
        logger.info(`🎉 Successfully created vendor: ${vendor.displayName} 🤝 ✅`);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        logger.error(`❌ Failed to create vendor: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getVendors = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching vendors for user ${req.user.id}... 🔍`);
        const vendors = await vendorService.getVendorsByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${vendors.length} vendors! 🚀`);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        logger.error(`❌ Error fetching vendors: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getVendorById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching vendor details for ID: ${req.params.id}... 🔎`);
        const vendor = await vendorService.getVendorById(req.params.id);
        
        if (vendor.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for vendor ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this vendor' });
        }

        logger.info(`✅ Successfully fetched vendor details for ${vendor.displayName} 📈`);
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        logger.error(`❌ Vendor not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

module.exports = {
    createVendor,
    getVendors,
    getVendorById
};
