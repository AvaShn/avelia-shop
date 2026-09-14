import { describe, expect, it } from "vitest";

import { parseClientEnvironment } from "./client";

describe("client environment", () => {
  it("accepts a valid public application URL", () => {
    expect(
      parseClientEnvironment({
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      }),
    ).toEqual({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
  });

  it("rejects an invalid public application URL", () => {
    expect(() =>
      parseClientEnvironment({ NEXT_PUBLIC_APP_URL: "not-a-url" }),
    ).toThrow();
  });
});
