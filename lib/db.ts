import mongoose from "mongoose";

let cached = (global as any)._mongoose || { conn: null, promise: null };

export async function connectDB() {
  if (!process.env.MONGODB_URI) return null;
  if (cached.conn) return cached.conn;
  cached.promise = mongoose.connect(process.env.MONGODB_URI);
  cached.conn = await cached.promise;
  (global as any)._mongoose = cached;
  return cached.conn;
}

const RefundSessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },
  orderId: String,
  customerName: String,
  customerEmail: String,
  decision: String,
  refundAmount: Number,
  status: String,
  steps: [mongoose.Schema.Types.Mixed],
  startTime: String,
  endTime: String,
}, { timestamps: true });

export const RefundSession = mongoose.models.RefundSession
  || mongoose.model("RefundSession", RefundSessionSchema);