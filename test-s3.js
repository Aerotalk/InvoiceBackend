require('dotenv').config();
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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
        const command = new PutObjectCommand({
            Bucket: process.env.S3_BUCKET,
            Key: "test/test-file.txt",
            Body: "test",
            ContentType: "text/plain"
        });
        const response = await s3.send(command);
        console.log("Upload successful:", response.$metadata.httpStatusCode);
    } catch (err) {
        console.error("Upload failed:");
        console.error(err);
    }
}
testUpload();
