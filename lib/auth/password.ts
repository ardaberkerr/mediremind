import bcrypt from "bcryptjs";

/**
 * Password utilities.
 * Supports both modern bcrypt hashing and legacy plaintext comparison.
 */

export async function hashPassword(password: string): Promise<string> {
  if (!password) return "";
  // If already hashed, don't rehash
  if (password.startsWith("$2a$") || password.startsWith("$2b$")) {
    return password;
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePasswords(
  plainText: string,
  storedPasswordHash: string
): Promise<boolean> {
  if (!plainText || !storedPasswordHash) return false;
  // If stored password is a bcrypt hash
  if (
    storedPasswordHash.startsWith("$2a$") ||
    storedPasswordHash.startsWith("$2b$")
  ) {
    return bcrypt.compare(plainText, storedPasswordHash);
  }
  // Fallback for legacy plaintext passwords
  return plainText === storedPasswordHash;
}
