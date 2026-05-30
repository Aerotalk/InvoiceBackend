const ProductModel = require('../models/productModel');

const createProduct = async (data) => {
    if (!data.name || data.sellingPrice === undefined || !data.userId) {
        throw new Error('Name, Selling Price, and User ID are required');
    }
    
    const sellingPrice = parseFloat(data.sellingPrice);
    if (isNaN(sellingPrice)) {
        throw new Error('Selling price must be a valid number');
    }

    const productData = {
        ...data,
        sellingPrice
    };

    return await ProductModel.createProduct(productData);
};

const getProductsByUser = async (userId) => {
    return await ProductModel.findAllProducts(userId);
};

const getProductById = async (id) => {
    const product = await ProductModel.findProductById(id);
    if (!product) throw new Error('Product not found');
    return product;
};

module.exports = {
    createProduct,
    getProductsByUser,
    getProductById
};
