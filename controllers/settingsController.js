const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');

const getSettings = async (req, res, next) => {
    try {
        logger.info(`⚙️ Fetching settings for user ${req.user.id}... 🔍`);
        const settings = await settingsService.getSettings(req.user.id);
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        logger.error(`❌ Error fetching settings: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const updateSettings = async (req, res, next) => {
    try {
        logger.info(`⚙️ Updating settings for user ${req.user.id}... 🔄`);
        const updatedSettings = await settingsService.updateSettings(req.user.id, req.body);
        logger.info(`✅ Successfully updated settings! 💾`);
        res.status(200).json({ success: true, data: updatedSettings });
    } catch (error) {
        logger.error(`❌ Failed to update settings: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
