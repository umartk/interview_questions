# Node.js Advanced Concepts

## 🎯 Purpose
This project demonstrates advanced Node.js concepts essential for senior MERN stack developer interviews. It covers production-ready patterns for building scalable, secure, and maintainable backend applications.

## 📁 Project Structure

```
node/
├── server.js              # Main Express server with middleware setup
├── cluster-example.js     # Multi-process clustering for CPU utilization
├── package.json           # Dependencies and scripts
├── middleware/
│   ├── auth.js           # JWT authentication middleware
│   └── errorHandler.js   # Centralized error handling
├── routes/
│   ├── auth.js           # Authentication routes (login, register, refresh)
│   └── users.js          # User management routes
└── utils/
    └── logger.js         # Winston logger configuration
```

## 🔑 Key Concepts Covered

### 1. Clustering (cluster-example.js)
- **What**: Spawns multiple Node.js processes to utilize all CPU cores
- **Why**: Node.js is single-threaded; clustering enables horizontal scaling
- **Interview Tip**: Explain how the master process manages workers and handles failures

### 2. JWT Authentication (middleware/auth.js)
- **What**: Token-based authentication with access and refresh tokens
- **Why**: Stateless authentication that scales across multiple servers
- **Interview Tip**: Discuss token expiration, refresh strategies, and security considerations

### 3. Rate Limiting (server.js)
- **What**: Limits requests per IP to prevent abuse
- **Why**: Protects against DDoS attacks and brute force attempts
- **Interview Tip**: Explain different rate limiting strategies (sliding window, token bucket)

### 4. Error Handling (middleware/errorHandler.js)
- **What**: Centralized error handling with custom error classes
- **Why**: Consistent error responses and proper logging
- **Interview Tip**: Discuss operational vs programmer errors

### 5. Logging (utils/logger.js)
- **What**: Structured logging with Winston
- **Why**: Essential for debugging and monitoring in production
- **Interview Tip**: Explain log levels, transports, and log aggregation

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run single instance
npm start

# Run with clustering (utilizes all CPU cores)
npm run cluster

# Run in development mode with auto-reload
npm run dev
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token

### Users (Protected)
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile

### Health Check
- `GET /health` - Server health status with memory usage

## 🎤 Common Interview Questions

1. **How does Node.js handle concurrent requests if it's single-threaded?**
   - Event loop, non-blocking I/O, libuv thread pool

2. **What's the difference between process.nextTick() and setImmediate()?**
   - nextTick executes before I/O callbacks, setImmediate after

3. **How would you handle memory leaks in Node.js?**
   - Heap snapshots, memory profiling, avoiding global variables

4. **Explain the Node.js event loop phases**
   - Timers → Pending callbacks → Idle/Prepare → Poll → Check → Close callbacks

5. **How do you handle graceful shutdown?**
   - Listen for SIGTERM/SIGINT, close connections, finish pending requests
