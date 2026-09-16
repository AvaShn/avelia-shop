import { describe, expect, it } from "vitest";

import { contactDetails, telegramBotUrl } from "./contact-details";

describe("contactDetails", () => {
  it("keeps every official channel on its canonical address", () => {
    expect(contactDetails.telegram.href).toBe("https://t.me/youknowava");
    expect(contactDetails.whatsapp.href).toContain(
      "https://wa.me/989128586010",
    );
    expect(contactDetails.bale.href).toBe("https://ble.ir/uknowava");
    expect(contactDetails.email.href).toBe("mailto:avashahabi@gmail.com");
    expect(contactDetails.instagram.href).toBe(
      "https://www.instagram.com/avelia.shopp/",
    );
  });
});

describe("telegramBotUrl", () => {
  it("normalizes configured usernames", () => {
    expect(telegramBotUrl(" @avelia_order_bot ")).toBe(
      "https://t.me/avelia_order_bot",
    );
  });

  it("does not invent a bot address when none is configured", () => {
    expect(telegramBotUrl(undefined)).toBeNull();
    expect(telegramBotUrl("   ")).toBeNull();
  });
});
