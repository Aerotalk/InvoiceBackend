const productService = require('../services/productService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');

const createProduct = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new product/item... 📦`);
    const product = await productService.createProduct(req.user.id, req.body);
    logger.info(`🎉 Successfully created product: ${product.name} 🏷️ ✅`);
    res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching products for user ${req.user.id}... 🔍`);
    const products = await productService.getProducts(req.user.id);
    logger.info(`✅ Successfully fetched ${products.length} products! 🚀`);
    res.status(200).json({ success: true, data: products });
});

const getProductById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching product details for ID: ${req.params.id}... 🔎`);
    const product = await productService.getProductById(req.user.id, req.params.id);
    logger.info(`✅ Successfully fetched product details for ${product.name} 📈`);
    res.status(200).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res, next) => {
    logger.info(`✏️ Updating product details for ID: ${req.params.id}... 📦`);
    const product = await productService.updateProduct(req.user.id, req.params.id, req.body);
    logger.info(`✅ Successfully updated product: ${product.name} 🏷️ ✅`);
    res.status(200).json({ success: true, data: product });
});

const deleteProduct = asyncHandler(async (req, res, next) => {
    logger.info(`🗑️ Deleting product ID: ${req.params.id}... ❌`);
    await productService.deleteProduct(req.user.id, req.params.id);
    logger.info(`✅ Successfully deleted product 🚀`);
    res.status(200).json({ success: true, data: {} });
});

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
