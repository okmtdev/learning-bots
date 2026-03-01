import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const ssm = new SSMClient({ region: process.env.AWS_REGION || "ap-northeast-1" });

let cachedApiKey: string | null = null;

async function getRecallApiKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  const result = await ssm.send(
    new GetParameterCommand({
      Name: process.env.RECALL_API_KEY_PARAM || "/colon/prod/recall-api-key",
      WithDecryption: true,
    })
  );

  cachedApiKey = result.Parameter?.Value || "";
  return cachedApiKey;
}

const RECALL_API_BASE = "https://ap-northeast-1.recall.ai/api/v1";

interface RecallBotConfig {
  meeting_url: string;
  bot_name?: string;
  real_time_transcription?: {
    partial_results: boolean;
    destination_url?: string;
  };
  chat?: {
    on_bot_join?: {
      send_to: "everyone";
      message: string;
    };
  };
}

interface RecallBotRecording {
  id: string;
  media_shortcuts: {
    video_mixed?: {
      data: {
        download_url: string;
      };
    };
  };
}

interface RecallBotResponse {
  id: string;
  meeting_url: string;
  status: {
    code: string;
    message?: string;
  };
  video_url?: string; // Legacy field (deprecated in newer API versions)
  recordings?: RecallBotRecording[];
}

async function recallFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = await getRecallApiKey();
  return fetch(`${RECALL_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiKey}`,
      ...options.headers,
    },
  });
}

/**
 * Create a bot and send it to a meeting
 */
export async function createRecallBot(
  config: RecallBotConfig
): Promise<RecallBotResponse> {
  const response = await recallFetch("/bot", {
    method: "POST",
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Recall API error: ${response.status} ${errorBody}`);
  }

  return response.json() as Promise<RecallBotResponse>;
}

/**
 * Get bot status from Recall.ai
 */
export async function getRecallBotStatus(
  recallBotId: string
): Promise<RecallBotResponse> {
  const response = await recallFetch(`/bot/${recallBotId}`);

  if (!response.ok) {
    throw new Error(`Recall API error: ${response.status}`);
  }

  return response.json() as Promise<RecallBotResponse>;
}

/**
 * Remove a bot from a meeting
 */
export async function removeRecallBot(recallBotId: string): Promise<void> {
  const response = await recallFetch(`/bot/${recallBotId}/leave_call`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Recall API error: ${response.status}`);
  }
}

/**
 * Extract the video download URL from a bot response.
 * Supports both the current API format (recordings[].media_shortcuts.video_mixed.data.download_url)
 * and the legacy format (video_url).
 */
function extractVideoUrl(data: RecallBotResponse): string | null {
  // Current API format: recordings array with media_shortcuts
  if (data.recordings && data.recordings.length > 0) {
    const downloadUrl =
      data.recordings[0].media_shortcuts?.video_mixed?.data?.download_url;
    if (downloadUrl) return downloadUrl;
  }

  // Legacy API format: direct video_url field
  if (data.video_url) return data.video_url;

  return null;
}

/**
 * Get the recording/video for a bot.
 * Retries up to 3 times with 5-second intervals if the video URL is not yet available,
 * since Recall.ai may still be processing the recording when bot.done fires.
 */
export async function getRecallBotRecording(
  recallBotId: string
): Promise<{ video_url: string } | null> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const response = await recallFetch(`/bot/${recallBotId}`);

    if (!response.ok) {
      throw new Error(`Recall API error: ${response.status}`);
    }

    const data = (await response.json()) as RecallBotResponse;
    const videoUrl = extractVideoUrl(data);

    if (videoUrl) {
      return { video_url: videoUrl };
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }

  return null;
}
