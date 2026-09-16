import { z } from "zod";

import { publicOrderTokenSchema } from "@/features/orders/schemas";

export const telegramSessionRequestSchema = z.object({
  orderToken: publicOrderTokenSchema,
});

export const telegramSessionSchema = z.object({
  telegramUrl: z.url(),
  expiresAt: z.string().datetime(),
});

const telegramPhotoSchema = z.object({
  file_id: z.string().min(1),
  file_unique_id: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  file_size: z.number().int().positive().optional(),
});

export const telegramUpdateSchema = z.object({
  update_id: z.number().int().nonnegative(),
  message: z
    .object({
      message_id: z.number().int().positive(),
      chat: z.object({ id: z.number().int() }),
      from: z.object({ id: z.number().int() }).optional(),
      text: z.string().max(4_096).optional(),
      photo: z.array(telegramPhotoSchema).max(20).optional(),
    })
    .optional(),
});

export type TelegramUpdate = z.infer<typeof telegramUpdateSchema>;
export type TelegramPhoto = z.infer<typeof telegramPhotoSchema>;
