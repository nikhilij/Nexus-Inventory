import { MongoClient } from 'mongodb';

// Server-side cached MongoClient to avoid reconnecting on every request.
let cached = global._mongoClient;
if (!cached) cached = global._mongoClient = { client: null, promise: null };

export async function connectToDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (cached.client) return cached.client.db();
  if (!cached.promise) {
    const client = new MongoClient(uri);
    cached.promise = client.connect().then(() => {
      cached.client = client;
      return client;
    });
  }
  await cached.promise;
  return cached.client.db();
}
