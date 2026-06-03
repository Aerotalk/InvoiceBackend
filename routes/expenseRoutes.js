const express = require('express');
const router = express.Router();
const { 
    createExpense,
    createExpensesBulk,
    getExpenses,
    deleteExpense,
    updateExpense
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createExpense)
    .get(protect, getExpenses);

router.route('/bulk')
    .post(protect, createExpensesBulk);

router.route('/:id')
    .put(protect, updateExpense)
    .delete(protect, deleteExpense);

module.exports = router;
