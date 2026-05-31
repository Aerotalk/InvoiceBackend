const express = require('express');
const router = express.Router();
const { 
    createExpense,
    createExpensesBulk,
    getExpenses,
    deleteExpense
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createExpense)
    .get(protect, getExpenses);

router.route('/bulk')
    .post(protect, createExpensesBulk);

router.route('/:id')
    .delete(protect, deleteExpense);

module.exports = router;
