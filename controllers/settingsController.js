const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const getSettings = asyncHandler(async (req, res, next) => {
    logger.info(`⚙️ Fetching settings for user ${req.user.id}... 🔍`);
    const settings = await settingsService.getSettings(req.user.id);
    res.status(200).json({ success: true, data: settings });
});

const updateSettings = asyncHandler(async (req, res, next) => {
    logger.info(`⚙️ Updating settings for user ${req.user.id}... 🔄`);
    const updatedSettings = await settingsService.updateSettings(req.user.id, req.body);
    logger.info(`✅ Successfully updated settings! 💾`);
    res.status(200).json({ success: true, data: updatedSettings });
});

module.exports = {
    getSettings,
    updateSettings
};
