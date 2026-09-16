import "server-only";

import { createOpaqueToken } from "@/lib/security/tokens";
import { serverEnvironment } from "@/lib/env/server";

function storageConfiguration() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_RECEIPTS_BUCKET } =
    serverEnvironment;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("PRIVATE_RECEIPT_STORAGE_NOT_CONFIGURED");
  }
  return {
    baseUrl: SUPABASE_URL.replace(/\/$/, ""),
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    bucket: SUPABASE_RECEIPTS_BUCKET,
  };
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
