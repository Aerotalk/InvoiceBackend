const VendorModel = require('../models/vendorModel');

const createVendor = async (data) => {
    if (!data.displayName || !data.email || !data.userId) {
        throw new Error('Display Name, Email, and User ID are required');
    }
    
    const { contactPersons, customFields, ...vendorData } = data;
    
    const prismaCreateData = {
        ...vendorData,
        contactPersons: contactPersons && contactPersons.length > 0 ? {
            create: contactPersons
        } : undefined,
        customFields: customFields && customFields.length > 0 ? {
            create: customFields
        } : undefined
    };

    return await VendorModel.createVendor(prismaCreateData);
};

const getVendorsByUser = async (userId) => {
    return await VendorModel.findAllVendors(userId);
};

const getVendorById = async (id) => {
    const vendor = await VendorModel.findVendorById(id);
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
};

module.exports = {
    createVendor,
    getVendorsByUser,
    getVendorById
};
