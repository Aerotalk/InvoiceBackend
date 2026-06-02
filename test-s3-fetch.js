const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();
const fs = require('fs');

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

async function testUpload() {
    try {
        const fileContent = "dummy test file";
        const key = "test-avatar.txt";
        
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: key,
            Body: fileContent,
            ContentType: "text/plain",
            ACL: "public-read"
        }));
        
        const url = `https://${process.env.S3_BUCKET}.t3.storageapi.dev/${key}`;
        console.log("Uploaded successfully. URL:", url);
        
        // Now try to fetch it
        const res = await fetch(url);
        console.log("Fetch status:", res.status);
        console.log("Fetch body:", await res.text());
        
    } catch (e) {
        console.error("Error:", e);
    }
}
testUpload();
