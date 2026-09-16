import { z } from "zod";

const cursorPayloadSchema = z.object({
  version: z.literal(1),
  id: z.string().trim().min(1).max(160),
});

export const cursorSchema = z
  .string()
  .trim()
  .min(1)
  .max(300)
  .regex(/^[A-Za-z0-9_-]+$/);

export function encodeCursor(id: string) {
  return Buffer.from(JSON.stringify({ version: 1, id })).toString("base64url");
}

export function decodeCursor(cursor: string) {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    return cursorPayloadSchema.parse(JSON.parse(decoded)).id;
  } catch {
    return null;
  }
}
