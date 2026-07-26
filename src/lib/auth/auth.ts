import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { memoryAdapter } from "better-auth/adapters/memory";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

function createDatabase() {
  if (!uri) {
    return memoryAdapter({});
  }
  const client = new MongoClient(uri);
  const db = client.db(process.env.MONGODB_DB_NAME || "hotel_pms");
  return mongodbAdapter(db, { client });
}

export const auth = betterAuth({
  appName: process.env.APP_NAME || "Hotel PMS",
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-change-me-in-production",
  database: createDatabase(),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
});
