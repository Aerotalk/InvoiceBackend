const prisma = require('./index');

const VendorModel = {
    async createVendor(data) {
        return prisma.vendor.create({ 
            data
        });
    },
    async findVendorById(id) {
        return prisma.vendor.findUnique({ 
            where: { id },
            include: {
                contactPersons: true,
                customFields: true,
                expenses: true,
                projectVendors: true
            }
        });
    },
    async updateVendor(id, updates, tx) {
        const db = tx || prisma;
        return db.vendor.update({
            where: { id },
            data: updates,
            include: {
                contactPersons: true,
                customFields: true
            }
        });
    },
    async deleteVendor(where) {
        return prisma.vendor.deleteMany({ where });
    },
    async findAllVendors(userId) {
        const whereClause = userId ? { userId } : {};
        return prisma.vendor.findMany({ 
            where: whereClause,
            include: {
                expenses: true
            }
        });
    }
};

module.exports = VendorModel;
