const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, getSettings)
    .put(protect, updateSettings);

module.exports = router;
