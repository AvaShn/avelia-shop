import "server-only";

import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";

import { createOpaqueToken } from "@/lib/security/tokens";
import { serverEnvironment } from "@/lib/env/server";
import { getPrismaClient } from "@/lib/prisma/client";

const localReceiptRoot = resolve(
  process.cwd(),
  ".local-data",
  "payment-receipts",
);

function storageConfiguration() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_RECEIPTS_BUCKET } =
    serverEnvironment;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return {
    baseUrl: SUPABASE_URL.replace(/\/$/, ""),
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    bucket: SUPABASE_RECEIPTS_BUCKET,
  };
}

function localReceiptPath(objectKey: string) {
  const filePath = resolve(localReceiptRoot, objectKey);
  if (!filePath.startsWith(`${localReceiptRoot}${sep}`)) {
    throw new Error("INVALID_LOCAL_RECEIPT_PATH");
  }
  return filePath;
}

function localReceiptContentType(objectKey: string) {
  const extension = extname(objectKey).toLowerCase();
  if (extension === ".png") return "image/png";
  if (extension === ".webp") return "image/webp";
  return "image/jpeg";
}

function encodedObjectPath(objectKey: string) {
  return objectKey.split("/").map(encodeURIComponent).join("/");
}

function storageHeaders(serviceRoleKey: string) {
  return {
    Authorization: `Bearer ${serviceRoleKey}`,
    apikey: serviceRoleKey,
  };
}

function requiredReceiptDatabase() {
  const prisma = getPrismaClient();
  if (!prisma) throw new Error("PRIVATE_RECEIPT_DATABASE_NOT_CONFIGURED");
  return prisma;
}

export async function storePrivateReceipt(
  orderId: string,
  receipt: { bytes: Uint8Array; contentType: string },
) {
  const configuration = storageConfiguration();
  const extension =
    receipt.contentType === "image/png"
      ? "png"
      : receipt.contentType === "image/webp"
        ? "webp"
        : "jpg";
  const objectKey = `orders/${orderId}/${createOpaqueToken(18)}.${extension}`;
  if (!configuration) {
    if (serverEnvironment.NODE_ENV === "production") {
      await requiredReceiptDatabase().privateReceipt.create({
        data: {
          objectKey,
          contentType: receipt.contentType,
          bytes: Buffer.from(receipt.bytes),
        },
      });
      return objectKey;
    }
    const filePath = localReceiptPath(objectKey);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, receipt.bytes, { flag: "wx" });
    return objectKey;
  }

  const response = await fetch(
    `${configuration.baseUrl}/storage/v1/object/${encodeURIComponent(configuration.bucket)}/${encodedObjectPath(objectKey)}`,
    {
      method: "POST",
      headers: {
        ...storageHeaders(configuration.serviceRoleKey),
        "Content-Type": receipt.contentType,
        "x-upsert": "false",
      },
      body: Buffer.from(receipt.bytes),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  if (!response.ok) {
    throw new Error(`PRIVATE_RECEIPT_UPLOAD_FAILED:${response.status}`);
  }
  return objectKey;
}

export async function readPrivateReceipt(objectKey: string) {
  const configuration = storageConfiguration();
  if (!configuration) {
    if (serverEnvironment.NODE_ENV === "production") {
      const receipt = await requiredReceiptDatabase().privateReceipt.findUnique(
        {
          where: { objectKey },
          select: { bytes: true, contentType: true },
        },
      );
      if (!receipt) throw new Error("PRIVATE_RECEIPT_NOT_FOUND");
      return new Response(receipt.bytes, {
        headers: {
          "Content-Type": receipt.contentType,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const bytes = await readFile(localReceiptPath(objectKey));
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": localReceiptContentType(objectKey) },
    });
  }

  const response = await fetch(
    `${configuration.baseUrl}/storage/v1/object/authenticated/${encodeURIComponent(configuration.bucket)}/${encodedObjectPath(objectKey)}`,
    {
      headers: storageHeaders(configuration.serviceRoleKey),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  if (!response.ok || !response.body) {
    throw new Error(`PRIVATE_RECEIPT_READ_FAILED:${response.status}`);
  }
  return response;
}

export async function deletePrivateReceipt(objectKey: string) {
  const configuration = storageConfiguration();
  if (!configuration) {
    if (serverEnvironment.NODE_ENV === "production") {
      await requiredReceiptDatabase().privateReceipt.deleteMany({
        where: { objectKey },
      });
      return;
    }
    try {
      await unlink(localReceiptPath(objectKey));
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
    return;
  }

  const response = await fetch(
    `${configuration.baseUrl}/storage/v1/object/${encodeURIComponent(configuration.bucket)}/${encodedObjectPath(objectKey)}`,
    {
      method: "DELETE",
      headers: storageHeaders(configuration.serviceRoleKey),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    },
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`PRIVATE_RECEIPT_DELETE_FAILED:${response.status}`);
  }
}
