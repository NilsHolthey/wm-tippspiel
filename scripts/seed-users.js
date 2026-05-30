/**
 * Creates / resets all players.
 * Does NOT touch matches or tips.
 *
 * Usage: npm run seed-users
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

if (!process.env.USERS_JSON) { console.error("USERS_JSON not set"); process.exit(1); }

const UserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin:      { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const pw = (p) => bcrypt.hashSync(p, 10);

const USERS = JSON.parse(process.env.USERS_JSON);

await mongoose.connect(MONGODB_URI, { bufferCommands: false });
console.log("Connected");

await User.deleteMany();
console.log("Cleared users");

await User.insertMany(
  USERS.map(u => ({ username: u.username, passwordHash: pw(u.password), isAdmin: u.isAdmin }))
);

console.log("\n✅ Users created:\n");
const pad = (s, n) => s.padEnd(n);
console.log(`  ${pad("Username", 12)} Password`);
console.log(`  ${"-".repeat(28)}`);
for (const u of USERS) {
  console.log(`  ${pad(u.username, 12)} ${u.password}${u.isAdmin ? "  ← Admin" : ""}`);
}

await mongoose.disconnect();
