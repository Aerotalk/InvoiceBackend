const express = require('express');
const router = express.Router();
const { 
    createQuotation, 
    getQuotations, 
    getQuotationById,
    downloadQuotationPdf,
    updateQuotation,
    deleteQuotation
} = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createQuotation)
    .get(protect, getQuotations);

router.route('/:id')
    .get(protect, getQuotationById)
    .put(protect, updateQuotation)
    .delete(protect, deleteQuotation);

router.route('/:id/pdf')
    .get(protect, downloadQuotationPdf);

module.exports = router;
