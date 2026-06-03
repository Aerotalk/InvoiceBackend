const SettingsModel = require('../models/settingsModel');

const getSettings = async (userId) => {
    let settings = await SettingsModel.getSettingsByUserId(userId);
    
    if (!settings) {
        settings = {
            workspaceBrandName: '',
            billingEmailContact: '',
            adminProfileName: '',
            standardTaxGst: 10,
            standardBaseCurrency: 'INR',
            businessType: '',
            industry: '',
            fiscalYear: '',
            profileAvatarUrl: '',
            brandLogoUrls: [],
            billingAddresses: []
        };
    }
    
    return settings;
};

const updateSettings = async (userId, data) => {
    if (data.standardTaxGst !== undefined) {
        data.standardTaxGst = parseFloat(data.standardTaxGst) || 0;
    }

    return await SettingsModel.upsertSettings(userId, data);
};

module.exports = {
    getSettings,
    updateSettings
};
