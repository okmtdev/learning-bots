import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import { Webhook } from "svix";
import { ulid } from "ulid";
import {
  getBot,
  putBot,
  putRecording,
  putMeetingEvent,
  updateBotSession,
  getBotSessionByRecallBotId,
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
      case "bot.transcription":
        await handleTranscription(body.data);
        break;
      case "bot.reaction":
        await handleReaction(body.data);
        break;
      case "bot.chat_message":
        await handleChatMessage(body.data);
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

async function saveMeetingEvent(
  recallBotId: string,
  eventType: "transcription" | "reaction" | "comment",
  speakerName: string,
  content: string,
  extra?: { language?: string; isFinal?: boolean }
): Promise<void> {
  const session = await getBotSessionByRecallBotId(recallBotId);
  if (!session) {
    logger.warn("webhook", `No session found for meeting event`, {
      metadata: { recallBotId, eventType },
    });
    return;
  }

  const { sessionId, userId, botId } = session as {
    sessionId: string;
    userId: string;
    botId: string;
  };

  const now = new Date().toISOString();
  await putMeetingEvent({
    sessionId,
    eventId: ulid(),
    userId,
    botId,
    eventType,
    speakerName,
    content,
    timestamp: now,
    ...(extra?.language && { language: extra.language }),
    ...(extra?.isFinal !== undefined && { isFinal: extra.isFinal }),
    createdAt: now,
  });
}

async function handleTranscription(data: {
  bot?: { id?: string };
  transcript?: {
    speaker?: string;
    words?: Array<{ text: string; start_time?: number; end_time?: number }>;
    is_final?: boolean;
    language?: string;
  };
}): Promise<void> {
  const recallBotId = data.bot?.id;
  if (!recallBotId) return;

  const transcript = data.transcript;
  if (!transcript) return;

  const text = transcript.words?.map((w) => w.text).join(" ") || "";
  if (!text) return;

  await saveMeetingEvent(recallBotId, "transcription", transcript.speaker || "Unknown", text, {
    language: transcript.language,
    isFinal: transcript.is_final,
  });

  logger.info("webhook", "Transcription event saved", {
    metadata: { recallBotId, speaker: transcript.speaker, isFinal: transcript.is_final },
  });
}

async function handleReaction(data: {
  bot?: { id?: string };
  participant?: { name?: string };
  reaction?: string;
}): Promise<void> {
  const recallBotId = data.bot?.id;
  if (!recallBotId) return;

  const reaction = data.reaction || "";
  if (!reaction) return;

  await saveMeetingEvent(
    recallBotId,
    "reaction",
    data.participant?.name || "Unknown",
    reaction
  );

  logger.info("webhook", "Reaction event saved", {
    metadata: { recallBotId, participant: data.participant?.name, reaction },
  });
}

async function handleChatMessage(data: {
  bot?: { id?: string };
  participant?: { name?: string };
  message?: string;
}): Promise<void> {
  const recallBotId = data.bot?.id;
  if (!recallBotId) return;

  const message = data.message || "";
  if (!message) return;

  await saveMeetingEvent(
    recallBotId,
    "comment",
    data.participant?.name || "Unknown",
    message
  );

  logger.info("webhook", "Chat message event saved", {
    metadata: { recallBotId, participant: data.participant?.name },
  });
}

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

  // Look up the session by recallBotId to get userId and botId
  const session = await getBotSessionByRecallBotId(recallBotId);
  if (!session) {
    logger.warn("webhook", "No session found for recallBotId", {
      metadata: { recallBotId },
    });
    return;
  }

  const { userId, botId, sessionId, meetingUrl: sessionMeetingUrl } = session as {
    userId: string;
    botId: string;
    sessionId: string;
    meetingUrl?: string;
  };

  // Get recording URL from Recall.ai API (supports both current and legacy formats)
  // The webhook payload typically does not include the video URL directly;
  // it must be fetched from the Retrieve Bot endpoint.
  let videoUrl = data.video_url;
  if (!videoUrl) {
    logger.info("webhook", "Fetching video URL from Recall API", {
      metadata: { recallBotId },
    });
    const recording = await getRecallBotRecording(recallBotId);
    videoUrl = recording?.video_url;
  }

  if (!videoUrl) {
    logger.warn("webhook", "No video URL available after retries", {
      metadata: { recallBotId, userId, botId },
    });
    return;
  }

  // Download and upload recording
  try {
    const videoData = await downloadFromUrl(videoUrl);
    const recordingId = ulid();
    const fileSizeMb = Math.round((videoData.length / (1024 * 1024)) * 100) / 100;
    const now = new Date().toISOString();

    // Upload to S3
    const s3Key = await uploadRecording(userId, recordingId, videoData);

    // Get bot info for denormalized fields
    const bot = await getBot(userId, botId);
    const botName = (bot?.botName as string) || "Unknown Bot";

    // Save recording metadata to DynamoDB
    await putRecording({
      userId,
      recordingId,
      botId,
      botName,
      meetingUrl: data.meeting_url || sessionMeetingUrl || "",
      s3Key,
      status: "ready",
      fileSizeMb,
      durationSeconds: data.duration || 0,
      startedAt: session.joinedAt || now,
      endedAt: now,
      recallBotId,
      createdAt: now,
    });

    // Update session status
    await updateBotSession(botId, sessionId, {
      status: "completed",
      endedAt: now,
      recordingId,
      ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    });

    // Update bot status to idle
    if (bot) {
      await putBot({ ...bot, status: "idle", updatedAt: now });
    }

    logger.info("webhook", "Recording processed successfully", {
      metadata: { recallBotId, recordingId, userId, botId, fileSizeMb },
    });
  } catch (err) {
    logger.error("webhook", "Failed to process recording", err as Error, {
      metadata: { recallBotId, userId, botId },
    });
  }
}
