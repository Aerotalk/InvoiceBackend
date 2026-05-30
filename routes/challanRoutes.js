const express = require('express');
const router = express.Router();
const { 
    createChallan, 
    getChallans, 
    getChallanById,
    downloadChallanPdf
} = require('../controllers/challanController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .post(protect, createChallan)
    .get(protect, getChallans);

router.route('/:id')
    .get(protect, getChallanById);

router.route('/:id/pdf')
    .get(protect, downloadChallanPdf);

module.exports = router;
