const express = require('express');
const router = express.Router();
const { uploadFile, viewFile } = require('../controllers/uploadController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.route('/')
    .post(protect, upload.single('file'), uploadFile);

router.route('/view')
    .get(viewFile);

module.exports = router;
