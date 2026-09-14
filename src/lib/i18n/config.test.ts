import { describe, expect, it } from "vitest";

import { documentLocale } from "./config";

describe("document locale", () => {
  it("uses Persian and right-to-left rendering", () => {
    expect(documentLocale).toEqual({
      language: "fa",
      locale: "fa-IR",
      direction: "rtl",
    });
  });
});
