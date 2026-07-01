import mongoose from 'mongoose';
import env from './env';

export default async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[DB] MongoDB connected');
  } catch (err) {
    console.error(`[DB] MongoDB connection failed: ${(err as Error).message}`);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] MongoDB disconnected');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`[DB] MongoDB error: ${err.message}`);
  });
}
