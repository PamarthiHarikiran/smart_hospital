require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const User = require('./models/User');
const seedData = require('./utils/seedDatabase');
const { initSocketServer } = require('./socket/socketHandler');

const PORT = process.env.PORT || 5000;

// Connect to Database and start server
const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty (e.g. fresh MongoMemoryServer or new MongoDB database)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('No users found in database. Initializing demo seed data...');
      await seedData(false);
    }

    const server = http.createServer(app);
    const io = initSocketServer(server);

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` ELITECARE HOSPITAL MANAGEMENT SYSTEM BACKEND`);
      console.log(` Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(` Listening on port: http://localhost:${PORT}`);
      console.log(` Health check:      http://localhost:${PORT}/api/health`);
      console.log(` Real-time Chat:    Socket.IO enabled with JWT auth`);
      console.log(`===============================================`);
    });

    const handleExit = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', handleExit);
    process.on('SIGINT', handleExit);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
