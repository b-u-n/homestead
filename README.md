Hi & welcome to Homestead.

This is a repository to help build better digital mental health infrastructure. We're building out mental health workbook activities that are available open source to integrate in your project.

Don't hesitate to reach out if you need anything. <3

# 🔐 SECURITY FIRST - INFORMATION SECURITY IS OUR PRIMARY CONCERN

**⚠️ CRITICAL: ANY EXPOSURE OF CLIENT SECRETS, API KEYS, OR CREDENTIALS WILL RESULT IN IMMEDIATE TERMINATION**

## Pre-Commit Security Checklist

Before committing ANY changes, you MUST:

1. **Verify .env files are NOT staged**: Run `git status` and ensure no .env files are in "Changes to be committed"
2. **Scan for exposed secrets**: Search codebase for hardcoded credentials, API keys, or connection strings
3. **If credentials are exposed**: HALT ALL WORK. Raise security alert and refuse to continue until operator confirms credentials have been regenerated and situation cleared

## Project Structure

- `frontend/` - React Native Expo frontend application
- `backend/` - Node.js Express backend API
- `mongo/` - MongoDB database setup and scripts

## Quick Start

### Start All Services

**Linux/Mac:**
```bash
./start.sh
```

**Windows:**
```cmd
start.bat
```

This will start:
- MongoDB (via Docker Compose)
- Backend API server
- Frontend Expo development server

All services run in the background. Logs are saved to the `logs/` directory.

### Stop All Services

**Linux/Mac:**
```bash
./stop.sh
```

**Windows:**
```cmd
stop.bat
```

### Service URLs

- **Frontend:** http://localhost:9001 (or your local IP:9001)
- **Backend API:** http://localhost:3000 (check logs for actual port)
- **MongoDB:** mongodb://localhost:27017
- **Mongo Express:** http://localhost:8081 (admin/homestead123)

### View Logs

**Linux/Mac:**
```bash
tail -f logs/backend.log   # Backend logs
tail -f logs/frontend.log  # Frontend logs
cd mongo && docker-compose logs -f  # MongoDB logs
```

**Windows:**
```cmd
type logs\backend.log      # Backend logs
type logs\frontend.log     # Frontend logs
cd mongo && docker-compose logs -f  # MongoDB logs
```

## Environment File Locations

- `frontend/.env` → `frontend/.env.example` (if needed)
- `backend/.env` → `backend/.env.example`
- `mongo/.env` → `mongo/.env.example`

