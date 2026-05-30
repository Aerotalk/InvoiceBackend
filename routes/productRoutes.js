const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createProduct)
    .get(protect, getProducts);

router.route('/:id')
    .get(protect, getProductById);

module.exports = router;
