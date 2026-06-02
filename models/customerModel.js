const prisma = require('./index');

const CustomerModel = {
    async createCustomer(data) {
        return prisma.customer.create({ 
            data
        });
    },
    async findCustomerById(id) {
        return prisma.customer.findUnique({ 
            where: { id },
            include: {
                contactPersons: true,
                customFields: true,
                projects: true,
                quotations: true,
                deliveryChallans: true,
                expenses: true
            }
        });
    },
    async updateCustomer(id, updates, tx) {
        const db = tx || prisma;
        return db.customer.update({
            where: { id },
            data: updates,
            include: {
                contactPersons: true,
                customFields: true
            }
        });
    },
    async deleteCustomer(where) {
        return prisma.customer.deleteMany({ where });
    },
    async findAllCustomers(userId) {
        const whereClause = userId ? { userId } : {};
        return prisma.customer.findMany({ 
            where: whereClause,
            include: {
                projects: true,
                quotations: true
            }
        });
    }
};

module.exports = CustomerModel;
