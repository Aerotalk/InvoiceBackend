const CustomerModel = require('../models/customerModel');

const createCustomer = async (data) => {
    if (!data.displayName || !data.email || !data.userId) {
        throw new Error('Display Name, Email, and User ID are required');
    }
    
    const prismaCreateData = {
        customerType: data.clientType ? data.clientType.toUpperCase() : 'BUSINESS',
        displayName: data.displayName,
        primaryContactTitle: data.salutation || 'Mr.',
        primaryContactFirstName: data.firstName || (data.name ? data.name.split(' ')[0] : 'Unknown'),
        primaryContactLastName: data.lastName || (data.name ? data.name.split(' ').slice(1).join(' ') : 'Unknown'),
        companyName: data.company || null,
        email: data.email,
        customerLanguage: data.language || 'English',
        workPhoneCode: data.workPhoneCode || null,
        workPhone: data.workPhone || data.phone || null,
        mobilePhoneCode: data.mobileCode || null,
        mobilePhone: data.mobile || null,
        currency: data.currency || 'INR',
        gstTreatment: data.gstTreatment || null,
        gstNumber: data.gstNumber || null,
        pan: data.pan || null,
        paymentTerms: data.paymentTerms || null,
        placeOfSupply: data.placeOfSupply || null,
        taxPreference: data.taxPreference === 'Tax Exempt' ? 'TAX_EXEMPT' : 'TAXABLE',
        websiteUrl: data.website || null,
        department: data.department || null,
        designation: data.designation || null,
        skypeAddress: data.skype || null,
        xProfileLink: data.socialX || null,
        facebookPage: data.socialFacebook || null,
        allowPortalAccess: data.enablePortal || false,
        documentsAttachment: null,
        avatarUrl: data.avatar || null,
        status: data.status || 'active',

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
                email: cp.email || '',
                phone: cp.phone || null
            }))
        } : undefined,

        customFields: data.customFields && data.customFields.length > 0 ? {
            create: data.customFields.map(cf => ({
                key: cf.label || cf.key || '',
                value: cf.value || ''
            }))
        } : undefined
    };

    return await CustomerModel.createCustomer(prismaCreateData);
};

const getCustomersByUser = async (userId) => {
    return await CustomerModel.findAllCustomers(userId);
};

const getCustomerById = async (id) => {
    const customer = await CustomerModel.findCustomerById(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
};

module.exports = {
    createCustomer,
    getCustomersByUser,
    getCustomerById
};
