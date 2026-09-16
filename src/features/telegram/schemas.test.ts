import { describe, expect, it } from "vitest";

import { telegramUpdateSchema } from "./schemas";

describe("Telegram webhook contract", () => {
  it("accepts only the receipt fields used by AVELIA", () => {
    const parsed = telegramUpdateSchema.parse({
      update_id: 123,
      message: {
        message_id: 10,
        chat: { id: 20 },
        from: { id: 30 },
        photo: [
          {
            file_id: "telegram-file",
            file_unique_id: "unique-file",
            width: 800,
            height: 600,
            file_size: 120_000,
          },
        ],
        ignored_provider_field: "not returned",
      },
    });

    expect(parsed.message?.photo?.[0]?.file_id).toBe("telegram-file");
    expect(parsed.message).not.toHaveProperty("ignored_provider_field");
  });

  it("rejects updates without a nonnegative provider update id", () => {
    expect(() => telegramUpdateSchema.parse({ update_id: -1 })).toThrow();
  });
});
