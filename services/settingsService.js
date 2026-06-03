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
    } else if (settings.billingAddresses && Array.isArray(settings.billingAddresses)) {
        // Parse stored JSON strings back into objects
        settings.billingAddresses = settings.billingAddresses.map(addr => {
            try {
                return typeof addr === 'string' ? JSON.parse(addr) : addr;
            } catch(e) {
                return addr;
            }
        });
    }
    
    return settings;
};

const updateSettings = async (userId, data) => {
    if (data.standardTaxGst !== undefined) {
        data.standardTaxGst = parseFloat(data.standardTaxGst) || 0;
    }

    if (data.billingAddresses && Array.isArray(data.billingAddresses)) {
        // Convert objects to JSON strings since schema expects String[]
        data.billingAddresses = data.billingAddresses.map(addr => {
            if (typeof addr === 'object' && addr !== null) {
                return JSON.stringify(addr);
            }
            return String(addr);
        });
    }

    return await SettingsModel.upsertSettings(userId, data);
};

module.exports = {
    getSettings,
    updateSettings
};
