import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

const s3 = new S3Client({ region: process.env.AWS_REGION || "ap-northeast-1" });

const RECORDINGS_BUCKET = process.env.RECORDINGS_BUCKET || "colon-recordings";
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
 * Get a signed CloudFront URL for playback
 */
export function getPlaybackUrl(s3Key: string): string {
  if (!CLOUDFRONT_DOMAIN || !CLOUDFRONT_KEY_PAIR_ID || !CLOUDFRONT_PRIVATE_KEY) {
    // Fallback: return S3 URL (for development)
    return `https://${RECORDINGS_BUCKET}.s3.amazonaws.com/${s3Key}`;
  }

  const url = `https://${CLOUDFRONT_DOMAIN}/${s3Key}`;
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return getSignedUrl({
    url,
    keyPairId: CLOUDFRONT_KEY_PAIR_ID,
    privateKey: CLOUDFRONT_PRIVATE_KEY,
    dateLessThan: expiry.toISOString(),
  });
}

/**
 * Get a signed CloudFront URL for download
 */
export function getDownloadUrl(s3Key: string): string {
  const playbackUrl = getPlaybackUrl(s3Key);
  const separator = playbackUrl.includes("?") ? "&" : "?";
  return `${playbackUrl}${separator}response-content-disposition=attachment`;
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
