/**
 * Shared cryptographic utilities.
 */

/**
 * SHA-256 hash a string and return the hex digest.
 * Used for API key hashing and other one-way hashing needs.
 */
export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a random hex string of the specified byte length.
 * Default: 24 bytes = 48 hex characters.
 */
export function randomHex(byteLength = 24): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
