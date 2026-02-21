import { z } from "zod";

const botFeatureSchema = z.object({
  enabled: z.boolean(),
  instruction: z.string().max(1000).default(""),
});

const botFeaturesSchema = z.object({
  reaction: botFeatureSchema,
  chat: botFeatureSchema,
  voice: botFeatureSchema,
});

export const createBotSchema = z
  .object({
    botName: z.string().min(1).max(50),
    isInteractiveEnabled: z.boolean(),
    isRecordingEnabled: z.boolean(),
    triggerMode: z.enum(["chat_only", "name_reaction", "all_reaction"]).optional(),
    features: botFeaturesSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.isInteractiveEnabled && !data.triggerMode) {
        return false;
      }
      return true;
    },
    {
      message: "triggerMode is required when isInteractiveEnabled is true",
      path: ["triggerMode"],
    }
  );

export const updateBotSchema = createBotSchema;

export const inviteBotSchema = z.object({
  meetingUrl: z
    .string()
    .url()
    .refine((url) => url.startsWith("https://meet.google.com/"), {
      message: "URL must be a valid Google Meet URL",
    }),
});

export const updateSettingsSchema = z.object({
  language: z.enum(["ja", "en"]),
});

export type CreateBotInput = z.infer<typeof createBotSchema>;
export type UpdateBotInput = z.infer<typeof updateBotSchema>;
export type InviteBotInput = z.infer<typeof inviteBotSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
