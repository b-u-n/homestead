# MongoDB Setup for Homestead

## Quick Start

```bash
# Start MongoDB
cd mongo && ./start.sh

# Stop MongoDB  
cd mongo && ./stop.sh
```

## What's Included

- **MongoDB 7.0**: Main database
- **Mongo Express**: Web UI for database management
- **Auto-initialization**: Creates collections and sample data

## Access

- **MongoDB**: `mongodb://admin:homestead123@localhost:27017/homestead`
- **Mongo Express**: http://localhost:8081 (admin/homestead123)

## Commands

```bash
# View logs
cd mongo && docker-compose logs -f

# Restart containers
cd mongo && docker-compose restart

# Remove everything (including data)
cd mongo && docker-compose down -v
```

## Collections Created

- `users` - User accounts and profiles
- `rooms` - Virtual rooms and maps  
- `actions` - Activity logs and audit trail

## Sample Data

Includes a default "Town Square" room with welcome sign, fountain, and community board.