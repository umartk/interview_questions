# Next.js Advanced Full-Stack Application

## 🎯 Purpose
This project demonstrates advanced Next.js 13+ features with the App Router, including server components, API routes, authentication, and database integration with Prisma ORM.

## 📁 Project Structure

```
next/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── providers.tsx       # Client-side providers wrapper
│   └── api/
│       ├── auth/
│       │   ├── register/route.ts  # User registration
│       │   └── login/route.ts     # User login
│       └── products/
│           ├── route.ts           # GET all, POST create
│           └── [id]/route.ts      # GET, PUT, DELETE by ID
├── lib/
│   ├── auth.ts             # JWT authentication utilities
│   └── prisma.ts           # Prisma client singleton
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## 🔑 Key Concepts Covered

### 1. App Router (Next.js 13+)
- **Server Components**: Default, render on server
- **Client Components**: 'use client' directive
- **Route Handlers**: API routes in app directory
- **Layouts**: Shared UI across routes

### 2. API Routes
- **Route Handlers**: GET, POST, PUT, DELETE in route.ts
- **Dynamic Routes**: [id] folder pattern
- **Request/Response**: NextRequest, NextResponse
- **Middleware**: Authentication, validation

### 3. Prisma ORM
- **Schema Definition**: Models, relations, enums
- **Type Safety**: Auto-generated TypeScript types
- **Migrations**: Database schema versioning
- **Client**: Singleton pattern for connection pooling

### 4. Authentication
- **JWT Tokens**: Stateless authentication
- **Password Hashing**: bcrypt for security
- **Protected Routes**: Middleware-based auth
- **Role-Based Access**: Admin, user roles

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Products
- `GET /api/products` - List products (pagination, filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (auth required)
- `PUT /api/products/:id` - Update product (auth required)
- `DELETE /api/products/:id` - Delete product (auth required)

## 🎤 Common Interview Questions

1. **What's the difference between Server and Client Components?**
   - Server: Render on server, can access backend directly
   - Client: Render on client, can use hooks and browser APIs
   - Server components are default in App Router

2. **How does the App Router differ from Pages Router?**
   - File-based routing with folders
   - Layouts and nested layouts
   - Server Components by default
   - Streaming and Suspense support

3. **How do you handle authentication in Next.js?**
   - JWT tokens in headers or cookies
   - Middleware for route protection
   - NextAuth.js for OAuth providers
   - Server-side session validation

4. **What is ISR (Incremental Static Regeneration)?**
   - Static pages that update after deployment
   - revalidate option in fetch or page config
   - Best of static and dynamic rendering

5. **How do you optimize Next.js performance?**
   - Image optimization with next/image
   - Code splitting (automatic)
   - Static generation where possible
   - Edge runtime for API routes
