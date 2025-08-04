# Chat App Backend

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<p align="center">
  <strong>Real-time Chat Application Backend</strong><br>
  Built with NestJS, Socket.IO, and PostgreSQL
</p>

## 🚀 Features

- **Real-time messaging** with Socket.IO
- **JWT-based authentication**
- **Message status tracking** (SENT → DELIVERED → READ)
- **Push notifications** for new messages
- **User management** with profiles
- **PostgreSQL database** with Prisma ORM
- **RESTful API** for all operations
- **WebSocket events** for real-time communication

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Full Documentation](DOCUMENTATION.md)** - Comprehensive guide
- **[API Reference](API_REFERENCE.md)** - Detailed API documentation

## 🛠️ Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Real-time**: Socket.IO
- **Authentication**: JWT + Passport
- **Password Hashing**: bcrypt
- **Validation**: class-validator
- **Language**: TypeScript

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd chat-app-backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Set up database
npx prisma generate
npx prisma migrate dev

# Start development server
npm run start:dev
```

🎉 **Server is running at http://localhost:3000**

## 📖 API Overview

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user

### Users
- `GET /users/me` - Get current user profile

### Messages
- `GET /messages/history` - Get message history
- `POST /messages/send` - Send message

### Notifications
- `GET /notifications` - Get user notifications
- `PATCH /notifications/:id/read` - Mark notification as read

## 🔌 WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `auth` | Client → Server | Authenticate socket |
| `send_message` | Client → Server | Send real-time message |
| `receive_message` | Server → Client | Receive new message |
| `message_status` | Server → Client | Message status update |
| `notification` | Server → Client | Push notification |

## 🗂️ Project Structure

```
src/
├── auth/          # Authentication & JWT
├── chat/          # WebSocket gateway
├── message/       # Message CRUD
├── notification/  # Push notifications
├── users/         # User management
└── prisma/        # Database service
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚀 Deployment

```bash
# Production build
npm run build

# Start production server
npm run start:prod
```

## 📝 Environment Variables

Create a `.env` file:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chat_app"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3000
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- 📖 **Documentation**: [DOCUMENTATION.md](DOCUMENTATION.md)
- 🔌 **API Reference**: [API_REFERENCE.md](API_REFERENCE.md)
- ⚡ **Quick Start**: [QUICK_START.md](QUICK_START.md)
- 🐛 **Issues**: Create an issue in the repository

---

**Built with ❤️ using NestJS**
