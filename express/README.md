# Express.js Advanced API Development

## 🎯 Purpose
This project demonstrates advanced Express.js patterns for building production-ready REST APIs. It covers API design, validation, documentation, file handling, and error management.

## 📁 Project Structure

```
express/
├── app.js                 # Main application with middleware setup
├── package.json           # Dependencies and scripts
├── middleware/
│   ├── errorHandler.js   # Centralized error handling
│   └── logger.js         # Request logging middleware
└── routes/
    ├── products.js       # Product CRUD with validation & Swagger docs
    ├── orders.js         # Order management with status workflow
    └── upload.js         # File upload with image processing
```

## 🔑 Key Concepts Covered

### 1. API Documentation (Swagger/OpenAPI)
- **What**: Auto-generated API documentation from code comments
- **Why**: Essential for API consumers and team collaboration
- **Access**: http://localhost:3000/api-docs

### 2. Input Validation (express-validator)
- **What**: Request body, params, and query validation
- **Why**: Prevents invalid data and security vulnerabilities
- **Interview Tip**: Discuss validation at different layers (client, API, database)

### 3. File Upload (Multer + Sharp)
- **What**: Handles multipart form data and image processing
- **Why**: Common requirement for user avatars, product images
- **Interview Tip**: Discuss file storage strategies (local, S3, CDN)

### 4. Pagination & Filtering
- **What**: Efficient data retrieval for large datasets
- **Why**: Performance and UX optimization
- **Interview Tip**: Discuss cursor vs offset pagination

### 5. Rate Limiting
- **What**: Limits API requests per client
- **Why**: Prevents abuse and ensures fair usage
- **Interview Tip**: Discuss distributed rate limiting with Redis

## 🚀 Getting Started

```bash
npm install
npm run dev    # Development with auto-reload
npm start      # Production mode
```

## 📝 API Endpoints

### Products
- `GET /api/products` - List products (pagination, filtering, sorting)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List all orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

### File Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/multiple` - Upload multiple images

## 🎤 Common Interview Questions

1. **What's the difference between PUT and PATCH?**
   - PUT: Replace entire resource
   - PATCH: Partial update

2. **How do you handle file uploads in Express?**
   - Multer middleware for multipart/form-data
   - Memory or disk storage options
   - File validation (type, size)

3. **How do you version your API?**
   - URL path: /api/v1/users
   - Header: Accept-Version: v1
   - Query param: ?version=1

4. **What's the difference between middleware and route handlers?**
   - Middleware: Processes request before reaching handler
   - Route handler: Final destination for a request

5. **How do you handle CORS in Express?**
   - cors middleware
   - Configure allowed origins, methods, headers
