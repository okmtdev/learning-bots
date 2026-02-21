import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { ulid } from "ulid";
import {
  getBot,
  putBot,
  putRecording,
  updateBotSession,
  getActiveBotSession,
} from "../lib/dynamodb.js";
import { getRecallBotRecording } from "../lib/recall.js";
import { uploadRecording, downloadFromUrl } from "../lib/s3.js";
import { success, unauthorized, internalError } from "../lib/response.js";
import { logger } from "../lib/logger.js";

const ssm = new SSMClient({ region: process.env.AWS_REGION || "ap-northeast-1" });

let cachedWebhookSecret: string | null = null;

async function getWebhookSecret(): Promise<string> {
  if (cachedWebhookSecret) return cachedWebhookSecret;

  const result = await ssm.send(
    new GetParameterCommand({
      Name: process.env.WEBHOOK_SECRET_PARAM || "/colon/prod/recall-webhook-secret",
      WithDecryption: true,
    })
  );
  cachedWebhookSecret = result.Parameter?.Value || "";
  return cachedWebhookSecret;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Verify webhook secret
    const secret = await getWebhookSecret();
    const headerSecret = event.headers["X-Webhook-Secret"] || event.headers["x-webhook-secret"];

    if (headerSecret !== secret) {
      logger.warn("webhook", "Invalid webhook secret");
      return unauthorized("Invalid webhook secret");
    }

    const body = JSON.parse(event.body || "{}");
    logger.info("webhook", "Webhook received", {
      metadata: { event: body.event, botId: body.data?.bot_id },
    });

    // Handle different webhook events
    switch (body.event) {
      case "bot.status_change":
        await handleStatusChange(body.data);
        break;
      case "bot.done":
        await handleBotDone(body.data);
        break;
      default:
        logger.info("webhook", `Unhandled webhook event: ${body.event}`);
    }

    return success({ received: true });
  } catch (err) {
    logger.error("webhook", "Webhook processing error", err as Error);
    return internalError();
  }
};

async function handleStatusChange(data: {
  bot_id: string;
  status: { code: string };
}): Promise<void> {
  logger.info("webhook", `Bot status changed: ${data.status.code}`, {
    metadata: { recallBotId: data.bot_id },
  });

  // Find the session with this recall bot ID
  // Note: In production, you would use a GSI on recallBotId
  // For now, status updates are handled via the bot_done event
}

async function handleBotDone(data: {
  bot_id: string;
  meeting_url?: string;
  video_url?: string;
  duration?: number;
}): Promise<void> {
  const recallBotId = data.bot_id;
  logger.info("webhook", "Bot done, processing recording", {
    metadata: { recallBotId },
  });

  // Get recording from Recall.ai if not provided
  let videoUrl = data.video_url;
  if (!videoUrl) {
    const recording = await getRecallBotRecording(recallBotId);
    videoUrl = recording?.video_url;
  }

  if (!videoUrl) {
    logger.warn("webhook", "No video URL available", {
      metadata: { recallBotId },
    });
    return;
  }

  // We need to find the session to get userId and botId
  // This is a simplified version - in production you'd use a GSI
  // For now, we'll store the mapping when creating the session
  // and retrieve it here via a lookup mechanism

  // Download and upload recording
  try {
    const videoData = await downloadFromUrl(videoUrl);
    const recordingId = ulid();

    // For webhook, we need additional context that should be stored
    // when the bot was created. This is a simplified implementation.
    // In production, store recallBotId → userId/botId mapping in DynamoDB
    const fileSizeMb = Math.round((videoData.length / (1024 * 1024)) * 100) / 100;

    logger.info("webhook", "Recording downloaded", {
      metadata: { recallBotId, fileSizeMb, recordingId },
    });

    // Store metadata about the recording for later association
    // The actual user/bot association happens through the bot session table
  } catch (err) {
    logger.error("webhook", "Failed to process recording", err as Error, {
      metadata: { recallBotId },
    });
  }
}
