const prisma = require('./index');

const UserModel = {
    async createUser(data) {
        return prisma.user.create({ data });
    },
    async findUserById(id) {
        return prisma.user.findUnique({ where: { id } });
    },
    async findUserByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    },
    async updateUser(id, updates, tx) {
        const db = tx || prisma;
        return db.user.update({
            where: { id },
            data: updates,
        });
    },
    async deleteUser(where) {
        return prisma.user.deleteMany({ where });
    }
};

module.exports = UserModel;
