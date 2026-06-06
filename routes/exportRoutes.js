const express = require('express');
const router = express.Router();
const { exportDataToExcel, exportProjectWiseExcel } = require('../controllers/exportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/excel', exportDataToExcel);
router.get('/excel/projects', exportProjectWiseExcel);

module.exports = router;
