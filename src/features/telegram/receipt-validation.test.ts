import { describe, expect, it } from "vitest";

import { detectReceiptContentType } from "./receipt-validation";

describe("Telegram receipt validation", () => {
  it.each([
    ["JPEG", [0xff, 0xd8, 0xff, 0xe0], "image/jpeg"],
    [
      "PNG",
      [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      "image/png",
    ],
    [
      "WebP",
      [
        0x52, 0x49, 0x46, 0x46, 0x08, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42,
        0x50,
      ],
      "image/webp",
    ],
  ])("recognizes %s by its binary signature", (_, signature, expected) => {
    expect(detectReceiptContentType(Uint8Array.from(signature))).toBe(expected);
  });

  it("rejects a non-image payload even when an HTTP header claims otherwise", () => {
    expect(
      detectReceiptContentType(
        new TextEncoder().encode("<html>not an image</html>"),
      ),
    ).toBeNull();
  });
});
