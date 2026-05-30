const vendorService = require('../services/vendorService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createVendor = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new vendor... 🏭`);
    const payload = { ...req.body, userId: req.user.id };
    const vendor = await vendorService.createVendor(payload);
    logger.info(`🎉 Successfully created vendor: ${vendor.displayName} 🤝 ✅`);
    res.status(201).json({ success: true, data: vendor });
});

const getVendors = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching vendors for user ${req.user.id}... 🔍`);
    const vendors = await vendorService.getVendorsByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${vendors.length} vendors! 🚀`);
    res.status(200).json({ success: true, data: vendors });
});

const getVendorById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching vendor details for ID: ${req.params.id}... 🔎`);
    const vendor = await vendorService.getVendorById(req.params.id);
    
    if (vendor.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for vendor ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this vendor', 403);
    }

    logger.info(`✅ Successfully fetched vendor details for ${vendor.displayName} 📈`);
    res.status(200).json({ success: true, data: vendor });
});

module.exports = {
    createVendor,
    getVendors,
    getVendorById
};
