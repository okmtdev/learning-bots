import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ulid } from "ulid";
import { getBots, getBot, putBot, deleteBot, getActiveBotSession } from "../lib/dynamodb.js";
import { createBotSchema, updateBotSchema } from "../lib/validators.js";
import {
  success,
  created,
  noContent,
  notFound,
  conflict,
  validationError,
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
  const botId = event.pathParameters?.botId;

  try {
    // GET /bots
    if (method === "GET" && !botId) {
      return await handleList(userId);
    }

    // GET /bots/{botId}
    if (method === "GET" && botId) {
      return await handleGet(userId, botId);
    }

    // POST /bots
    if (method === "POST" && !botId) {
      return await handleCreate(userId, event);
    }

    // PUT /bots/{botId}
    if (method === "PUT" && botId) {
      return await handleUpdate(userId, botId, event);
    }

    // DELETE /bots/{botId}
    if (method === "DELETE" && botId) {
      return await handleDelete(userId, botId);
    }

    return notFound("Route not found");
  } catch (err) {
    logger.error("botCrud", "Unexpected error", err as Error, { userId });
    return internalError();
  }
};

async function handleList(userId: string): Promise<APIGatewayProxyResult> {
  const bots = await getBots(userId);
  logger.info("listBots", "Bots listed", { userId, metadata: { count: bots.length } });
  return success({ bots });
}

async function handleGet(userId: string, botId: string): Promise<APIGatewayProxyResult> {
  const bot = await getBot(userId, botId);
  if (!bot) return notFound("Bot not found");

  // Include current session info
  const activeSession = await getActiveBotSession(botId);
  return success({ ...bot, currentSession: activeSession || null });
}

async function handleCreate(
  userId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const parsed = createBotSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const now = new Date().toISOString();
  const bot = {
    userId,
    botId: ulid(),
    ...parsed.data,
    status: "idle" as const,
    createdAt: now,
    updatedAt: now,
  };

  await putBot(bot);
  logger.info("createBot", "Bot created successfully", {
    userId,
    metadata: { botId: bot.botId },
  });
  return created(bot);
}

async function handleUpdate(
  userId: string,
  botId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const existing = await getBot(userId, botId);
  if (!existing) return notFound("Bot not found");

  const body = JSON.parse(event.body || "{}");
  const parsed = updateBotSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  const now = new Date().toISOString();
  const updated = {
    ...existing,
    ...parsed.data,
    userId,
    botId,
    updatedAt: now,
  };

  await putBot(updated);
  logger.info("updateBot", "Bot updated successfully", {
    userId,
    metadata: { botId },
  });
  return success(updated);
}

async function handleDelete(
  userId: string,
  botId: string
): Promise<APIGatewayProxyResult> {
  const bot = await getBot(userId, botId);
  if (!bot) return notFound("Bot not found");

  if (bot.status === "in_meeting") {
    return conflict("Bot is currently in a meeting. Please remove it from the meeting first.");
  }

  await deleteBot(userId, botId);
  logger.info("deleteBot", "Bot deleted successfully", {
    userId,
    metadata: { botId },
  });
  return noContent();
}
