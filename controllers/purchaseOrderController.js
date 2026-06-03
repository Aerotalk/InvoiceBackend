const asyncHandler = require('../utils/asyncHandler');
const purchaseOrderService = require('../services/purchaseOrderService');

const createPurchaseOrder = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const po = await purchaseOrderService.createPurchaseOrder(userId, req.body);
    
    res.status(201).json({
        status: 'success',
        data: po
    });
});

const getPurchaseOrders = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const pos = await purchaseOrderService.getPurchaseOrders(userId);
    
    res.status(200).json({
        status: 'success',
        results: pos.length,
        data: pos
    });
});

const getPurchaseOrderById = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const po = await purchaseOrderService.getPurchaseOrderById(userId, req.params.id);
    
    res.status(200).json({
        status: 'success',
        data: po
    });
});

const updatePurchaseOrder = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const po = await purchaseOrderService.updatePurchaseOrder(userId, req.params.id, req.body);
    
    res.status(200).json({
        status: 'success',
        data: po
    });
});

const deletePurchaseOrder = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    await purchaseOrderService.deletePurchaseOrder(userId, req.params.id);
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

const generatePdf = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const pdfBuffer = await purchaseOrderService.generatePdf(userId, req.params.id);
    
    const po = await purchaseOrderService.getPurchaseOrderById(userId, req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${po.purchaseOrderId}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.status(200).send(pdfBuffer);
});

module.exports = {
    createPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    updatePurchaseOrder,
    deletePurchaseOrder,
    generatePdf
};
