import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env/server", () => ({
  serverEnvironment: {
    NODE_ENV: "production",
    SUPABASE_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    SUPABASE_RECEIPTS_BUCKET: "payment-receipts",
  },
}));
vi.mock("@/lib/prisma/client", () => ({
  getPrismaClient: () => ({ privateReceipt: database }),
}));

import {
  deletePrivateReceipt,
  readPrivateReceipt,
  storePrivateReceipt,
} from "@/features/telegram/storage";

describe("production receipt database storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    database.create.mockResolvedValue({ objectKey: "stored" });
    database.deleteMany.mockResolvedValue({ count: 1 });
  });

  it("stores, reads, and deletes a private receipt without Supabase", async () => {
    const objectKey = await storePrivateReceipt("order-1", {
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
    });

    expect(objectKey).toMatch(/^orders\/order-1\/.+\.png$/);
    expect(database.create).toHaveBeenCalledOnce();
    const stored = database.create.mock.calls[0]?.[0] as {
      data: { objectKey: string; contentType: string; bytes: Uint8Array };
    };
    expect(stored.data.objectKey).toBe(objectKey);
    expect(stored.data.contentType).toBe("image/png");
    expect(Array.from(stored.data.bytes)).toEqual([1, 2, 3]);

    database.findUnique.mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      contentType: "image/png",
    });
    const response = await readPrivateReceipt(objectKey);

    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );

    await deletePrivateReceipt(objectKey);
    expect(database.deleteMany).toHaveBeenCalledWith({ where: { objectKey } });
  });
});
