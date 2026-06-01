const express = require('express');
const router = express.Router();
const { exportDataToExcel } = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/excel', exportDataToExcel);

module.exports = router;
