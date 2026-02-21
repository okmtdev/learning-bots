import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { getRecordings, getRecording, deleteRecording } from "../lib/dynamodb.js";
import { deleteRecordingFile, getPlaybackUrl, getDownloadUrl } from "../lib/s3.js";
import {
  success,
  noContent,
  notFound,
  internalError,
  getUserId,
  unauthorized,
} from "../lib/response.js";
import { logger } from "../lib/logger.js";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);
  if (!userId) return unauthorized();

  const method = event.httpMethod;
  const recordingId = event.pathParameters?.recordingId;

  try {
    // GET /recordings
    if (method === "GET" && !recordingId) {
      return await handleList(userId, event);
    }

    // GET /recordings/{recordingId}
    if (method === "GET" && recordingId) {
      return await handleGet(userId, recordingId);
    }

    // DELETE /recordings/{recordingId}
    if (method === "DELETE" && recordingId) {
      return await handleDelete(userId, recordingId);
    }

    return notFound("Route not found");
  } catch (err) {
    logger.error("recordingCrud", "Unexpected error", err as Error, { userId });
    return internalError();
  }
};

async function handleList(
  userId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const params = event.queryStringParameters || {};
  const limit = params.limit ? Math.min(parseInt(params.limit, 10), 50) : 10;

  const result = await getRecordings(userId, {
    limit,
    nextToken: params.nextToken || undefined,
    botId: params.botId || undefined,
  });

  logger.info("listRecordings", "Recordings listed", {
    userId,
    metadata: { count: result.items.length },
  });

  return success({
    recordings: result.items,
    nextToken: result.nextToken || null,
  });
}

async function handleGet(
  userId: string,
  recordingId: string
): Promise<APIGatewayProxyResult> {
  const recording = await getRecording(userId, recordingId);
  if (!recording) return notFound("Recording not found");

  // Generate signed URLs for playback and download
  const playbackUrl =
    recording.status === "ready" ? getPlaybackUrl(recording.s3Key) : null;
  const downloadUrl =
    recording.status === "ready" ? getDownloadUrl(recording.s3Key) : null;

  return success({
    ...recording,
    playbackUrl,
    downloadUrl,
  });
}

async function handleDelete(
  userId: string,
  recordingId: string
): Promise<APIGatewayProxyResult> {
  const recording = await getRecording(userId, recordingId);
  if (!recording) return notFound("Recording not found");

  // Delete S3 file
  if (recording.s3Key) {
    await deleteRecordingFile(recording.s3Key);
  }

  // Delete DynamoDB record
  await deleteRecording(userId, recordingId);

  logger.info("deleteRecording", "Recording deleted", {
    userId,
    metadata: { recordingId },
  });

  return noContent();
}
