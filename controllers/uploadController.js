const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const uploadFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        logger.warn(`⚠️ Upload attempted but no file was provided`);
        throw new AppError('No file uploaded', 400);
    }

    // req.file.location is populated by multer-s3
    const fileUrl = req.file.location;

    logger.info(`✅ File uploaded successfully to S3: ${fileUrl}`);
    
    res.status(200).json({ 
        success: true, 
        data: {
            url: fileUrl,
            filename: req.file.key || req.file.filename,
            mimetype: req.file.mimetype
        }
    });
});

module.exports = {
    uploadFile
};
