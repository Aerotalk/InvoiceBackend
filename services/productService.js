const prisma = require('../models/index');
const AppError = require('../utils/AppError');

// Helper to map frontend TaxPreference string to Prisma Enum
const mapTaxPreference = (taxPref) => {
    switch (taxPref) {
        case 'Taxable': return 'TAXABLE';
        case 'Tax Exempt': return 'TAX_EXEMPT';
        case 'Non-Taxable': return 'NON_TAXABLE';
        case 'Out of Scope': return 'OUT_OF_SCOPE';
        case 'Non-GST Supply': return 'NON_GST_SUPPLY';
        default: return 'TAXABLE';
    }
};

const createProduct = async (userId, data) => {
    const {
        name, type, unit, hsnCode, taxPreference, 
        intraStateTaxRate, interStateTaxRate, sellingPrice, 
        description, imageUrl
    } = data;

    const productPayload = {
        userId,
        name,
        type: type === 'service' ? 'SERVICE' : 'GOODS',
        unit,
        hsnCode: hsnCode || null,
        taxPreference: mapTaxPreference(taxPreference),
        intraStateTaxRate: intraStateTaxRate || null,
        interStateTaxRate: interStateTaxRate || null,
        sellingPrice: Number(sellingPrice),
        description: description || null,
        itemImage: imageUrl || null
    };

    return await prisma.product.create({
        data: productPayload
    });
};

const getProducts = async (userId) => {
    return await prisma.product.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
    });
};

const getProductById = async (userId, productId) => {
    const product = await prisma.product.findFirst({
        where: { id: productId, userId }
    });

    if (!product) {
        throw new AppError("Product not found", 404);
    }
    return product;
};

const updateProduct = async (userId, productId, data) => {
    const product = await prisma.product.findFirst({
        where: { id: productId, userId }
    });

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    const {
        name, type, unit, hsnCode, taxPreference, 
        intraStateTaxRate, interStateTaxRate, sellingPrice, 
        description, imageUrl
    } = data;

    const updates = {
        name,
        type: type === 'service' ? 'SERVICE' : 'GOODS',
        unit,
        hsnCode: hsnCode || null,
        taxPreference: mapTaxPreference(taxPreference),
        intraStateTaxRate: intraStateTaxRate || null,
        interStateTaxRate: interStateTaxRate || null,
        sellingPrice: Number(sellingPrice),
        description: description || null,
    };

    if (imageUrl !== undefined) {
        updates.itemImage = imageUrl;
    }

    return await prisma.product.update({
        where: { id: productId },
        data: updates
    });
};

const deleteProduct = async (userId, productId) => {
    const product = await prisma.product.findFirst({
        where: { id: productId, userId }
    });

    if (!product) {
        throw new AppError("Product not found", 404);
    }

    await prisma.product.delete({
        where: { id: productId }
    });

    return { message: "Product deleted successfully" };
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
