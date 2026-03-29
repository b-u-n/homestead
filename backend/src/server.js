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
  },
  maxHttpBufferSize: 10e6 // 10MB — needed for base64 image uploads via WebSocket
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

// Serve static files (local avatars — legacy, new ones go to GCS)
app.use('/api/avatars', express.static(path.join(__dirname, '../public/avatars')));

// Fallback: proxy avatars from GCS when not found locally
const { Storage: AvatarStorage } = require('@google-cloud/storage');
const avatarGcs = new AvatarStorage({
  keyFilename: path.join(__dirname, '../config/gcs-credentials.json')
});
const avatarGcsBucket = avatarGcs.bucket(process.env.GCS_AVATARS_BUCKET_NAME);
app.get('/api/avatars/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    if (!filename.startsWith('avatar_') || filename.includes('..') || filename.includes('/')) {
      return res.status(400).send('Invalid filename');
    }
    const file = avatarGcsBucket.file(filename);
    const [metadata] = await file.getMetadata();
    res.set('Content-Type', metadata.contentType || 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    file.createReadStream().pipe(res);
  } catch (err) {
    if (err.code === 404) return res.status(404).send('Not found');
    console.error('Avatar GCS proxy error:', err);
    res.status(500).send('Failed to load avatar');
  }
});

// Proxy GCS bazaar content (bucket has uniform access, no public URLs)
const { getFileStream } = require('./services/shopContentService');
app.get('/api/bazaar-content/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    // Only allow bazaar_ prefixed filenames
    if (!filename.startsWith('bazaar_') || filename.includes('..') || filename.includes('/')) {
      return res.status(400).send('Invalid filename');
    }
    const file = getFileStream(filename);
    const [metadata] = await file.getMetadata();
    res.set('Content-Type', metadata.contentType || 'application/octet-stream');
    res.set('Cache-Control', 'public, max-age=86400');
    file.createReadStream().pipe(res);
  } catch (err) {
    if (err.code === 404) return res.status(404).send('Not found');
    console.error('GCS proxy error:', err);
    res.status(500).send('Failed to load content');
  }
});

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

// Report issues routes
const reportIssuesRouter = require('./routes/reportIssues');
app.use('/api/report-issues', reportIssuesRouter);

// Load Flow Engine
const flowEngine = require('./utils/FlowEngine');
const wishingWellFlow = require('./flows/wishingWell');
const weepingWillowFlow = require('./flows/weepingWillow');
const notificationsFlow = require('./flows/notifications');
const workbookFlow = require('./flows/workbook');
const bazaarFlow = require('./flows/bazaar');
const moderationFlow = require('./flows/moderation');
const adminFlow = require('./flows/admin');
const featuresFlow = require('./flows/features');
const knapsackFlow = require('./flows/knapsack');
const pixelPalsFlow = require('./flows/pixelPals');

// Register flows
flowEngine.registerFlow(wishingWellFlow);
flowEngine.registerFlow(weepingWillowFlow);
flowEngine.registerFlow(notificationsFlow);
flowEngine.registerFlow(workbookFlow);
flowEngine.registerFlow(bazaarFlow);
flowEngine.registerFlow(moderationFlow);
flowEngine.registerFlow(adminFlow);
flowEngine.registerFlow(featuresFlow);
flowEngine.registerFlow(knapsackFlow);
flowEngine.registerFlow(pixelPalsFlow);

// Pass io to report issues router for notifications
reportIssuesRouter.setIo(io);

// Pixel Pals credit notification cron — every 30 seconds
const cron = require('node-cron');
const PixelBoard = require('./models/PixelBoard');
const { createNotification } = require('./flows/notifications');

console.log('pixelPals credit cron registered (every 30s)');
cron.schedule('*/30 * * * * *', async () => {
  try {
    const now = new Date();
    const boards = await PixelBoard.find({
      status: 'active',
      contributorStats: {
        $elemMatch: {
          nextCreditAt: { $lte: now },
          creditNotified: false
        }
      }
    });

    for (const board of boards) {
      for (const stat of board.contributorStats) {
        if (stat.nextCreditAt && stat.nextCreditAt <= now && !stat.creditNotified) {
          stat.creditNotified = true;
          await createNotification(io, {
            recipientId: stat.userId,
            type: 'pixelPals:creditsAvailable',
            message: 'pixels available',
            navigation: {
              flow: 'pixelPals',
              dropId: 'pixelPals:canvas',
              params: { boardId: board._id.toString() }
            },
            actor: null
          });
        }
      }
      await board.save();
    }
  } catch (err) {
    console.error('pixelPals credit cron error:', err.message);
  }
});

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
  require('./routes/themeSettings')(socket, io);
  require('./routes/copyrightPreferences')(socket, io);
  require('./routes/map')(socket, io);

  // Setup Flow Engine handlers
  flowEngine.setupFlow(socket, io, 'wishingWell');
  flowEngine.setupFlow(socket, io, 'weepingWillow');
  flowEngine.setupFlow(socket, io, 'notifications');
  flowEngine.setupFlow(socket, io, 'workbook');
  flowEngine.setupFlow(socket, io, 'bazaar');
  flowEngine.setupFlow(socket, io, 'moderation');
  flowEngine.setupFlow(socket, io, 'admin');
  flowEngine.setupFlow(socket, io, 'features');
  flowEngine.setupFlow(socket, io, 'knapsack');
  flowEngine.setupFlow(socket, io, 'pixelPals');

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };