"use client";

import { useState, useCallback, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import type { Bot, TriggerMode, BotFeatures } from "@/types";

interface BotFormValues {
  botName: string;
  isInteractiveEnabled: boolean;
  isRecordingEnabled: boolean;
  triggerMode: TriggerMode;
  features: BotFeatures;
}

interface BotFormProps {
  initialValues?: Bot;
  onSubmit: (values: BotFormValues) => void;
  isSubmitting: boolean;
}

const defaultFeatures: BotFeatures = {
  reaction: { enabled: false, instruction: "" },
  chat: { enabled: false, instruction: "" },
  voice: { enabled: false, instruction: "" },
};

const triggerModeOptions: { value: TriggerMode; label: string }[] = [
  { value: "chat_only", label: "チャットのみ" },
  { value: "name_reaction", label: "名前リアクション" },
  { value: "all_reaction", label: "全リアクション" },
];

export const BotForm = ({ initialValues, onSubmit, isSubmitting }: BotFormProps) => {
  const [botName, setBotName] = useState(initialValues?.botName ?? "");
  const [isInteractiveEnabled, setIsInteractiveEnabled] = useState(
    initialValues?.isInteractiveEnabled ?? false,
  );
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(
    initialValues?.isRecordingEnabled ?? false,
  );
  const [triggerMode, setTriggerMode] = useState<TriggerMode>(
    initialValues?.triggerMode ?? "chat_only",
  );
  const [features, setFeatures] = useState<BotFeatures>(
    initialValues?.features ?? defaultFeatures,
  );

  const updateFeature = useCallback(
    (key: keyof BotFeatures, field: "enabled" | "instruction", value: boolean | string) => {
      setFeatures((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value },
      }));
    },
    [],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({
      botName,
      isInteractiveEnabled,
      isRecordingEnabled,
      triggerMode,
      features,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bot Name */}
      <Input
        label="Bot名"
        value={botName}
        onChange={(e) => setBotName(e.target.value)}
        placeholder="My Bot"
        required
      />

      {/* Interactive Toggle */}
      <Toggle
        label="インタラクティブ機能"
        checked={isInteractiveEnabled}
        onChange={(e) => setIsInteractiveEnabled(e.target.checked)}
      />

      {/* Recording Toggle */}
      <Toggle
        label="録画機能"
        checked={isRecordingEnabled}
        onChange={(e) => setIsRecordingEnabled(e.target.checked)}
      />

      {/* Conditional: Interactive Settings */}
      {isInteractiveEnabled && (
        <div className="space-y-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="text-sm font-semibold text-gray-900">
            インタラクティブ設定
          </h4>

          {/* Trigger Mode */}
          <fieldset>
            <legend className="mb-2 text-sm font-medium text-gray-700">
              トリガーモード
            </legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              {triggerModeOptions.map((option) => (
                <label
                  key={option.value}
                  className="inline-flex cursor-pointer items-center gap-2"
                >
                  <input
                    type="radio"
                    name="triggerMode"
                    value={option.value}
                    checked={triggerMode === option.value}
                    onChange={() => setTriggerMode(option.value)}
                    className="h-4 w-4 text-[#6C5CE7] focus:ring-[#6C5CE7]"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Feature Toggles with Instruction */}
          {(["reaction", "chat", "voice"] as const).map((key) => {
            const labels: Record<string, string> = {
              reaction: "リアクション",
              chat: "チャット",
              voice: "ボイス",
            };
            return (
              <div key={key} className="space-y-2">
                <Toggle
                  label={labels[key]}
                  checked={features[key].enabled}
                  onChange={(e) =>
                    updateFeature(key, "enabled", e.target.checked)
                  }
                />
                {features[key].enabled && (
                  <textarea
                    value={features[key].instruction}
                    onChange={(e) =>
                      updateFeature(key, "instruction", e.target.value)
                    }
                    placeholder={`${labels[key]}の指示を入力...`}
                    rows={3}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-[#6C5CE7] focus:outline-none focus:ring-2 focus:ring-[#6C5CE7] focus:ring-offset-1"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Submit */}
      <Button type="submit" loading={isSubmitting} className="w-full sm:w-auto">
        {initialValues ? "更新する" : "作成する"}
      </Button>
    </form>
  );
};
