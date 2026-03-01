import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getCloudFrontSignedUrl } from "@aws-sdk/cloudfront-signer";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-northeast-1" });

const RECORDINGS_BUCKET = process.env.RECORDINGS_BUCKET_NAME || "colon-recordings";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";
const CLOUDFRONT_KEY_PAIR_ID = process.env.CLOUDFRONT_KEY_PAIR_ID || "";
const CLOUDFRONT_PRIVATE_KEY = process.env.CLOUDFRONT_PRIVATE_KEY || "";

/**
 * Upload recording to S3
 */
export async function uploadRecording(
  userId: string,
  recordingId: string,
  data: Buffer | Uint8Array,
  contentType = "video/mp4"
): Promise<string> {
  const key = `recordings/${userId}/${recordingId}/recording.mp4`;

  await s3.send(
    new PutObjectCommand({
      Bucket: RECORDINGS_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
      ServerSideEncryption: "AES256",
    })
  );

  return key;
}

/**
 * Delete recording from S3
 */
export async function deleteRecordingFile(s3Key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: RECORDINGS_BUCKET,
      Key: s3Key,
    })
  );
}

/**
 * Get a signed URL for playback.
 * Uses CloudFront signed URL when configured, otherwise falls back to S3 pre-signed URL.
 */
export async function getPlaybackUrl(s3Key: string): Promise<string> {
  if (CLOUDFRONT_DOMAIN && CLOUDFRONT_KEY_PAIR_ID && CLOUDFRONT_PRIVATE_KEY) {
    const url = `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    return getCloudFrontSignedUrl({
      url,
      keyPairId: CLOUDFRONT_KEY_PAIR_ID,
      privateKey: CLOUDFRONT_PRIVATE_KEY,
      dateLessThan: expiry.toISOString(),
    });
  }

  // Fallback: S3 pre-signed URL (1 hour expiry)
  return getS3SignedUrl(
    s3,
    new GetObjectCommand({ Bucket: RECORDINGS_BUCKET, Key: s3Key }),
    { expiresIn: 3600 }
  );
}

/**
 * Get a signed URL for download (with Content-Disposition: attachment).
 * Uses CloudFront signed URL when configured, otherwise falls back to S3 pre-signed URL.
 */
export async function getDownloadUrl(s3Key: string): Promise<string> {
  if (CLOUDFRONT_DOMAIN && CLOUDFRONT_KEY_PAIR_ID && CLOUDFRONT_PRIVATE_KEY) {
    const playbackUrl = await getPlaybackUrl(s3Key);
    const separator = playbackUrl.includes("?") ? "&" : "?";
    return `${playbackUrl}${separator}response-content-disposition=attachment`;
  }

  // Fallback: S3 pre-signed URL with ResponseContentDisposition
  return getS3SignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: RECORDINGS_BUCKET,
      Key: s3Key,
      ResponseContentDisposition: "attachment",
    }),
    { expiresIn: 3600 }
  );
}

/**
 * Download file from URL and return as Buffer
 */
export async function downloadFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
