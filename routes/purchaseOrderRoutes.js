const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .post(purchaseOrderController.createPurchaseOrder)
    .get(purchaseOrderController.getPurchaseOrders);

router.route('/:id')
    .get(purchaseOrderController.getPurchaseOrderById)
    .put(purchaseOrderController.updatePurchaseOrder)
    .delete(purchaseOrderController.deletePurchaseOrder);

router.route('/:id/pdf')
    .get(purchaseOrderController.generatePdf);

module.exports = router;
