const quotationService = require('../services/quotationService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createQuotation = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new quotation... 📝`);
    const payload = { ...req.body, userId: req.user.id };
    const quotation = await quotationService.createQuotation(payload);
    logger.info(`🎉 Successfully created quotation: ${quotation.quoteNumber} 📄 ✅`);
    res.status(201).json({ success: true, data: quotation });
});

const getQuotations = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching quotations for user ${req.user.id}... 🔍`);
    const quotations = await quotationService.getQuotationsByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${quotations.length} quotations! 🚀`);
    res.status(200).json({ success: true, data: quotations });
});

const getQuotationById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching quotation details for ID: ${req.params.id}... 🔎`);
    const quotation = await quotationService.getQuotationById(req.params.id);
    
    if (quotation.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for quotation ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this quotation', 403);
    }

    logger.info(`✅ Successfully fetched quotation details for ${quotation.quoteNumber} 📈`);
    res.status(200).json({ success: true, data: quotation });
});

const downloadQuotationPdf = asyncHandler(async (req, res, next) => {
    logger.info(`🖨️ Generating PDF for quotation ID: ${req.params.id}... ⏳`);
    const quotation = await quotationService.getQuotationById(req.params.id);
    
    if (quotation.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized PDF download attempt for quotation ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to download this quotation', 403);
    }

    const pdfBuffer = await quotationService.generatePdf(req.params.id);
    logger.info(`🎉 Successfully generated PDF for quotation: ${quotation.quoteNumber} 📄 ✅`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=${quotation.quoteNumber}.pdf`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.status(200).send(pdfBuffer);
});

const updateQuotation = asyncHandler(async (req, res, next) => {
    logger.info(`📝 Updating quotation ${req.params.id}...`);
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (quotation.userId !== req.user.id) {
        throw new AppError('Not authorized', 403);
    }
    const updated = await quotationService.updateQuotation(req.params.id, req.body);
    res.status(200).json({ success: true, data: updated });
});

const deleteQuotation = asyncHandler(async (req, res, next) => {
    logger.info(`🗑️ Deleting quotation ${req.params.id}...`);
    const quotation = await quotationService.getQuotationById(req.params.id);
    if (quotation.userId !== req.user.id) {
        throw new AppError('Not authorized', 403);
    }
    await quotationService.deleteQuotation(req.params.id);
    res.status(200).json({ success: true, data: {} });
});

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    downloadQuotationPdf,
    updateQuotation,
    deleteQuotation
};
