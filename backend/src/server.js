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
app.use(helmet());
app.use(cors({
  origin: "*"
}));
app.use(morgan('combined'));
app.use(express.json());

// Serve static files
app.use('/api/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

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

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Load WebSocket routes
  require('./routes/auth')(socket, io);
  require('./routes/users')(socket, io);
  require('./routes/rooms')(socket, io);
  require('./routes/actions')(socket, io);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };