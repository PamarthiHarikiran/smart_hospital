const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (uri && uri.trim() !== '') {
    try {
      console.log('Connecting to specified MongoDB URI...');
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
      return conn;
    } catch (err) {
      console.warn(`Failed to connect to configured MONGO_URI (${err.message}). Falling back to MongoMemoryServer...`);
    }
  }

  // Fallback to in-memory MongoDB for local evaluation/testing if no external DB is reachable
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'smart_hospital',
        launchTimeout: 60000,
      },
    });
    const memUri = memoryServer.getUri();
    process.env.MONGO_URI = memUri;
    const conn = await mongoose.connect(memUri);
    console.log(`Connected to MongoMemoryServer at ${memUri}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

const closeDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, closeDB };
