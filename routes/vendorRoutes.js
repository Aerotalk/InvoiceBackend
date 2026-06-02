const express = require('express');
const router = express.Router();
const { createVendor, getVendors, getVendorById, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { vendorSchema, updateVendorSchema } = require('../validators/vendorValidator');

router.route('/')
    .post(protect, validateRequest(vendorSchema), createVendor)
    .get(protect, getVendors);

router.route('/:id')
    .get(protect, getVendorById)
    .put(protect, validateRequest(updateVendorSchema), updateVendor)
    .delete(protect, deleteVendor);

module.exports = router;
