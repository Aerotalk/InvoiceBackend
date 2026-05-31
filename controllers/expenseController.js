const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const expenseService = require('../services/expenseService');
const logger = require('../utils/logger');

const createExpense = asyncHandler(async (req, res, next) => {
    logger.info(`📝 Creating new expense for user: ${req.user.id}`);
    const expense = await expenseService.createExpense(req.user.id, req.body);
    
    res.status(201).json({
        success: true,
        data: expense,
        message: 'Expense created successfully'
    });
});

const createExpensesBulk = asyncHandler(async (req, res, next) => {
    logger.info(`📦 Creating bulk expenses for user: ${req.user.id}`);
    if (!Array.isArray(req.body)) {
        return next(new AppError('Expected an array of expenses', 400));
    }
    const result = await expenseService.createExpensesBulk(req.user.id, req.body);
    
    res.status(201).json({
        success: true,
        data: result,
        message: `${result.count || req.body.length} expenses created successfully in bulk`
    });
});

const getExpenses = asyncHandler(async (req, res, next) => {
    logger.info(`📊 Fetching expenses for user: ${req.user.id}`);
    const expenses = await expenseService.getExpenses(req.user.id);
    
    res.status(200).json({
        success: true,
        count: expenses.length,
        data: expenses
    });
});

const deleteExpense = asyncHandler(async (req, res, next) => {
    logger.info(`🗑️ Deleting expense ID: ${req.params.id}`);
    await expenseService.deleteExpense(req.params.id, req.user.id);
    
    res.status(200).json({
        success: true,
        data: {},
        message: 'Expense deleted successfully'
    });
});

module.exports = {
    createExpense,
    createExpensesBulk,
    getExpenses,
    deleteExpense
};
