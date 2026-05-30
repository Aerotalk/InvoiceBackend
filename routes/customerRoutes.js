const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createCustomer)
    .get(protect, getCustomers);

router.route('/:id')
    .get(protect, getCustomerById);

module.exports = router;
