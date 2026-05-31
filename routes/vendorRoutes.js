const express = require('express');
const router = express.Router();
const { createVendor, getVendors, getVendorById, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createVendor)
    .get(protect, getVendors);

router.route('/:id')
    .get(protect, getVendorById)
    .put(protect, updateVendor)
    .delete(protect, deleteVendor);

module.exports = router;
