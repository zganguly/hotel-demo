import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongooseConn: typeof mongoose | undefined;
}

export async function connectDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (global.__mongooseConn) {
    return global.__mongooseConn;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    dbName: process.env.MONGODB_DB_NAME || "hotel_pms",
  });
  global.__mongooseConn = mongoose;
  return mongoose;
}

export { mongoose };
