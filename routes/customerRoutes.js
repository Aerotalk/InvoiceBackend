const express = require('express');
const router = express.Router();
const { createCustomer, getCustomers, getCustomerById } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { customerSchema } = require('../validators/customerValidator');

router.route('/')
    .post(protect, validateRequest(customerSchema), createCustomer)
    .get(protect, getCustomers);

router.route('/:id')
    .get(protect, getCustomerById);

module.exports = router;
