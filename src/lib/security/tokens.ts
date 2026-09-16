import { createHash, createHmac, randomBytes } from "node:crypto";

const opaqueTokenPattern = /^[A-Za-z0-9_-]{32,160}$/;

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPaymentSessionToken(
  publicOrderToken: string,
  secret: string,
) {
  return createHmac("sha256", secret)
    .update(`avelia-payment:${publicOrderToken}`)
    .digest("base64url");
}

export function isValidOpaqueToken(token: string) {
  return opaqueTokenPattern.test(token);
}
