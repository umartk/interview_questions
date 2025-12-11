/**
 * =============================================================================
 * USER REGISTRATION API ROUTE - Next.js App Router
 * =============================================================================
 * 
 * PURPOSE:
 * Handles new user registration with:
 * - Input validation using Zod
 * - Password hashing with bcrypt
 * - JWT token generation
 * - Prisma database operations
 * 
 * ROUTE: POST /api/auth/register
 * 
 * REQUEST BODY:
 * {
 *   "name": "John Doe",
 *   "email": "john@example.com",
 *   "password": "securepassword"
 * }
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "data": {
 *     "user": { id, name, email, role, createdAt },
 *     "token": "jwt-token-here"
 *   }
 * }
 * 
 * INTERVIEW TOPICS:
 * - Next.js App Router API routes
 * - Zod schema validation
 * - Password security best practices
 * - JWT token generation
 */

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'

/**
 * ZOD VALIDATION SCHEMA
 * 
 * Purpose: Defines and validates request body structure
 * 
 * Why Zod?
 * - TypeScript-first schema validation
 * - Automatic type inference
 * - Detailed error messages
 * - Composable schemas
 */
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 
* POST HANDLER - User Registration
 * 
 * Next.js App Router uses named exports for HTTP methods:
 * - export async function GET() - Handle GET requests
 * - export async function POST() - Handle POST requests
 * - export async function PUT() - Handle PUT requests
 * - export async function DELETE() - Handle DELETE requests
 * 
 * @param {NextRequest} request - Incoming request object
 * @returns {NextResponse} JSON response
 */
export async function POST(request: NextRequest) {
  try {
    // Parse JSON body from request
    const body = await request.json()
    
    /**
     * VALIDATE INPUT WITH ZOD
     * 
     * parse() throws ZodError if validation fails
     * Returns typed data if validation passes
     */
    const validatedData = registerSchema.parse(body)
    const { name, email, password } = validatedData

    /**
     * CHECK FOR EXISTING USER
     * 
     * Prisma's findUnique is optimized for unique fields
     * Returns null if not found
     */
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 } // 409 Conflict
      )
    }

    /**
     * HASH PASSWORD
     * 
     * bcrypt.hash(password, saltRounds)
     * - 12 rounds is a good balance of security and speed
     * - Each round doubles the computation time
     * - Salt is automatically generated and stored in hash
     */
    const hashedPassword = await bcrypt.hash(password, 12)

    /**
     * CREATE USER IN DATABASE
     * 
     * Prisma's create() returns the created record
     * 'select' specifies which fields to return (excludes password)
     */
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // password is NOT selected for security
      }
    })

    /**
     * GENERATE JWT TOKEN
     * 
     * jwt.sign(payload, secret, options)
     * - payload: Data to encode (user info)
     * - secret: Server-side secret key
     * - expiresIn: Token expiration time
     */
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    /**
     * RETURN SUCCESS RESPONSE
     * 
     * NextResponse.json() creates a JSON response
     * Second argument is options (status, headers)
     */
    return NextResponse.json({
      success: true,
      data: { user, token }
    }, { status: 201 }) // 201 Created

  } catch (error) {
    /**
     * HANDLE VALIDATION ERRORS
     * 
     * Zod throws ZodError with detailed error information
     * Return 400 Bad Request with validation details
     */
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    // Log unexpected errors for debugging
    console.error('Registration error:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}