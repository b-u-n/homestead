const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const connectDB = require('./database');
require('dotenv').config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: "*"
}));
app.use(morgan('combined'));
app.use(express.json());

// Serve static files
app.use('/api/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Custom error messages per endpoint and status code
const errorMessages = {
  '/api/avatar': {
    429: 'no more rolls'
  }
};

// Rate limiting - only apply to avatar generation endpoint
const avatarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: (req, res) => {
    const endpointMessages = errorMessages['/api/avatar'] || {};
    return { error: endpointMessages[429] || 'Too many requests' };
  }
});
app.use('/api/avatar', avatarLimiter);

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Web auth routes
app.use('/auth', require('./routes/auth-web'));

// Avatar routes
app.use('/api/avatar', require('./routes/avatar'));

// User routes
app.use('/api/users', require('./routes/user-rest'));

// Account routes
app.use('/api/accounts', require('./routes/accounts'));

// Logs routes
app.use('/api/logs', require('./routes/logs'));

// Load Flow Engine
const flowEngine = require('./utils/FlowEngine');
const wishingWellFlow = require('./flows/wishingWell');
const weepingWillowFlow = require('./flows/weepingWillow');
const heartsFlow = require('./flows/hearts');

// Register flows
flowEngine.registerFlow(wishingWellFlow);
flowEngine.registerFlow(weepingWillowFlow);
flowEngine.registerFlow(heartsFlow);

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Load WebSocket routes
  require('./routes/auth')(socket, io);
  require('./routes/users')(socket, io);
  require('./routes/rooms')(socket, io);
  require('./routes/actions')(socket, io);
  require('./routes/layers')(socket, io);
  require('./routes/soundSettings')(socket, io);
  require('./routes/map')(socket, io);

  // Setup Flow Engine handlers
  flowEngine.setupFlow(socket, io, 'wishingWell');
  flowEngine.setupFlow(socket, io, 'weepingWillow');
  flowEngine.setupFlow(socket, io, 'hearts');

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };