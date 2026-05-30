const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const uploadFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        logger.warn(`⚠️ Upload attempted but no file was provided`);
        throw new AppError('No file uploaded', 400);
    }

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    logger.info(`✅ File uploaded successfully: ${req.file.filename}`);
    
    res.status(200).json({ 
        success: true, 
        data: {
            url: fileUrl,
            filename: req.file.filename,
            mimetype: req.file.mimetype
        }
    });
});

module.exports = {
    uploadFile
};
