# Homestead Setup Guide

## Prerequisites

- **Node.js** (v18 or higher) - recommended to install via [nvm](https://github.com/nvm-sh/nvm)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose** (optional, for local MongoDB)
- **Git**

## 1. Clone the Repository

```bash
git clone <repository-url>
cd homestead
```

## 2. Install Dependencies

Install dependencies for both backend and frontend:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

cd ..
```

## 3. Configure Environment Variables

### Backend (.env)

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and configure:

| Variable | Description |
|----------|-------------|
| `PORT` | Backend server port (default: 9000) |
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID from [Google Cloud Console](https://console.cloud.google.com/) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `JWT_SECRET` | Secret for JWT tokens (generate with command below) |
| `FRONTEND_URL` | Frontend URL (default: http://localhost:9001) |
| `OPENAI_API_KEY` | OpenAI API key for avatar generation |

Generate a JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB (optional, for local Docker)

```bash
cp mongo/.env.example mongo/.env
```

Edit `mongo/.env` and set secure passwords:

| Variable | Description |
|----------|-------------|
| `MONGO_INITDB_ROOT_USERNAME` | MongoDB admin username |
| `MONGO_INITDB_ROOT_PASSWORD` | MongoDB admin password |
| `MONGO_INITDB_DATABASE` | Database name (default: homestead) |
| `ME_CONFIG_BASICAUTH_USERNAME` | Mongo Express web UI username |
| `ME_CONFIG_BASICAUTH_PASSWORD` | Mongo Express web UI password |

## 4. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services > Credentials**
4. Create **OAuth 2.0 Client ID** (Web application type)
5. Add authorized JavaScript origins:
   - `http://localhost:9000`
   - `http://localhost:9001`
6. Add authorized redirect URIs:
   - `http://localhost:9000/auth/google/callback`
7. Copy the Client ID and Client Secret to your `backend/.env`

## 5. Start the Project

### Using the start script (recommended)

```bash
./start.sh
```

This will:
- Start MongoDB via Docker (if Docker is available)
- Start the backend with PM2
- Start the frontend with PM2

### Manual start

```bash
# Start MongoDB (if using Docker)
cd mongo && ./start.sh && cd ..

# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
cd frontend && npm start
```

## 6. Enable Startup on Boot (optional)

To ensure services start automatically after a system reboot:

```bash
pm2 startup
```

Follow the instructions printed by the command, then:

```bash
pm2 save
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:9000 | Express.js REST API |
| Frontend | http://localhost:9001 | Expo React Native app |
| MongoDB | mongodb://localhost:27017 | Database |
| Mongo Express | http://localhost:8001 | MongoDB web UI |

## Useful Commands

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs                      # All logs
pm2 logs homestead-backend    # Backend only
pm2 logs homestead-frontend   # Frontend only

# Monitor processes
pm2 monit

# Restart services
pm2 restart homestead-backend
pm2 restart homestead-frontend

# Stop all services
./stop.sh

# Remove processes from PM2
pm2 delete all
```

## Troubleshooting

### Backend won't start
- Check `pm2 logs homestead-backend` for errors
- Verify MongoDB is running: `docker ps`
- Verify `.env` file exists and has valid values

### MongoDB connection failed
- Ensure Docker is running: `docker info`
- Check MongoDB container: `cd mongo && docker-compose ps`
- View MongoDB logs: `cd mongo && docker-compose logs`

### Frontend won't connect to backend
- Verify backend is running: `curl http://localhost:9000`
- Check CORS settings in backend
- Ensure `FRONTEND_URL` in backend `.env` matches frontend URL
