const quotationService = require('../services/quotationService');
const logger = require('../utils/logger');

const createQuotation = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new quotation... 📝`);
        const payload = { ...req.body, userId: req.user.id };
        const quotation = await quotationService.createQuotation(payload);
        logger.info(`🎉 Successfully created quotation: ${quotation.quoteNumber} 📄 ✅`);
        res.status(201).json({ success: true, data: quotation });
    } catch (error) {
        logger.error(`❌ Failed to create quotation: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getQuotations = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching quotations for user ${req.user.id}... 🔍`);
        const quotations = await quotationService.getQuotationsByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${quotations.length} quotations! 🚀`);
        res.status(200).json({ success: true, data: quotations });
    } catch (error) {
        logger.error(`❌ Error fetching quotations: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getQuotationById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching quotation details for ID: ${req.params.id}... 🔎`);
        const quotation = await quotationService.getQuotationById(req.params.id);
        
        if (quotation.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for quotation ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this quotation' });
        }

        logger.info(`✅ Successfully fetched quotation details for ${quotation.quoteNumber} 📈`);
        res.status(200).json({ success: true, data: quotation });
    } catch (error) {
        logger.error(`❌ Quotation not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

const downloadQuotationPdf = async (req, res, next) => {
    try {
        logger.info(`🖨️ Generating PDF for quotation ID: ${req.params.id}... ⏳`);
        const quotation = await quotationService.getQuotationById(req.params.id);
        
        if (quotation.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized PDF download attempt for quotation ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to download this quotation' });
        }

        const pdfBuffer = await quotationService.generatePdf(req.params.id);
        logger.info(`🎉 Successfully generated PDF for quotation: ${quotation.quoteNumber} 📄 ✅`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${quotation.quoteNumber}.pdf`);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        logger.error(`❌ Failed to generate PDF: ${error.message} 💥`);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

module.exports = {
    createQuotation,
    getQuotations,
    getQuotationById,
    downloadQuotationPdf
};
