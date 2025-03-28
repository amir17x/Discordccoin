/**
 * اتصال به مونگو
 * این فایل برای اتصال به پایگاه داده مونگو استفاده می‌شود
 */

import mongoose from 'mongoose';
import { MongoClient, Collection } from 'mongodb';
import { botConfig } from '../discord/utils/config';

let mongoClient: MongoClient | null = null;

export async function connectMongo(collectionName: string): Promise<Collection<Document>> {
  const mongodbUri = process.env.MONGODB_URI || botConfig.getConfig().mongodbUri;
  if (!mongodbUri) {
    throw new Error('MongoDB URI is not defined in configuration or environment');
  }

  if (!mongoClient) {
    mongoClient = new MongoClient(mongodbUri);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
  }

  return mongoClient.db().collection(collectionName);
}

export async function connectMongoose() {
  const mongodbUri = process.env.MONGODB_URI || botConfig.getConfig().mongodbUri;
  if (!mongodbUri) {
    throw new Error('MongoDB URI is not defined in configuration or environment');
  }

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongodbUri, {
        // @ts-ignore - اخطار تایپ‌اسکریپت را نادیده می‌گیریم
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('Connected to MongoDB with Mongoose');
    } catch (error) {
      console.error('Error connecting to MongoDB with Mongoose:', error);
      throw error;
    }
  }

  return mongoose.connection;
}

export async function disconnectMongo() {
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
    console.log('Disconnected from MongoDB');
  }

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB with Mongoose');
  }
}

// اتصال به مونگوس وقتی ماژول import می‌شود
connectMongoose().catch(console.error);

// اضافه کردن hook برای بستن اتصال‌ها هنگام خروج برنامه
process.on('SIGINT', async () => {
  await disconnectMongo();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectMongo();
  process.exit(0);
});