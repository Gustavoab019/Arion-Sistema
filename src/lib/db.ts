// src/lib/db.ts
import mongoose, { Mongoose } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI não foi definida no .env.local");
}

// 👇 Define um tipo global seguro para cachear a conexão
interface MongooseGlobal {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// ⛔️ Evita que o TypeScript reclame do global
const globalForMongoose = global as unknown as { mongoose?: MongooseGlobal };

// 🧠 Se não existir cache ainda, cria um novo
const cached = globalForMongoose.mongoose || {
  conn: null,
  promise: null,
};
globalForMongoose.mongoose = cached;

export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI)
      .then((mongooseInstance) => mongooseInstance);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}