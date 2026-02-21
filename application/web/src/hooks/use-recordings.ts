"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Recording } from "@/types";

interface RecordingsResponse {
  recordings: Recording[];
  nextToken: string | null;
}

export function useRecordings(params?: { botId?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params?.botId) query.set("botId", params.botId);
  if (params?.limit) query.set("limit", params.limit.toString());

  const key = `/recordings${query.toString() ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<RecordingsResponse>(
    key,
    () => api.get(key)
  );

  return {
    recordings: data?.recordings || [],
    nextToken: data?.nextToken || null,
    isLoading,
    error,
    mutate,
  };
}

export function useRecording(recordingId: string | null) {
  const { data, error, isLoading } = useSWR<Recording>(
    recordingId ? `/recordings/${recordingId}` : null,
    () => api.get(`/recordings/${recordingId}`)
  );

  return {
    recording: data || null,
    isLoading,
    error,
  };
}

export async function deleteRecording(recordingId: string) {
  return api.delete(`/recordings/${recordingId}`);
}
