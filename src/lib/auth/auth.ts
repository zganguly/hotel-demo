import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

let mongoClient: MongoClient | null = null;

function createDatabase() {
  if (!uri) {
    return memoryAdapter({});
  }
  if (!mongoClient) {
    mongoClient = new MongoClient(uri);
  }
  const db = mongoClient.db(process.env.MONGODB_DB_NAME || "hotel_pms");
  return mongodbAdapter(db, { client: mongoClient });
}

const appUrl = process.env.BETTER_AUTH_URL || process.env.APP_URL || "http://localhost:3000";

export const auth = betterAuth({
  appName: process.env.APP_NAME || "Hotel PMS",
  baseURL: appUrl,
  secret: process.env.BETTER_AUTH_SECRET || "dev-only-change-me-in-production",
  database: createDatabase(),
  trustedOrigins: [
    appUrl,
    process.env.NEXT_PUBLIC_APP_URL,
    "https://nxt-tst.duckdns.org",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter((value, index, list): value is string => Boolean(value) && list.indexOf(value) === index),
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
  plugins: [nextCookies()],
});
