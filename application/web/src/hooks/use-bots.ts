"use client";

import useSWR from "swr";
import { api } from "@/lib/api";
import type { Bot } from "@/types";

export function useBots() {
  const { data, error, isLoading, mutate } = useSWR<{ bots: Bot[] }>(
    "/bots",
    () => api.get<{ bots: Bot[] }>("/bots")
  );

  return {
    bots: data?.bots || [],
    isLoading,
    error,
    mutate,
  };
}

export function useBot(botId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<Bot>(
    botId ? `/bots/${botId}` : null,
    () => api.get<Bot>(`/bots/${botId}`)
  );

  return {
    bot: data || null,
    isLoading,
    error,
    mutate,
  };
}

export async function createBot(input: Partial<Bot>) {
  return api.post<Bot>("/bots", input);
}

export async function updateBot(botId: string, input: Partial<Bot>) {
  return api.put<Bot>(`/bots/${botId}`, input);
}

export async function deleteBot(botId: string) {
  return api.delete(`/bots/${botId}`);
}

export async function inviteBot(botId: string, meetingUrl: string) {
  return api.post(`/bots/${botId}/invite`, { meetingUrl });
}

export async function leaveBot(botId: string) {
  return api.post(`/bots/${botId}/leave`);
}
