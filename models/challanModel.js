const prisma = require('./index');

const ChallanModel = {
    async createChallan(data) {
        return prisma.deliveryChallan.create({
            data,
            include: {
                customer: true,
                items: {
                    include: { product: true }
                }
            }
        });
    },
    async findChallanById(id) {
        return prisma.deliveryChallan.findUnique({
            where: { id },
            include: {
                customer: true,
                user: true,
                items: {
                    include: { product: true }
                }
            }
        });
    },
    async findAllChallans(userId) {
        return prisma.deliveryChallan.findMany({
            where: userId ? { userId } : {},
            include: {
                customer: true,
                items: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};

module.exports = ChallanModel;
