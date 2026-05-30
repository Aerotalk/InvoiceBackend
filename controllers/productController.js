const productService = require('../services/productService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createProduct = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new product/item... 📦`);
    const payload = { ...req.body, userId: req.user.id };
    const product = await productService.createProduct(payload);
    logger.info(`🎉 Successfully created product: ${product.name} 🏷️ ✅`);
    res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching products for user ${req.user.id}... 🔍`);
    const products = await productService.getProductsByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${products.length} products! 🚀`);
    res.status(200).json({ success: true, data: products });
});

const getProductById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching product details for ID: ${req.params.id}... 🔎`);
    const product = await productService.getProductById(req.params.id);
    
    if (product.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for product ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this product', 403);
    }

    logger.info(`✅ Successfully fetched product details for ${product.name} 📈`);
    res.status(200).json({ success: true, data: product });
});

module.exports = {
    createProduct,
    getProducts,
    getProductById
};
