import mongoose from "mongoose";

export async function connectDb() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is not set");

  if (mongoose.connection.readyState === 1) return;

  await mongoose.connect(uri);
};



