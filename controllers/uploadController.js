const logger = require('../utils/logger');

const uploadFile = async (req, res, next) => {
    try {
        if (!req.file) {
            logger.warn(`⚠️ Upload attempted but no file was provided`);
            return res.status(400).json({ success: false, message: 'No file uploaded' });
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
    } catch (error) {
        logger.error(`❌ File upload failed: ${error.message}`);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
};

module.exports = {
    uploadFile
};
