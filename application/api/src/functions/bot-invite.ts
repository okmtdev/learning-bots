import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ulid } from "ulid";
import {
  getBot,
  putBot,
  getActiveBotSession,
  putBotSession,
  updateBotSession,
} from "../lib/dynamodb.js";
import { createRecallBot, removeRecallBot } from "../lib/recall.js";
import { inviteBotSchema } from "../lib/validators.js";
import {
  success,
  notFound,
  conflict,
  validationError,
  internalError,
  getUserId,
  unauthorized,
  badRequest,
} from "../lib/response.js";
import { logger } from "../lib/logger.js";

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const method = event.httpMethod;
  const resource = event.resource;

  // Trial routes - no auth required
  if (resource.startsWith("/trial")) {
    try {
      if (method === "POST" && resource.endsWith("/invite")) {
        return await handleTrialInvite(event);
      }
      if (method === "POST" && resource.endsWith("/leave")) {
        return await handleTrialLeave(event);
      }
      return notFound("Route not found");
    } catch (err) {
      logger.error("trialInvite", "Unexpected error", err as Error, {});
      return internalError();
    }
  }

  // Authenticated routes
  const userId = getUserId(event);
  if (!userId) return unauthorized();

  const botId = event.pathParameters?.botId;

  if (!botId) return notFound("Bot ID is required");

  try {
    // POST /bots/{botId}/invite
    if (method === "POST" && resource.endsWith("/invite")) {
      return await handleInvite(userId, botId, event);
    }

    // POST /bots/{botId}/leave
    if (method === "POST" && resource.endsWith("/leave")) {
      return await handleLeave(userId, botId);
    }

    // GET /bots/{botId}/session
    if (method === "GET" && resource.endsWith("/session")) {
      return await handleGetSession(userId, botId);
    }

    return notFound("Route not found");
  } catch (err) {
    logger.error("botInvite", "Unexpected error", err as Error, { userId });
    return internalError();
  }
};

async function handleInvite(
  userId: string,
  botId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Validate bot exists and belongs to user
  const bot = await getBot(userId, botId);
  if (!bot) return notFound("Bot not found");

  // Check if bot is already in a meeting
  const activeSession = await getActiveBotSession(botId);
  if (activeSession) {
    return conflict("Bot is already in a meeting");
  }

  // Validate request body
  const body = JSON.parse(event.body || "{}");
  const parsed = inviteBotSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  // Create bot via Recall.ai
  const recallBot = await createRecallBot({
    meeting_url: parsed.data.meetingUrl,
    bot_name: bot.botName,
  });

  const now = new Date().toISOString();
  const sessionId = ulid();

  // Create session record
  const session = {
    botId,
    sessionId,
    userId,
    meetingUrl: parsed.data.meetingUrl,
    recallBotId: recallBot.id,
    status: "joining" as const,
    joinedAt: now,
    createdAt: now,
  };
  await putBotSession(session);

  // Update bot status
  await putBot({ ...bot, status: "in_meeting", updatedAt: now });

  logger.info("inviteBot", "Bot invited to meeting", {
    userId,
    metadata: { botId, sessionId, meetingUrl: parsed.data.meetingUrl },
  });

  return success({
    sessionId,
    botId,
    meetingUrl: parsed.data.meetingUrl,
    status: "joining",
    joinedAt: now,
  });
}

async function handleLeave(
  userId: string,
  botId: string
): Promise<APIGatewayProxyResult> {
  const bot = await getBot(userId, botId);
  if (!bot) return notFound("Bot not found");

  const activeSession = await getActiveBotSession(botId);
  if (!activeSession) {
    return notFound("No active session found");
  }

  // Remove bot via Recall.ai
  await removeRecallBot(activeSession.recallBotId);

  const now = new Date().toISOString();

  // Update session
  await updateBotSession(botId, activeSession.sessionId, {
    status: "leaving",
    leftAt: now,
    ttl: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24h TTL
  });

  // Update bot status
  await putBot({ ...bot, status: "idle", updatedAt: now });

  logger.info("leaveBot", "Bot leaving meeting", {
    userId,
    metadata: { botId, sessionId: activeSession.sessionId },
  });

  return success({
    sessionId: activeSession.sessionId,
    status: "leaving",
  });
}

async function handleGetSession(
  userId: string,
  botId: string
): Promise<APIGatewayProxyResult> {
  const bot = await getBot(userId, botId);
  if (!bot) return notFound("Bot not found");

  const activeSession = await getActiveBotSession(botId);

  if (!activeSession) {
    return success({ session: null });
  }

  return success({
    sessionId: activeSession.sessionId,
    meetingUrl: activeSession.meetingUrl,
    status: activeSession.status,
    joinedAt: activeSession.joinedAt,
  });
}

// ──────────────────────────────────────────────────────────────
// Trial handlers (no auth, no DynamoDB)
// ──────────────────────────────────────────────────────────────

async function handleTrialInvite(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");

  const meetingUrl = body.meetingUrl;
  const botName = body.botName || "Colon Trial Bot";

  if (
    !meetingUrl ||
    typeof meetingUrl !== "string" ||
    !meetingUrl.startsWith("https://meet.google.com/")
  ) {
    return validationError("URL must be a valid Google Meet URL");
  }

  if (botName.length > 50) {
    return validationError("Bot name must be 50 characters or less");
  }

  const recallBot = await createRecallBot({
    meeting_url: meetingUrl,
    bot_name: botName,
  });

  logger.info("trialInvite", "Trial bot invited to meeting", {
    metadata: { recallBotId: recallBot.id, meetingUrl },
  });

  return success({
    recallBotId: recallBot.id,
    meetingUrl,
    botName,
    status: "joining",
    joinedAt: new Date().toISOString(),
  });
}

async function handleTrialLeave(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const recallBotId = body.recallBotId;

  if (!recallBotId || typeof recallBotId !== "string") {
    return badRequest("recallBotId is required");
  }

  await removeRecallBot(recallBotId);

  logger.info("trialLeave", "Trial bot leaving meeting", {
    metadata: { recallBotId },
  });

  return success({ status: "leaving" });
}
