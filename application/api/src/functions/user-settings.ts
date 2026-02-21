import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import {
  CognitoIdentityProviderClient,
  AdminDeleteUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import {
  getUser,
  putUser,
  updateUser,
  deleteUser,
  getBots,
  deleteBot,
  getRecordings,
  deleteRecording,
} from "../lib/dynamodb.js";
import { deleteRecordingFile } from "../lib/s3.js";
import { updateSettingsSchema } from "../lib/validators.js";
import {
  success,
  noContent,
  validationError,
  internalError,
  getUserId,
  unauthorized,
  notFound,
} from "../lib/response.js";
import { logger } from "../lib/logger.js";

const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || "ap-northeast-1",
});

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event);
  if (!userId) return unauthorized();

  const method = event.httpMethod;
  const resource = event.resource;

  try {
    // GET /auth/me
    if (method === "GET" && resource.endsWith("/me")) {
      return await handleGetMe(userId, event);
    }

    // GET /settings
    if (method === "GET" && resource.endsWith("/settings")) {
      return await handleGetSettings(userId);
    }

    // PUT /settings
    if (method === "PUT" && resource.endsWith("/settings")) {
      return await handleUpdateSettings(userId, event);
    }

    // DELETE /settings/account
    if (method === "DELETE" && resource.endsWith("/account")) {
      return await handleDeleteAccount(userId);
    }

    return notFound("Route not found");
  } catch (err) {
    logger.error("userSettings", "Unexpected error", err as Error, { userId });
    return internalError();
  }
};

async function handleGetMe(
  userId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  let user = await getUser(userId);

  if (!user) {
    // Auto-create user on first access
    const claims = event.requestContext?.authorizer?.claims;
    const now = new Date().toISOString();

    user = {
      userId,
      email: claims?.email || "",
      displayName: claims?.name || claims?.email || "",
      avatarUrl: claims?.picture || "",
      language: "ja",
      createdAt: now,
      updatedAt: now,
    };

    await putUser(user);
    logger.info("getMe", "New user created", { userId });
  }

  return success(user);
}

async function handleGetSettings(userId: string): Promise<APIGatewayProxyResult> {
  const user = await getUser(userId);
  if (!user) return notFound("User not found");

  return success({
    language: user.language,
    email: user.email,
    displayName: user.displayName,
  });
}

async function handleUpdateSettings(
  userId: string,
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const body = JSON.parse(event.body || "{}");
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return validationError(parsed.error.issues.map((i) => i.message).join(", "));
  }

  await updateUser(userId, {
    language: parsed.data.language,
    updatedAt: new Date().toISOString(),
  });

  const user = await getUser(userId);

  logger.info("updateSettings", "Settings updated", {
    userId,
    metadata: { language: parsed.data.language },
  });

  return success({
    language: user?.language,
    email: user?.email,
    displayName: user?.displayName,
  });
}

async function handleDeleteAccount(userId: string): Promise<APIGatewayProxyResult> {
  logger.info("deleteAccount", "Starting account deletion", { userId });

  // 1. Delete all recordings (S3 files + DynamoDB)
  const recordings = await getRecordings(userId, { limit: 1000 });
  for (const recording of recordings.items) {
    if (recording.s3Key) {
      await deleteRecordingFile(recording.s3Key);
    }
    await deleteRecording(userId, recording.recordingId);
  }

  // 2. Delete all bots
  const bots = await getBots(userId);
  for (const bot of bots) {
    await deleteBot(userId, bot.botId);
  }

  // 3. Delete user record
  await deleteUser(userId);

  // 4. Delete Cognito user
  try {
    await cognito.send(
      new AdminDeleteUserCommand({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: userId,
      })
    );
  } catch (err) {
    logger.error("deleteAccount", "Failed to delete Cognito user", err as Error, {
      userId,
    });
    // Continue even if Cognito deletion fails
  }

  logger.info("deleteAccount", "Account deleted successfully", { userId });
  return noContent();
}
