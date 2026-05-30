const challanService = require('../services/challanService');
const logger = require('../utils/logger');

const createChallan = async (req, res, next) => {
    try {
        logger.info(`✨ Attempting to create a new delivery challan... 🚚`);
        const payload = { ...req.body, userId: req.user.id };
        const challan = await challanService.createChallan(payload);
        logger.info(`🎉 Successfully created delivery challan: ${challan.challanNumber} 📦 ✅`);
        res.status(201).json({ success: true, data: challan });
    } catch (error) {
        logger.error(`❌ Failed to create delivery challan: ${error.message} 📉 ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getChallans = async (req, res, next) => {
    try {
        logger.info(`📋 Fetching delivery challans for user ${req.user.id}... 🔍`);
        const challans = await challanService.getChallansByUser(req.user.id);
        logger.info(`✅ Successfully fetched ${challans.length} delivery challans! 🚀`);
        res.status(200).json({ success: true, data: challans });
    } catch (error) {
        logger.error(`❌ Error fetching delivery challans: ${error.message} ⚠️`);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getChallanById = async (req, res, next) => {
    try {
        logger.info(`🔍 Fetching delivery challan details for ID: ${req.params.id}... 🔎`);
        const challan = await challanService.getChallanById(req.params.id);
        
        if (challan.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized access attempt for challan ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to view this challan' });
        }

        logger.info(`✅ Successfully fetched delivery challan details for ${challan.challanNumber} 📈`);
        res.status(200).json({ success: true, data: challan });
    } catch (error) {
        logger.error(`❌ Delivery Challan not found: ${error.message} 💥`);
        res.status(404).json({ success: false, message: error.message });
    }
};

const downloadChallanPdf = async (req, res, next) => {
    try {
        logger.info(`🖨️ Generating PDF for delivery challan ID: ${req.params.id}... ⏳`);
        const challan = await challanService.getChallanById(req.params.id);
        
        if (challan.userId !== req.user.id) {
            logger.warn(`🛑 Unauthorized PDF download attempt for challan ${req.params.id} by user ${req.user.id} 🔒`);
            return res.status(403).json({ success: false, message: 'Not authorized to download this challan' });
        }

        const pdfBuffer = await challanService.generatePdf(req.params.id);
        logger.info(`🎉 Successfully generated PDF for delivery challan: ${challan.challanNumber} 📄 ✅`);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${challan.challanNumber}.pdf`);
        res.status(200).send(pdfBuffer);
    } catch (error) {
        logger.error(`❌ Failed to generate PDF: ${error.message} 💥`);
        res.status(500).json({ success: false, message: 'Failed to generate PDF' });
    }
};

module.exports = {
    createChallan,
    getChallans,
    getChallanById,
    downloadChallanPdf
};
