# Chat App Backend - API Reference

## Base URL
```
http://localhost:3000
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Error Responses

The API uses standard HTTP status codes and returns error responses in this format:
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### POST /auth/register

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

**Validation Rules:**
- `username`: Required, unique, 3-20 characters
- `email`: Required, valid email format, unique
- `password`: Required, minimum 6 characters
- `fullName`: Optional, maximum 100 characters

**Success Response (201):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "fullName": "John Doe",
  "avatar": null,
  "status": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error Responses:**
- `400` - Validation error
- `409` - Username or email already exists

---

### POST /auth/login

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInVzZXJuYW1lIjoiam9obl9kb2UiLCJlbWFpbCI6ImpvaG5AZXhhbXBsZS5jb20iLCJpYXQiOjE3MDQwNjQwMDAsImV4cCI6MTcwNDA2NzYwMH0.example",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
- `400` - Invalid credentials
- `401` - Authentication failed

---

## User Endpoints

### GET /users/me

Get current user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
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

**Error Responses:**
- `401` - Invalid or missing token

---

## Message Endpoints

### GET /messages/history

Get all messages for the authenticated user (sent and received).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50, max: 100)
- `offset` (optional): Number of messages to skip (default: 0)
- `status` (optional): Filter by message status (SENT, DELIVERED, READ)

**Example Request:**
```
GET /messages/history?limit=20&offset=0&status=READ
```

**Success Response (200):**
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
        "username": "john_doe",
        "fullName": "John Doe",
        "avatar": null
      },
      "receiver": {
        "id": 2,
        "username": "jane_smith",
        "fullName": "Jane Smith",
        "avatar": null
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401` - Invalid or missing token

---

### POST /messages/send

Send a new message via REST API.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "receiverId": 2,
  "content": "Hello Jane!",
  "type": "TEXT"
}
```

**Validation Rules:**
- `receiverId`: Required, valid user ID
- `content`: Required, non-empty string, maximum 1000 characters
- `type`: Optional, "TEXT" or "NUMBER" (default: "TEXT")

**Success Response (201):**
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
}
```

**Error Responses:**
- `400` - Invalid request data
- `401` - Invalid or missing token
- `404` - Receiver not found

---

### PATCH /messages/:id/status

Update message status.

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "READ"
}
```

**Valid Status Values:**
- `SENT`
- `DELIVERED`
- `READ`

**Success Response (200):**
```json
{
  "success": true,
  "message": {
    "id": 1,
    "status": "READ",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Invalid status
- `401` - Invalid or missing token
- `404` - Message not found
- `403` - Not authorized to update this message

---

## Notification Endpoints

### GET /notifications

Get all notifications for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 20, max: 100)
- `offset` (optional): Number of notifications to skip (default: 0)
- `read` (optional): Filter by read status (true/false)

**Example Request:**
```
GET /notifications?limit=10&read=false
```

**Success Response (200):**
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
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401` - Invalid or missing token

---

### GET /notifications/all

Get all notifications (admin endpoint).

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `limit` (optional): Number of notifications to return (default: 50, max: 200)
- `offset` (optional): Number of notifications to skip (default: 0)
- `userId` (optional): Filter by user ID

**Success Response (200):**
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
      "userId": 2,
      "user": {
        "id": 2,
        "username": "jane_smith",
        "email": "jane@example.com"
      }
    }
  ]
}
```

**Error Responses:**
- `401` - Invalid or missing token
- `403` - Insufficient permissions

---

### PATCH /notifications/:id/read

Mark a notification as read.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
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

**Error Responses:**
- `401` - Invalid or missing token
- `404` - Notification not found
- `403` - Not authorized to update this notification

---

### PATCH /notifications/read-all

Mark all notifications as read for the authenticated user.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "updatedCount": 15
}
```

**Error Responses:**
- `401` - Invalid or missing token

---

## WebSocket Events Reference

### Connection

**Connect to WebSocket:**
```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  autoConnect: true
});
```

### Authentication

**Emit: auth**
```javascript
socket.emit('auth', { token: 'your-jwt-token' });
```

**Listen: auth_success**
```javascript
socket.on('auth_success', (data) => {
  console.log('Authenticated with user ID:', data.userId);
});
```

**Listen: auth_failed**
```javascript
socket.on('auth_failed', (data) => {
  console.log('Authentication failed:', data.message);
});
```

### Messaging

**Emit: send_message**
```javascript
socket.emit('send_message', {
  receiverId: 2,
  content: "Hello from WebSocket!",
  type: "TEXT" // optional, default: "TEXT"
});
```

**Listen: receive_message**
```javascript
socket.on('receive_message', (message) => {
  console.log('New message received:', message);
  // message structure:
  // {
  //   id: 1,
  //   content: "Hello from WebSocket!",
  //   type: "TEXT",
  //   status: "DELIVERED",
  //   createdAt: "2024-01-01T00:00:00.000Z",
  //   senderId: 1,
  //   receiverId: 2,
  //   sender: { id: 1, username: "john_doe" },
  //   receiver: { id: 2, username: "jane_smith" }
  // }
});
```

**Listen: message_status**
```javascript
socket.on('message_status', (data) => {
  console.log('Message status updated:', data);
  // data structure:
  // {
  //   id: 1,
  //   status: "READ" // or "DELIVERED"
  // }
});
```

### Read Receipts

**Emit: read_message**
```javascript
socket.emit('read_message', {
  messageId: 1,
  senderId: 1
});
```

### Notifications

**Listen: notification**
```javascript
socket.on('notification', (notification) => {
  console.log('New notification:', notification);
  // notification structure:
  // {
  //   title: "New Message",
  //   content: "Hello Jane!",
  //   type: "NEW_MESSAGE", // optional
  //   senderId: 1, // optional
  //   messageId: 1 // optional
  // }
});
```

### Connection Events

**Listen: connect**
```javascript
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});
```

**Listen: disconnect**
```javascript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

**Listen: error**
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Message endpoints**: 100 requests per minute per user
- **Notification endpoints**: 200 requests per minute per user
- **WebSocket connections**: 10 connections per minute per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit`: Number of items per page (default varies by endpoint)
- `offset`: Number of items to skip

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Data Types

### MessageType
```typescript
enum MessageType {
  TEXT = "TEXT",
  NUMBER = "NUMBER"
}
```

### MessageStatus
```typescript
enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ"
}
```

### User Status
```typescript
type UserStatus = "online" | "offline" | null;
```

---

## Client Libraries

### JavaScript/TypeScript
```bash
npm install socket.io-client
```

### Python
```bash
pip install socketio-client
```

### Java
```xml
<dependency>
    <groupId>io.socket</groupId>
    <artifactId>socket.io-client</artifactId>
    <version>2.0.0</version>
</dependency>
```

---

## Examples

### Complete JavaScript Client Example
```javascript
import io from 'socket.io-client';

class ChatClient {
  constructor(serverUrl, token) {
    this.socket = io(serverUrl);
    this.token = token;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.authenticate();
    });

    this.socket.on('auth_success', (data) => {
      console.log('Authenticated:', data.userId);
    });

    this.socket.on('receive_message', (message) => {
      console.log('New message:', message);
      this.displayMessage(message);
    });

    this.socket.on('notification', (notification) => {
      console.log('Notification:', notification);
      this.showNotification(notification);
    });
  }

  authenticate() {
    this.socket.emit('auth', { token: this.token });
  }

  sendMessage(receiverId, content) {
    this.socket.emit('send_message', {
      receiverId,
      content,
      type: 'TEXT'
    });
  }

  markAsRead(messageId, senderId) {
    this.socket.emit('read_message', {
      messageId,
      senderId
    });
  }

  displayMessage(message) {
    // Implementation for displaying message in UI
  }

  showNotification(notification) {
    // Implementation for showing notification
  }
}

// Usage
const client = new ChatClient('http://localhost:3000', 'your-jwt-token');
client.sendMessage(2, 'Hello!');
```

---

## Support

For API support and questions:
- Check the main documentation: `DOCUMENTATION.md`
- Review error responses for troubleshooting
- Ensure proper authentication headers
- Verify WebSocket connection and authentication 