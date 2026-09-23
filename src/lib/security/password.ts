import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

function scryptAsync(password: string, salt: Buffer, keyLength: number) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function createPasswordHash(
  password: string,
  options: { minimumLength?: number } = {},
) {
  const minimumLength = options.minimumLength ?? 12;
  if (password.length < minimumLength) {
    throw new Error(
      `Password must contain at least ${minimumLength} character(s).`,
    );
  }

  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, 64);
  // Colons are safe in dotenv files. Dollar separators would be interpreted
  // as variable expansion by Next.js while loading .env.local.
  return `scrypt:${salt.toString("base64url")}:${derivedKey.toString("base64url")}`;
}

export async function verifyPassword(password: string, encodedHash: string) {
  const separator = encodedHash.startsWith("scrypt:") ? ":" : "$";
  const [algorithm, saltValue, hashValue] = encodedHash.split(separator);
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

  try {
    const expected = Buffer.from(hashValue, "base64url");
    const actual = await scryptAsync(
      password,
      Buffer.from(saltValue, "base64url"),
      expected.length,
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
