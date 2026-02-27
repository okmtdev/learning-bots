import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Webhook } from "svix";
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
    // Verify webhook signature using Svix (whsec_... signing secret)
    const secret = await getWebhookSecret();
    const wh = new Webhook(secret);

    let body: { event: string; data: Record<string, unknown> };
    try {
      // Recall sends headers with "webhook-" prefix; fall back to "svix-" prefix
      const headers = event.headers;
      body = wh.verify(event.body || "", {
        "svix-id": headers["webhook-id"] ?? headers["svix-id"] ?? "",
        "svix-timestamp":
          headers["webhook-timestamp"] ?? headers["svix-timestamp"] ?? "",
        "svix-signature":
          headers["webhook-signature"] ?? headers["svix-signature"] ?? "",
      }) as { event: string; data: Record<string, unknown> };
    } catch {
      logger.warn("webhook", "Invalid webhook signature");
      return unauthorized("Invalid webhook signature");
    }

    logger.info("webhook", "Webhook received", {
      metadata: { event: body.event },
    });

    // Handle different webhook events
    // Recall.ai sends individual status events (not a single "bot.status_change")
    switch (body.event) {
      case "bot.done":
        await handleBotDone(body.data);
        break;
      case "bot.call_ended":
        await handleCallEnded(body.data);
        break;
      case "bot.fatal": {
        const d = body.data as { bot?: { id?: string }; sub_code?: string };
        logger.warn("webhook", "Bot fatal error", {
          metadata: { recallBotId: d.bot?.id, subCode: d.sub_code },
        });
        break;
      }
      case "bot.in_call_recording": {
        const d = body.data as { bot?: { id?: string } };
        logger.info("webhook", "Bot started recording", {
          metadata: { recallBotId: d.bot?.id },
        });
        break;
      }
      default:
        logger.info("webhook", `Unhandled webhook event: ${body.event}`);
    }

    return success({ received: true });
  } catch (err) {
    logger.error("webhook", "Webhook processing error", err as Error);
    return internalError();
  }
};

async function handleCallEnded(data: {
  bot: { id: string };
  sub_code?: string;
}): Promise<void> {
  logger.info("webhook", "Call ended", {
    metadata: { recallBotId: data.bot?.id, subCode: data.sub_code },
  });
  // Bot status update happens via bot.done which fires after this
}

async function handleBotDone(data: {
  bot: { id: string };
  meeting_url?: string;
  video_url?: string;
  duration?: number;
}): Promise<void> {
  const recallBotId = data.bot?.id;
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
