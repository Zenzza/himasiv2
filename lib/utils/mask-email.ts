/**
 * Menyensor (masking) alamat email untuk melindungi privasi pengirim pada antarmuka.
 *
 * Aturan:
 * - Email valid (user@domain):
 *   - user.length <= 1: `${user}***@${domain}` (misal: a@domain.com -> a***@domain.com)
 *   - user.length === 2: `${user[0]}***@${domain}` (misal: ab@domain.com -> a***@domain.com)
 *   - user.length > 2: `${user[0]}***${user[user.length - 1]}@${domain}` (misal: alumni@gmail.com -> a***i@gmail.com)
 * - Input kosong atau tidak valid (tanpa '@' atau malformed): mengembalikan input awal secara aman.
 *
 * @param email - Alamat email yang akan disensor
 * @returns Alamat email yang telah disensor atau string input awal jika tidak valid
 */
export function maskEmail(email: string): string {
  if (!email || typeof email !== "string") {
    return email;
  }

  const atIndex = email.indexOf("@");

  // Harus memiliki karakter '@' tunggal yang bukan di awal atau akhir
  if (
    atIndex <= 0 ||
    atIndex === email.length - 1 ||
    email.indexOf("@", atIndex + 1) !== -1
  ) {
    return email;
  }

  const user = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  // Pastikan user dan domain tidak hanya spasi
  if (!user.trim() || !domain.trim()) {
    return email;
  }

  if (user.length <= 1) {
    return `${user}***@${domain}`;
  }

  if (user.length === 2) {
    return `${user[0]}***@${domain}`;
  }

  return `${user[0]}***${user[user.length - 1]}@${domain}`;
}
