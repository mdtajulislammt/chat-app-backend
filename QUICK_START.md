# Chat App Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you set up and run the chat app backend quickly.

## Prerequisites

- **Node.js** (v16 or higher)
- **PostgreSQL** database
- **npm** or **yarn**

## Quick Setup

### 1. Clone and Install
```bash
git clone <repository-url>
cd chat-app-backend
npm install
```

### 2. Database Setup
```bash
# Create a PostgreSQL database
createdb chat_app

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Environment Configuration
Create `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chat_app"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

### 4. Database Migration
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Start the Server
```bash
npm run start:dev
```

🎉 **Server is running at http://localhost:3000**

## Quick Test

### 1. Register a User
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### 2. Login and Get Token
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. Test WebSocket Connection
```javascript
// In browser console or Node.js
const socket = io('http://localhost:3000');

socket.emit('auth', { token: 'your-jwt-token' });

socket.on('auth_success', (data) => {
  console.log('Connected!', data);
});
```

## Key Features

✅ **Real-time messaging** with Socket.IO  
✅ **JWT authentication**  
✅ **Message status tracking** (SENT → DELIVERED → READ)  
✅ **Push notifications**  
✅ **User management**  
✅ **PostgreSQL with Prisma ORM**  

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/users/me` | Get current user |
| GET | `/messages/history` | Get message history |
| POST | `/messages/send` | Send message |
| GET | `/notifications` | Get notifications |
| PATCH | `/notifications/:id/read` | Mark notification as read |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `auth` | Client → Server | Authenticate socket |
| `send_message` | Client → Server | Send real-time message |
| `receive_message` | Server → Client | Receive new message |
| `message_status` | Server → Client | Message status update |
| `notification` | Server → Client | Push notification |

## Development Commands

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build

# Run tests
npm run test

# Database operations
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create and apply migration
npx prisma generate        # Generate Prisma client
```

## Project Structure

```
src/
├── auth/          # Authentication & JWT
├── chat/          # WebSocket gateway
├── message/       # Message CRUD
├── notification/  # Push notifications
├── users/         # User management
└── prisma/        # Database service
```

## Common Issues

### Database Connection
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Reset database if needed
npx prisma migrate reset
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### JWT Issues
- Ensure `JWT_SECRET` is set in `.env`
- Check token expiration
- Verify token format

## Next Steps

1. **Read the full documentation**: `DOCUMENTATION.md`
2. **Check API reference**: `API_REFERENCE.md`
3. **Explore the codebase**: Start with `src/chat/chat.gateway.ts`
4. **Test WebSocket events**: Use browser console or Postman
5. **Build a frontend**: Connect to the WebSocket and REST APIs

## Support

- 📖 **Full Documentation**: `DOCUMENTATION.md`
- 🔌 **API Reference**: `API_REFERENCE.md`
- 🐛 **Issues**: Create an issue in the repository
- 💬 **Questions**: Check the documentation first

---

**Happy coding! 🎉** 