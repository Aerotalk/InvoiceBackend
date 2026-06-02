const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
require('dotenv').config();

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION === 'auto' ? 'us-east-1' : process.env.S3_REGION,
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

async function testSign() {
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: "AVATAR/file-123.jpg" // Dummy key
        });
        
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        console.log("Signed URL:", signedUrl);
    } catch (e) {
        console.error("Error signing URL:", e);
    }
}
testSign();
