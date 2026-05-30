const express = require('express');
const router = express.Router();
const { createVendor, getVendors, getVendorById } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createVendor)
    .get(protect, getVendors);

router.route('/:id')
    .get(protect, getVendorById);

module.exports = router;
