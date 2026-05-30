const CustomerModel = require('../models/customerModel');

const createCustomer = async (data) => {
    if (!data.displayName || !data.email || !data.userId) {
        throw new Error('Display Name, Email, and User ID are required');
    }
    
    // Convert arrays into Prisma create relations if they exist
    const { contactPersons, customFields, ...customerData } = data;
    
    const prismaCreateData = {
        ...customerData,
        contactPersons: contactPersons && contactPersons.length > 0 ? {
            create: contactPersons
        } : undefined,
        customFields: customFields && customFields.length > 0 ? {
            create: customFields
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
