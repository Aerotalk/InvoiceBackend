const express = require('express');
const router = express.Router();
const { 
    createQuotation, 
    getQuotations, 
    getQuotationById,
    downloadQuotationPdf
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createQuotation)
    .get(protect, getQuotations);

router.route('/:id')
    .get(protect, getQuotationById);

router.route('/:id/pdf')
    .get(protect, downloadQuotationPdf);

module.exports = router;
