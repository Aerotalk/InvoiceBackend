const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const quotationService = require('../services/quotationService');

const createQuotation = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const quotation = await quotationService.createQuotation(userId, req.body);
    
    res.status(201).json({
        status: 'success',
        data: quotation
    });
});

const getQuotations = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const quotations = await quotationService.getQuotations(userId);
    
    res.status(200).json({
        status: 'success',
        results: quotations.length,
        data: quotations
    });
});

const getQuotationById = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const quotation = await quotationService.getQuotationById(userId, req.params.id);
    
    res.status(200).json({
        status: 'success',
        data: quotation
    });
});

const updateQuotation = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const quotation = await quotationService.updateQuotation(userId, req.params.id, req.body);
    
    res.status(200).json({
        status: 'success',
        data: quotation
    });
});

const deleteQuotation = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    await quotationService.deleteQuotation(userId, req.params.id);
    
    res.status(204).json({
        status: 'success',
        data: null
    });
});

const generatePdf = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const pdfBuffer = await quotationService.generatePdf(userId, req.params.id);
    
    const quotation = await quotationService.getQuotationById(userId, req.params.id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${quotation.quoteNumber}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.status(200).send(pdfBuffer);
});

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    generatePdf
};
