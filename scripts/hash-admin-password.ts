import { createPasswordHash } from "../src/lib/security/password";

const password = process.argv[2];

if (!password) {
  throw new Error("Usage: pnpm admin:hash-password -- <strong-password>");
}

console.info(await createPasswordHash(password));
