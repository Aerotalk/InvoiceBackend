const prisma = require('./index');

const ProductModel = {
    async createProduct(data) {
        return prisma.product.create({ data });
    },
    async findProductById(id) {
        return prisma.product.findUnique({ where: { id } });
    },
    async updateProduct(id, updates, tx) {
        const db = tx || prisma;
        return db.product.update({
            where: { id },
            data: updates,
        });
    },
    async deleteProduct(where) {
        return prisma.product.deleteMany({ where });
    },
    async findAllProducts(userId) {
        const whereClause = userId ? { userId } : {};
        return prisma.product.findMany({ where: whereClause });
    }
};

module.exports = ProductModel;
