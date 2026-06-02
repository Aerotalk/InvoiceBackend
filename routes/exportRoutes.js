const express = require('express');
const router = express.Router();
const { exportDataToExcel } = require('../controllers/exportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/excel', exportDataToExcel);

module.exports = router;
