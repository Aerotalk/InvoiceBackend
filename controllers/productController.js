const productService = require('../services/productService');
const logger = require('../utils/logger');

const createProduct = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new product/item... 📦`);
        const payload = { ...req.body, userId: req.user.id };
        const product = await productService.createProduct(payload);
        logger.info(`🎉 Successfully created product: ${product.name} 🏷️ ✅`);
        res.status(201).json({ success: true, data: product });
    } catch (error) {
        logger.error(`❌ Failed to create product: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getProducts = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching products for user ${req.user.id}... 🔍`);
        const products = await productService.getProductsByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${products.length} products! 🚀`);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        logger.error(`❌ Error fetching products: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getProductById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching product details for ID: ${req.params.id}... 🔎`);
        const product = await productService.getProductById(req.params.id);
        
        if (product.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for product ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this product' });
        }

        logger.info(`✅ Successfully fetched product details for ${product.name} 📈`);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        logger.error(`❌ Product not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById
};
