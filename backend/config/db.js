import mongoose from 'mongoose';

let cached = globalThis.__alhanaMongoConnection;

export default async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (cached?.readyState === 1) return cached;
  if (!cached) {
    cached = mongoose.connect(process.env.MONGODB_URI).then(() => mongoose.connection);
    globalThis.__alhanaMongoConnection = cached;
  }
  return cached;
}
