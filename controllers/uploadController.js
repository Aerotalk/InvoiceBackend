const logger = require('../utils/logger');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const prisma = require('../models/index');

const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION === 'auto' ? 'us-east-1' : process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

const uploadFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        logger.warn(`⚠️ Upload attempted but no file was provided`);
        throw new AppError('No file uploaded', 400);
    }

    const key = req.file.key || req.file.filename;
    
    // Instead of raw S3 URL, return our proxy endpoint so private buckets work seamlessly
    const fileUrl = `${req.protocol}://${req.get('host')}/api/upload/view?key=${encodeURIComponent(key)}`;

    // Save metadata to database
    await prisma.uploadedFile.create({
        data: {
            originalName: req.file.originalname || key,
            key: key,
            url: fileUrl,
            mimeType: req.file.mimetype,
            size: req.file.size || 0,
            userId: req.user ? req.user.id : null,
        }
    });

    logger.info(`✅ File uploaded successfully to S3 & DB. Proxy URL: ${fileUrl}`);
    
    res.status(200).json({ 
        success: true, 
        data: {
            url: fileUrl,
            filename: key,
            mimetype: req.file.mimetype
        }
    });
});

const viewFile = asyncHandler(async (req, res, next) => {
    const { key } = req.query;
    if (!key) {
        return next(new AppError('No file key provided', 400));
    }

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key
        });
        
        // Generate a pre-signed URL valid for 1 hour
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        
        // Redirect the browser to the temporary pre-signed URL
        res.redirect(signedUrl);
    } catch (error) {
        logger.error(`Error generating signed URL for key ${key}: ${error.message}`);
        res.status(500).send('Error accessing file');
    }
});

module.exports = {
    uploadFile,
    viewFile
};
