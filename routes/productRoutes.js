const express = require('express');
const router = express.Router();
const { createProduct, getProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { productSchema } = require('../validators/productValidator');

router.route('/')
    .post(protect, validateRequest(productSchema), createProduct)
    .get(protect, getProducts);

router.route('/:id')
    .get(protect, getProductById)
    .put(protect, validateRequest(productSchema), updateProduct)
    .delete(protect, deleteProduct);

module.exports = router;
