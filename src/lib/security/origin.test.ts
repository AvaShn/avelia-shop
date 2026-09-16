import { describe, expect, it } from "vitest";

import { isTrustedMutationOrigin } from "./origin";

describe("mutation origin protection", () => {
  it("accepts same-origin browser requests", () => {
    const request = new Request("https://avelia.example/api/cart", {
      headers: {
        origin: "https://avelia.example",
        "sec-fetch-site": "same-origin",
      },
    });
    expect(isTrustedMutationOrigin(request)).toBe(true);
  });

  it("rejects cross-site requests even when an origin is omitted", () => {
    const request = new Request("https://avelia.example/api/cart", {
      headers: { "sec-fetch-site": "cross-site" },
    });
    expect(isTrustedMutationOrigin(request)).toBe(false);
  });
});
