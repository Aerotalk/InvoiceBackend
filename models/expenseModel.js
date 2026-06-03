const prisma = require('./index');

const ExpenseModel = {
    async createExpense(data) {
        return prisma.expense.create({
            data
        });
    },
    async createManyExpenses(dataArray) {
        return prisma.expense.createMany({
            data: dataArray
        });
    },
    async findExpenseById(id) {
        return prisma.expense.findUnique({
            where: { id },
            include: {
                customer: true,
                vendor: true,
                project: true,
                user: true
            }
        });
    },
    async findAllExpenses(userId) {
        return prisma.expense.findMany({
            where: userId ? { userId } : {},
            include: {
                customer: true,
                vendor: true,
                project: true
            },
            orderBy: { createdAt: 'desc' }
        });
    },
    async deleteExpense(id) {
        return prisma.expense.delete({
            where: { id }
        });
    },
    async updateExpense(id, data) {
        return prisma.expense.update({
            where: { id },
            data,
            include: {
                customer: true,
                vendor: true,
                project: true
            }
        });
    }
};

module.exports = ExpenseModel;
