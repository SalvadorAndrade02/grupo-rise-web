import { createHash, randomBytes, scryptSync, timingSafeEqual } from "crypto";

const PASSWORD_KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString("hex");

  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  try {
    const [algorithm, salt, hash] = storedHash.split(":");

    if (algorithm !== "scrypt" || !salt || !hash) {
      return false;
    }

    const storedBuffer = Buffer.from(hash, "hex");
    const passwordBuffer = scryptSync(
      password,
      salt,
      storedBuffer.length
    );

    return timingSafeEqual(storedBuffer, passwordBuffer);
  } catch {
    return false;
  }
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}