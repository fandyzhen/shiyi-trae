import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let r2Client: S3Client | null = null;

export function getR2Client(): S3Client {
  if (!r2Client) {
    r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string = 'image/jpeg'
): Promise<string> {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME!;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export function generateR2Key(userId: string | null): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const randomStr = Math.random().toString(36).substring(2, 15);
  if (userId) {
    return `tryon/${date}/${userId}/${randomStr}.jpg`;
  }
  return `tryon/${date}/guest/${randomStr}.jpg`;
}
