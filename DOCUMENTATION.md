# Chat App Backend - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Setup & Installation](#setup--installation)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [WebSocket Events](#websocket-events)
8. [Authentication](#authentication)
9. [Modules Overview](#modules-overview)
10. [Environment Variables](#environment-variables)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

## Overview

This is a real-time chat application backend built with NestJS, featuring:
- **Real-time messaging** using Socket.IO
- **JWT-based authentication**
- **Message status tracking** (SENT, DELIVERED, READ)
- **Push notifications** for new messages
- **User management** with profiles
- **PostgreSQL database** with Prisma ORM

## Technology Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT + Passport
- **Password Hashing**: bcrypt
- **Validation**: class-validator
- **Language**: TypeScript

## Project Structure

```
chat-app-backend/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── local-auth.guard.ts
│   │   └── local.strategy.ts
│   ├── chat/                  # WebSocket chat functionality
│   │   ├── chat.gateway.ts
│   │   ├── chat.service.ts
│   │   └── chat.module.ts
│   ├── message/               # Message management
│   │   ├── message.controller.ts
│   │   ├── message.service.ts
│   │   ├── message.module.ts
│   │   └── dto/
│   ├── notification/          # Notification system
│   │   ├── notification.controller.ts
│   │   ├── notification.service.ts
│   │   └── notification.module.ts
│   ├── users/                 # User management
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   └── dto/
│   ├── prisma/                # Database service
│   │   └── prisma.service.ts
│   ├── app.module.ts          # Main application module
│   └── main.ts               # Application entry point
├── package.json
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-app-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/chat_app"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   
   # (Optional) Seed the database
   npx prisma db seed
   ```

5. **Start the application**
   ```bash
   # Development mode
   npm run start:dev
   
   # Production mode
   npm run start:prod
   ```

## Database Schema

### User Model
```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  fullName  String?
  email     String   @unique
  password  String
  avatar    String?
  status    String?  // "online" / "offline"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  sentMessages     Message[]      @relation("SentMessages")
  receivedMessages Message[]      @relation("ReceivedMessages")
  Notification     Notification[]
}
```

### Message Model
```prisma
model Message {
  id        Int           @id @default(autoincrement())
  content   String
  type      MessageType   @default(TEXT)
  status    MessageStatus @default(SENT)
  createdAt DateTime      @default(now())

  senderId   Int
  receiverId Int
  sender     User @relation("SentMessages", fields: [senderId], references: [id])
  receiver   User @relation("ReceivedMessages", fields: [receiverId], references: [id])
}
```

### Notification Model
```prisma
model Notification {
  id        Int      @id @default(autoincrement())
  title     String
  content   String
  read      Boolean  @default(false)
  createdAt DateTime @default(now())

  userId Int
  user   User @relation(fields: [userId], references: [id])
}
```

### Enums
```prisma
enum MessageType {
  TEXT
  NUMBER
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
}
```

## API Documentation

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "fullName": "John Doe",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### User Endpoints

#### GET /users/me
Get current user profile (requires authentication).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "message": "JWT verified successfully!",
  "user": {
    "userId": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Message Endpoints

#### GET /messages/history
Get all messages for the authenticated user (sent and received).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "content": "Hello!",
      "type": "TEXT",
      "status": "READ",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "senderId": 1,
      "receiverId": 2,
      "sender": {
        "id": 1,
        "username": "john_doe"
      },
      "receiver": {
        "id": 2,
        "username": "jane_smith"
      }
    }
  ]
}
```

#### POST /messages/send
Send a new message via REST API.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "receiverId": 2,
  "content": "Hello Jane!"
}
```

**Response:**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "content": "Hello Jane!",
    "type": "TEXT",
    "status": "DELIVERED",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "senderId": 1,
    "receiverId": 2
  }
}
```

### Notification Endpoints

#### GET /notifications
Get all notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "title": "New Message",
      "content": "Hello Jane!",
      "read": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "userId": 2
    }
  ]
}
```

#### GET /notifications/all
Get all notifications (admin endpoint).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

#### PATCH /notifications/:id/read
Mark a notification as read.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "title": "New Message",
    "content": "Hello Jane!",
    "read": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "userId": 2
  }
}
```

## WebSocket Events

### Connection Setup

1. **Connect to WebSocket**
   ```javascript
   const socket = io('http://localhost:3000');
   ```

2. **Authenticate Socket**
   ```javascript
   socket.emit('auth', { token: 'your-jwt-token' });
   ```

### Client Events (Emit)

#### send_message
Send a real-time message.

```javascript
socket.emit('send_message', {
  receiverId: 2,
  content: "Hello from WebSocket!"
});
```

#### read_message
Mark a message as read.

```javascript
socket.emit('read_message', {
  messageId: 1,
  senderId: 1
});
```

### Server Events (Listen)

#### auth_success
Authentication successful.

```javascript
socket.on('auth_success', (data) => {
  console.log('Authenticated:', data.userId);
});
```

#### auth_failed
Authentication failed.

```javascript
socket.on('auth_failed', (data) => {
  console.log('Auth failed:', data.message);
});
```

#### receive_message
Receive a new message.

```javascript
socket.on('receive_message', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});
```

#### message_status
Message status update.

```javascript
socket.on('message_status', (data) => {
  console.log('Message status:', data.status);
  // Update message status in UI
});
```

#### notification
Receive a notification.

```javascript
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
  // Show notification to user
});
```

## Authentication

### JWT Strategy
The application uses JWT tokens for authentication. Tokens are generated during login and must be included in:
- HTTP requests as `Authorization: Bearer <token>`
- WebSocket authentication as `{ token: '<jwt-token>' }`

### Password Security
- Passwords are hashed using bcrypt
- Salt rounds: 10 (default)

### Token Expiration
JWT tokens have a default expiration time. You can configure this in the JWT strategy.

## Modules Overview

### Auth Module
- **Purpose**: Handle user authentication and registration
- **Key Features**:
  - User registration with validation
  - Login with JWT token generation
  - Password hashing with bcrypt
  - JWT strategy for protected routes

### Users Module
- **Purpose**: User profile management
- **Key Features**:
  - Get current user profile
  - JWT authentication guard

### Chat Module
- **Purpose**: Real-time messaging via WebSocket
- **Key Features**:
  - Socket.IO WebSocket gateway
  - Real-time message delivery
  - Message status tracking
  - User online/offline status

### Message Module
- **Purpose**: Message CRUD operations
- **Key Features**:
  - Save messages to database
  - Retrieve message history
  - Update message status
  - REST API for messaging

### Notification Module
- **Purpose**: Push notification system
- **Key Features**:
  - Create notifications for new messages
  - Mark notifications as read
  - Retrieve user notifications

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/chat_app"

# JWT
JWT_SECRET="your-super-secret-jwt-key"

# Server
PORT=3000

# Optional: JWT expiration (default: 1 hour)
JWT_EXPIRES_IN="1h"
```

## Testing

### Run Tests
```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Test Structure
- Unit tests for each service
- E2E tests for API endpoints
- WebSocket integration tests

## Deployment

### Production Build
```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Environment Considerations
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure database connection pooling
- Set up proper CORS for production domains

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx prisma db push

# Reset database
npx prisma migrate reset
```

#### JWT Issues
- Ensure `JWT_SECRET` is set in environment
- Check token expiration
- Verify token format in requests

#### WebSocket Connection
- Check CORS configuration
- Verify authentication token
- Ensure Socket.IO client version compatibility

#### Message Delivery
- Check if receiver is online
- Verify message status updates
- Check notification creation

### Logs
Enable debug logging by setting:
```env
DEBUG=*
```

### Performance
- Monitor database query performance
- Check WebSocket connection limits
- Monitor memory usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

---

For additional support or questions, please refer to the NestJS documentation or create an issue in the repository. 