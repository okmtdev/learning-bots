import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "ap-northeast-1" });
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names from environment variables
export const Tables = {
  USERS: process.env.USERS_TABLE || "colon-users",
  BOTS: process.env.BOTS_TABLE || "colon-bots",
  RECORDINGS: process.env.RECORDINGS_TABLE || "colon-recordings",
  BOT_SESSIONS: process.env.BOT_SESSIONS_TABLE || "colon-bot-sessions",
  MEETING_EVENTS: process.env.MEETING_EVENTS_TABLE_NAME || "colon-meeting-events",
} as const;

// --- Users ---

export async function getUser(userId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.USERS,
      Key: { userId },
    })
  );
  return result.Item;
}

export async function putUser(user: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.USERS,
      Item: user,
    })
  );
}

export async function updateUser(userId: string, updates: Record<string, unknown>) {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], i) => {
    expressions.push(`#k${i} = :v${i}`);
    names[`#k${i}`] = key;
    values[`:v${i}`] = value;
  });

  await docClient.send(
    new UpdateCommand({
      TableName: Tables.USERS,
      Key: { userId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

export async function deleteUser(userId: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.USERS,
      Key: { userId },
    })
  );
}

// --- Bots ---

export async function getBots(userId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.BOTS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
    })
  );
  return result.Items || [];
}

export async function getBot(userId: string, botId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.BOTS,
      Key: { userId, botId },
    })
  );
  return result.Item;
}

export async function putBot(bot: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.BOTS,
      Item: bot,
    })
  );
}

export async function deleteBot(userId: string, botId: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.BOTS,
      Key: { userId, botId },
    })
  );
}

// --- Recordings ---

export async function getRecordings(
  userId: string,
  options?: {
    limit?: number;
    nextToken?: string;
    botId?: string;
  }
) {
  if (options?.botId) {
    const result = await docClient.send(
      new QueryCommand({
        TableName: Tables.RECORDINGS,
        IndexName: "colon-recordings-by-bot",
        KeyConditionExpression: "botId = :botId",
        ExpressionAttributeValues: { ":botId": options.botId },
        ScanIndexForward: false,
        Limit: options?.limit || 10,
        ExclusiveStartKey: options?.nextToken
          ? JSON.parse(Buffer.from(options.nextToken, "base64").toString())
          : undefined,
      })
    );
    return {
      items: result.Items || [],
      nextToken: result.LastEvaluatedKey
        ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
        : undefined,
    };
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.RECORDINGS,
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: { ":userId": userId },
      ScanIndexForward: false,
      Limit: options?.limit || 10,
      ExclusiveStartKey: options?.nextToken
        ? JSON.parse(Buffer.from(options.nextToken, "base64").toString())
        : undefined,
    })
  );
  return {
    items: result.Items || [],
    nextToken: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : undefined,
  };
}

export async function getRecording(userId: string, recordingId: string) {
  const result = await docClient.send(
    new GetCommand({
      TableName: Tables.RECORDINGS,
      Key: { userId, recordingId },
    })
  );
  return result.Item;
}

export async function putRecording(recording: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.RECORDINGS,
      Item: recording,
    })
  );
}

export async function deleteRecording(userId: string, recordingId: string) {
  await docClient.send(
    new DeleteCommand({
      TableName: Tables.RECORDINGS,
      Key: { userId, recordingId },
    })
  );
}

// --- Bot Sessions ---

export async function getBotSessionByRecallBotId(recallBotId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.BOT_SESSIONS,
      IndexName: "colon-sessions-by-recall-bot",
      KeyConditionExpression: "recallBotId = :recallBotId",
      ExpressionAttributeValues: { ":recallBotId": recallBotId },
      Limit: 1,
    })
  );
  return result.Items?.[0] || null;
}

export async function getBotSessions(botId: string) {
  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.BOT_SESSIONS,
      KeyConditionExpression: "botId = :botId",
      ExpressionAttributeValues: { ":botId": botId },
      ScanIndexForward: false,
    })
  );
  return result.Items || [];
}

export async function getActiveBotSession(botId: string) {
  const sessions = await getBotSessions(botId);
  return sessions.find(
    (s) => s.status === "joining" || s.status === "in_meeting"
  );
}

export async function putBotSession(session: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.BOT_SESSIONS,
      Item: session,
    })
  );
}

export async function updateBotSession(
  botId: string,
  sessionId: string,
  updates: Record<string, unknown>
) {
  const expressions: string[] = [];
  const names: Record<string, string> = {};
  const values: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value], i) => {
    expressions.push(`#k${i} = :v${i}`);
    names[`#k${i}`] = key;
    values[`:v${i}`] = value;
  });

  await docClient.send(
    new UpdateCommand({
      TableName: Tables.BOT_SESSIONS,
      Key: { botId, sessionId },
      UpdateExpression: `SET ${expressions.join(", ")}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
    })
  );
}

// --- Meeting Events ---

export async function putMeetingEvent(event: Record<string, unknown>) {
  await docClient.send(
    new PutCommand({
      TableName: Tables.MEETING_EVENTS,
      Item: event,
    })
  );
}

export async function getMeetingEvents(
  sessionId: string,
  options?: {
    eventType?: string;
    limit?: number;
    nextToken?: string;
  }
) {
  const keyCondition = "sessionId = :sessionId";
  const expressionValues: Record<string, unknown> = { ":sessionId": sessionId };

  let filterExpression: string | undefined;
  const expressionNames: Record<string, string> = {};

  if (options?.eventType) {
    filterExpression = "#eventType = :eventType";
    expressionNames["#eventType"] = "eventType";
    expressionValues[":eventType"] = options.eventType;
  }

  const result = await docClient.send(
    new QueryCommand({
      TableName: Tables.MEETING_EVENTS,
      KeyConditionExpression: keyCondition,
      FilterExpression: filterExpression,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ExpressionAttributeValues: expressionValues,
      ScanIndexForward: true,
      Limit: options?.limit || 100,
      ExclusiveStartKey: options?.nextToken
        ? JSON.parse(Buffer.from(options.nextToken, "base64").toString())
        : undefined,
    })
  );

  return {
    items: result.Items || [],
    nextToken: result.LastEvaluatedKey
      ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString("base64")
      : undefined,
  };
}
