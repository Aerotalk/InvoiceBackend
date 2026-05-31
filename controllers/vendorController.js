const vendorService = require('../services/vendorService');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res, next) => {
    try {
        logger.debug(`🐞 🏭 [VENDOR] 📋 Fetching all vendors for user ${req.user.id}...`);
        const vendors = await vendorService.getVendorsByUser(req.user.id);
        logger.info(`🏭 [VENDOR] ✅ Successfully fetched ${vendors.length} vendors`);
        res.status(200).json({ success: true, data: vendors });
    } catch (error) {
        logger.error(`🚨 🏭 [VENDOR] ❌ Error fetching vendors: ${error.message}`);
        next(error);
    }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res, next) => {
    try {
        logger.debug(`🐞 🏭 [VENDOR] 🔍 Fetching vendor with ID: ${req.params.id}`);
        const vendor = await vendorService.getVendorById(req.params.id);
        
        if (!vendor) {
            logger.warn(`⚠️ 🏭 [VENDOR] ⚠️ Vendor not found: ${req.params.id}`);
            res.status(404);
            throw new Error('Vendor not found');
        }

        if (vendor.userId !== req.user.id) {
            logger.warn(`🛑 🏭 [VENDOR] ⚠️ Unauthorized access attempt for vendor ${req.params.id} by user ${req.user.id}`);
            res.status(403);
            throw new Error('Not authorized to view this vendor');
        }

        logger.info(`🏭 [VENDOR] ✅ Successfully fetched vendor: ${vendor.displayName}`);
        res.status(200).json({ success: true, data: vendor });
    } catch (error) {
        logger.error(`🚨 🏭 [VENDOR] ❌ Error fetching vendor ${req.params.id}: ${error.message}`);
        next(error);
    }
};

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res, next) => {
    try {
        const payload = { ...req.body, userId: req.user.id };
        logger.debug(`🐞 🏭 [VENDOR] 📝 Creating new vendor for user ${req.user.id}`);
        logger.debug(`🐞 🏭 [VENDOR] 📧 Email: ${payload.email}`);

        const vendor = await vendorService.createVendor(payload);
        logger.info(`🏭 [VENDOR] ✅ New vendor created successfully: ${vendor.displayName} (ID: ${vendor.id})`);
        res.status(201).json({ success: true, data: vendor });
    } catch (error) {
        logger.error(`🚨 🏭 [VENDOR] ❌ Error creating vendor: ${error.message}`);
        next(error);
    }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res, next) => {
    try {
        logger.debug(`🐞 🏭 [VENDOR] ✏️ Updating vendor: ${req.params.id}`);

        const vendor = await vendorService.getVendorById(req.params.id);

        if (!vendor) {
            logger.warn(`⚠️ 🏭 [VENDOR] ⚠️ Vendor not found for update: ${req.params.id}`);
            res.status(404);
            throw new Error('Vendor not found');
        }

        if (vendor.userId !== req.user.id) {
            logger.warn(`🛑 🏭 [VENDOR] ⚠️ Unauthorized update attempt for vendor ${req.params.id} by user ${req.user.id}`);
            res.status(403);
            throw new Error('Not authorized to update this vendor');
        }

        logger.debug(`🐞 🏭 [VENDOR] 📝 Update data provided`);
        const updatedVendor = await vendorService.updateVendor(req.params.id, req.body);
        
        logger.info(`🏭 [VENDOR] ✅ Vendor updated successfully: ${updatedVendor.displayName} (ID: ${updatedVendor.id})`);
        res.status(200).json({ success: true, data: updatedVendor });
    } catch (error) {
        logger.error(`🚨 🏭 [VENDOR] ❌ Error updating vendor ${req.params.id}: ${error.message}`);
        next(error);
    }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res, next) => {
    try {
        logger.debug(`🐞 🏭 [VENDOR] 🗑️ Deleting vendor: ${req.params.id}`);

        const vendor = await vendorService.getVendorById(req.params.id);

        if (!vendor) {
            logger.warn(`⚠️ 🏭 [VENDOR] ⚠️ Vendor not found for deletion: ${req.params.id}`);
            res.status(404);
            throw new Error('Vendor not found');
        }

        if (vendor.userId !== req.user.id) {
            logger.warn(`🛑 🏭 [VENDOR] ⚠️ Unauthorized deletion attempt for vendor ${req.params.id} by user ${req.user.id}`);
            res.status(403);
            throw new Error('Not authorized to delete this vendor');
        }

        await vendorService.deleteVendor(req.params.id);
        logger.info(`🏭 [VENDOR] ✅ Vendor deleted successfully (ID: ${req.params.id})`);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        logger.error(`🚨 🏭 [VENDOR] ❌ Error deleting vendor ${req.params.id}: ${error.message}`);
        next(error);
    }
};

module.exports = {
    getVendors,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
};
