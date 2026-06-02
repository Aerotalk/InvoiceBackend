const express = require('express');
const quotationController = require('../controllers/quotationController');
const { protect } = require('../middlewares/authMiddleware');
const validateRequest = require('../middlewares/validateRequest');
const { quotationSchema } = require('../validators/quotationValidator');

const router = express.Router();

// All routes are protected
router.use(protect);

router.route('/')
    .get(quotationController.getQuotations)
    .post(validateRequest(quotationSchema), quotationController.createQuotation);

router.route('/:id')
    .get(quotationController.getQuotationById)
    .put(validateRequest(quotationSchema), quotationController.updateQuotation)
    .delete(quotationController.deleteQuotation);

router.route('/:id/pdf')
    .get(quotationController.generatePdf);

module.exports = router;
