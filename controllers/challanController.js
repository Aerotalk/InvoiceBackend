const challanService = require('../services/challanService');
const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const createChallan = asyncHandler(async (req, res, next) => {
    logger.info(`✨ Attempting to create a new delivery challan... 🚚`);
    const payload = { ...req.body, userId: req.user.id };
    const challan = await challanService.createChallan(payload);
    logger.info(`🎉 Successfully created delivery challan: ${challan.challanNumber} 📦 ✅`);
    res.status(201).json({ success: true, data: challan });
});

const getChallans = asyncHandler(async (req, res, next) => {
    logger.info(`📋 Fetching delivery challans for user ${req.user.id}... 🔍`);
    const challans = await challanService.getChallansByUser(req.user.id);
    logger.info(`✅ Successfully fetched ${challans.length} delivery challans! 🚀`);
    res.status(200).json({ success: true, data: challans });
});

const getChallanById = asyncHandler(async (req, res, next) => {
    logger.info(`🔍 Fetching delivery challan details for ID: ${req.params.id}... 🔎`);
    const challan = await challanService.getChallanById(req.params.id);
    
    if (challan.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized access attempt for challan ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to view this challan', 403);
    }

    logger.info(`✅ Successfully fetched delivery challan details for ${challan.challanNumber} 📈`);
    res.status(200).json({ success: true, data: challan });
});

const downloadChallanPdf = asyncHandler(async (req, res, next) => {
    logger.info(`🖨️ Generating PDF for delivery challan ID: ${req.params.id}... ⏳`);
    const challan = await challanService.getChallanById(req.params.id);
    
    if (challan.userId !== req.user.id) {
        logger.warn(`🛑 Unauthorized PDF download attempt for challan ${req.params.id} by user ${req.user.id} 🔒`);
        throw new AppError('Not authorized to download this challan', 403);
    }

    const pdfBuffer = await challanService.generatePdf(req.params.id);
    logger.info(`🎉 Successfully generated PDF for delivery challan: ${challan.challanNumber} 📄 ✅`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${challan.challanNumber}.pdf`);
    res.status(200).send(pdfBuffer);
});

module.exports = {
    createChallan,
    getChallans,
    getChallanById,
    downloadChallanPdf
};
