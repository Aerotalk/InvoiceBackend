const { S3Client, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY
    },
    forcePathStyle: true
});

const bucketName = process.env.S3_BUCKET;

const publicReadPolicy = {
    Version: "2012-10-17",
    Statement: [
        {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `arn:aws:s3:::${bucketName}/*`
        }
    ]
};

async function setPolicy() {
    try {
        console.log("Setting bucket policy for:", bucketName);
        await s3.send(new PutBucketPolicyCommand({
            Bucket: bucketName,
            Policy: JSON.stringify(publicReadPolicy)
        }));
        console.log("Bucket policy set to public read!");
    } catch (e) {
        console.error("Error setting policy:", e);
    }
}
setPolicy();
