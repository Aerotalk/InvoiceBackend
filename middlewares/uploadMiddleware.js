const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const path = require('path');

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION === 'auto' ? 'us-east-1' : process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

const storage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    // acl: 'public-read', // Let's avoid ACLs if bucket owner enforced, or uncomment if needed
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
        // Read folder from body, defaults to 'misc'
        const folder = req.body.folder || 'misc';
        const filename = `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, `${folder}/${filename}`);
    }
});

function checkFileType(file, cb) {
    const filetypes = /jpg|jpeg|png|pdf|doc|docx/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Images and Documents Only!'));
    }
}

const upload = multer({
    storage,
    limits: { fileSize: 10000000 }, // 10MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
});

module.exports = upload;
