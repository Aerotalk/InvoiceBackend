const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { validateChallan } = require('../validators/challanValidator');
const { 
    createChallan, 
    getChallans, 
    getChallanById,
    downloadChallanPdf,
    updateChallan,
    deleteChallan
} = require('../controllers/challanController');

// Standard API Routes
router.route('/')
    .post(protect, validateChallan, createChallan)
    .get(protect, getChallans);

router.route('/:id')
    .get(protect, getChallanById)
    .put(protect, validateChallan, updateChallan)
    .delete(protect, deleteChallan);

// Generate/Download PDF 
router.route('/:id/pdf')
    .get(protect, downloadChallanPdf);

module.exports = router;
