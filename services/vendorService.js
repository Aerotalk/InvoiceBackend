const VendorModel = require('../models/vendorModel');

const createVendor = async (data) => {
    if (!data.displayName || !data.email || !data.userId) {
        throw new Error('Display Name, Email, and User ID are required');
    }
    
    const prismaCreateData = {
        vendorType: data.vendorType ? data.vendorType.toUpperCase() : 'BUSINESS',
        displayName: data.displayName,
        primaryContactTitle: data.salutation || 'Mr.',
        primaryContactFirstName: data.firstName || (data.name ? data.name.split(' ')[0] : 'Unknown'),
        primaryContactLastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : 'Unknown'),
        companyName: data.company || null,
        email: data.email,
        vendorLanguage: data.language || 'English',
        workPhoneCode: data.workPhoneCode || null,
        workPhone: data.workPhone || data.phone || null,
        mobilePhoneCode: data.mobileCode || null,
        mobilePhone: data.mobile || null,
        currency: data.currency || 'INR',
        pan: data.pan || null,
        paymentTerms: data.paymentTerms || null,
        websiteUrl: data.website || null,
        department: data.department || null,
        designation: data.designation || null,
        skypeAddress: data.skype || null,
        xProfileLink: data.socialX || null,
        facebookPage: data.socialFacebook || null,
        allowPortalAccess: data.enablePortal || false,
        documentsAttachment: data.avatar || null,

        // Billing
        billingAttention: data.billingAddress?.attention || null,
        billingStreet1: data.billingAddress?.street1 || null,
        billingStreet2: data.billingAddress?.street2 || null,
        billingCountry: data.billingAddress?.country || null,
        billingState: data.billingAddress?.state || null,
        billingCity: data.billingAddress?.city || null,
        billingZipCode: data.billingAddress?.zip || null,
        billingPhone: data.billingAddress?.phone || null,
        billingFax: data.billingAddress?.fax || null,

        // Shipping
        shippingAttention: data.shippingAddress?.attention || null,
        shippingStreet1: data.shippingAddress?.street1 || null,
        shippingStreet2: data.shippingAddress?.street2 || null,
        shippingCountry: data.shippingAddress?.country || null,
        shippingState: data.shippingAddress?.state || null,
        shippingCity: data.shippingAddress?.city || null,
        shippingZipCode: data.shippingAddress?.zip || null,
        shippingPhone: data.shippingAddress?.phone || null,
        shippingFax: data.shippingAddress?.fax || null,

        internalRemarks: data.notes || data.remarks || null,
        userId: data.userId,

        contactPersons: data.contactPersons && data.contactPersons.length > 0 ? {
            create: data.contactPersons.map(cp => ({
                salutation: cp.salutation || '',
                firstName: cp.firstName || '',
                lastName: cp.lastName || '',
                email: cp.email || ''
            }))
        } : undefined,

        customFields: data.customFields && data.customFields.length > 0 ? {
            create: data.customFields.map(cf => ({
                key: cf.label || cf.key || '',
                value: cf.value || ''
            }))
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
