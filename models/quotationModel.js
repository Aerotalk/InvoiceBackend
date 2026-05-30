const prisma = require('./index');

const QuotationModel = {
    async createQuotation(data) {
        return prisma.quotation.create({
            data,
            include: {
                customer: true,
                project: true,
                items: {
                    include: { product: true }
                }
            }
        });
    },
    async findQuotationById(id) {
        return prisma.quotation.findUnique({
            where: { id },
            include: {
                customer: true,
                project: true,
                user: true,
                items: {
                    include: { product: true }
                }
            }
        });
    },
    async findAllQuotations(userId) {
        return prisma.quotation.findMany({
            where: userId ? { userId } : {},
            include: {
                customer: true,
                project: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};

module.exports = QuotationModel;
