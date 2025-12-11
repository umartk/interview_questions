/**
 * =============================================================================
 * AUTHENTICATION UTILITIES - Next.js
 * =============================================================================
 * 
 * PURPOSE:
 * Provides authentication utilities for Next.js API routes:
 * - JWT token verification
 * - Authentication middleware
 * - Role-based access control
 * 
 * USAGE:
 * 
 * // In API route
 * export async function GET(request: NextRequest) {
 *   const authResult = await verifyAuth(request);
 *   if (!authResult.success) {
 *     return NextResponse.json({ error: authResult.error }, { status: 401 });
 *   }
 *   // authResult.user contains decoded token data
 * }
 * 
 * INTERVIEW TOPICS:
 * - JWT verification process
 * - Middleware patterns in Next.js
 * - TypeScript interfaces for type safety
 */

import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

/**
 * AUTH USER INTERFACE
 * 
 * Defines the shape of decoded JWT payload
 * Used for type safety throughout the application
 */
export interface AuthUser {
  userId: string
  email: string
  role: string
}

/**
 * AUTH RESULT INTERFACE
 * 
 * Defines the return type of verifyAuth function
 * Uses discriminated union for type-safe error handling
 */
export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
}

/**
 * VERIFY AUTHENTICATION
 * 
 * Purpose: Extracts and verifies JWT token from request headers
 * 
 * Process:
 * 1. Extract Authorization header
 * 2. Parse Bearer token
 * 3. Verify token signature and expiration
 * 4. Return decoded user data or error
 * 
 * @param {NextRequest} request - Incoming Next.js request
 * @returns {Promise<AuthResult>} Authentication result
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('authorization')
    
    /**
     * CHECK FOR BEARER TOKEN
     * 
     * Expected format: "Bearer <token>"
     * If missing or wrong format, return error
     */
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'No token provided'
      }
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.substring(7)

    /**
     * VERIFY JWT SECRET EXISTS
     * 
     * JWT_SECRET must be set in environment variables
     * Throw error if missing (configuration issue)
     */
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured')
    }

    /**
     * VERIFY TOKEN
     * 
     * jwt.verify() does:
     * 1. Decodes the token
     * 2. Verifies signature using secret
     * 3. Checks expiration (exp claim)
     * 
     * Throws error if any check fails
     */
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as AuthUser
    
    return {
      success: true,
      user: decoded
    }

  } catch (error) {
    /**
     * HANDLE JWT ERRORS
     * 
     * JsonWebTokenError: Invalid token format or signature
     * TokenExpiredError: Token has expired
     */
    if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: 'Invalid token' }
    }

    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: 'Token expired' }
    }

    console.error('Auth verification error:', error)
    return { success: false, error: 'Authentication failed' }
  }
}

/**
 * REQUIRE AUTH HIGHER-ORDER FUNCTION
 * 
 * Purpose: Wraps route handlers to require authentication
 * 
 * Usage:
 * export const GET = requireAuth(async (request) => {
 *   // request.user is available here
 * });
 * 
 * @param {Function} handler - Route handler function
 * @returns {Function} Wrapped handler with auth check
 */
export function requireAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const authResult = await verifyAuth(request)
    
    if (!authResult.success) {
      return new Response(
        JSON.stringify({ error: authResult.error }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Attach user to request for handler access
    ;(request as any).user = authResult.user
    
    return handler(request, context)
  }
}

/**
 * REQUIRE ROLE HIGHER-ORDER FUNCTION
 * 
 * Purpose: Wraps route handlers to require specific roles
 * 
 * Usage:
 * export const DELETE = requireRole(['admin'])(async (request) => {
 *   // Only admins can access this
 * });
 * 
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} HOF that wraps handler
 */
export function requireRole(roles: string[]) {
  return function(handler: Function) {
    return async (request: NextRequest, context: any) => {
      const authResult = await verifyAuth(request)
      
      if (!authResult.success) {
        return new Response(
          JSON.stringify({ error: authResult.error }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }

      // Check if user has required role
      if (!roles.includes(authResult.user!.role)) {
        return new Response(
          JSON.stringify({ error: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      ;(request as any).user = authResult.user
      
      return handler(request, context)
    }
  }
}