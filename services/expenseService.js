const ExpenseModel = {
    async createExpense(data) {
        return require('../models/expenseModel').createExpense(data);
    },
    async createManyExpenses(dataArray) {
        return require('../models/expenseModel').createManyExpenses(dataArray);
    },
    async findExpenseById(id) {
        return require('../models/expenseModel').findExpenseById(id);
    },
    async findAllExpenses(userId) {
        return require('../models/expenseModel').findAllExpenses(userId);
    },
    async deleteExpense(id) {
        return require('../models/expenseModel').deleteExpense(id);
    },
    async updateExpense(id, data) {
        return require('../models/expenseModel').updateExpense(id, data);
    }
};

const expenseService = {
    async createExpense(userId, expenseData) {
        const payload = {
            ...expenseData,
            userId,
            date: new Date(expenseData.date),
            taxableAmount: parseFloat(expenseData.taxableAmount || 0),
            taxAmount: parseFloat(expenseData.taxAmount || 0)
        };
        
        // Map clientId to customerId if present
        if (payload.clientId) {
            payload.customerId = payload.clientId;
        }

        // Clean out undefined or empty relations if not selected
        if (!payload.customerId) delete payload.customerId;
        if (!payload.vendorId) delete payload.vendorId;
        if (!payload.projectId) delete payload.projectId;

        // Clean out frontend extra keys
        delete payload.clientId;
        delete payload.clientName;
        delete payload.vendorName;
        delete payload.projectName;

        return ExpenseModel.createExpense(payload);
    },
    async createExpensesBulk(userId, expensesArray) {
        const payload = expensesArray.map(expenseData => {
            const exp = {
                ...expenseData,
                userId,
                date: new Date(expenseData.date),
                taxableAmount: parseFloat(expenseData.taxableAmount || 0),
                taxAmount: parseFloat(expenseData.taxAmount || 0)
            };
            
            if (exp.clientId) {
                exp.customerId = exp.clientId;
            }

            if (!exp.customerId) delete exp.customerId;
            if (!exp.vendorId) delete exp.vendorId;
            if (!exp.projectId) delete exp.projectId;

            delete exp.clientId;
            delete exp.clientName;
            delete exp.vendorName;
            delete exp.projectName;
            
            return exp;
        });

        return ExpenseModel.createManyExpenses(payload);
    },
    async getExpenses(userId) {
        const expenses = await ExpenseModel.findAllExpenses(userId);
        return expenses.map(exp => ({
            ...exp,
            clientName: exp.customer ? (exp.customer.displayName || exp.customer.companyName) : null,
            vendorName: exp.vendor ? (exp.vendor.displayName || exp.vendor.companyName) : null,
            projectName: exp.project ? exp.project.projectName : null
        }));
    },
    async getExpenseById(id, userId) {
        const expense = await ExpenseModel.findExpenseById(id);
        if (!expense || expense.userId !== userId) {
            throw new Error('Expense not found or unauthorized');
        }
        return expense;
    },
    async deleteExpense(id, userId) {
        const expense = await ExpenseModel.findExpenseById(id);
        if (!expense || expense.userId !== userId) {
            throw new Error('Expense not found or unauthorized');
        }
        return ExpenseModel.deleteExpense(id);
    },
    async updateExpense(id, userId, expenseData) {
        const expense = await ExpenseModel.findExpenseById(id);
        if (!expense || expense.userId !== userId) {
            throw new Error('Expense not found or unauthorized');
        }

        const payload = {
            ...expenseData
        };
        
        if (payload.date) payload.date = new Date(payload.date);
        if (payload.taxableAmount !== undefined) payload.taxableAmount = parseFloat(payload.taxableAmount || 0);
        if (payload.taxAmount !== undefined) payload.taxAmount = parseFloat(payload.taxAmount || 0);
        
        if (payload.clientId) payload.customerId = payload.clientId;

        if (payload.customerId === '') payload.customerId = null;
        if (payload.vendorId === '') payload.vendorId = null;
        if (payload.projectId === '') payload.projectId = null;

        delete payload.clientId;
        delete payload.clientName;
        delete payload.vendorName;
        delete payload.projectName;
        
        return ExpenseModel.updateExpense(id, payload);
    }
};

module.exports = expenseService;
