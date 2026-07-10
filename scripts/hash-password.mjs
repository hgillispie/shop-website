import bcrypt from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/hash-password.mjs <password>");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);

// Base64-encoded so it's safe to drop into .env files — bcrypt hashes are
// full of `$`, which Next.js's env loader treats as variable interpolation
// and silently corrupts.
console.log(Buffer.from(hash, "utf8").toString("base64"));
