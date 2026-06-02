require('dotenv').config();
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

async function testSign() {
    const s3 = new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION === 'auto' ? 'us-east-1' : process.env.S3_REGION,
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
        },
        forcePathStyle: true
    });

    try {
        const command = new GetObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: "AVATAR/file-123.jpg" // dummy
        });
        
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
        console.log("SIGNED URL:", signedUrl);
        
        const fetch = (await import('node-fetch')).default;
        const res = await fetch(signedUrl);
        console.log("FETCH STATUS:", res.status);
        console.log("FETCH BODY:", await res.text());
    } catch (e) {
        console.error("ERROR:", e);
    }
}
testSign();
