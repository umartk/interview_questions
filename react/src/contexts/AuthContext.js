/**
 * =============================================================================
 * AUTHENTICATION CONTEXT - Global Auth State Management
 * =============================================================================
 * 
 * PURPOSE:
 * Provides global authentication state and methods using React Context API
 * with useReducer for complex state management.
 * 
 * WHY CONTEXT + USEREDUCER?
 * - Context: Makes auth state available throughout the app
 * - useReducer: Better for complex state with multiple actions
 * - Predictable state updates through actions
 * - Easy to test and debug
 * 
 * PATTERN: Flux/Redux-like state management
 * 
 *   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 *   │   Action    │ --> │   Reducer   │ --> │    State    │
 *   │  dispatch() │     │  (pure fn)  │     │  (updated)  │
 *   └─────────────┘     └─────────────┘     └─────────────┘
 * 
 * INTERVIEW TOPICS:
 * - Context API vs Redux
 * - useReducer vs useState
 * - Authentication patterns in React
 * - Token storage strategies
 */

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Create context with undefined default (will be provided by Provider)
const AuthContext = createContext();

/**
 * AUTH REDUCER
 * 
 * Purpose: Pure function that handles all auth state transitions
 * 
 * Why a reducer?
 * - Centralizes all state update logic
 * - Makes state changes predictable
 * - Easy to add new actions
 * - Great for debugging (can log all actions)
 * 
 * @param {Object} state - Current state
 * @param {Object} action - Action with type and payload
 * @returns {Object} New state
 */
const authReducer = (state, action) => {
  switch (action.type) {
    /**
     * LOGIN_START
     * Triggered when login request begins
     * Sets loading state, clears previous errors
     */
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      };
  
  
    /**
     * LOGIN_SUCCESS
     * Triggered when login succeeds
     * Stores user data and token, clears loading/error
     */
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    
    /**
     * LOGIN_FAILURE
     * Triggered when login fails
     * Clears auth state, stores error message
     */
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    
    /**
     * LOGOUT
     * Clears all auth state
     */
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    
    /**
     * UPDATE_USER
     * Updates user data without affecting auth state
     */
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

/**
 * INITIAL STATE
 * 
 * Starting state for auth context
 * User starts as not authenticated
 */
const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null
};

/**
 * AUTH PROVIDER COMPONENT
 * 
 * Purpose: Wraps app and provides auth state/methods to all children
 * 
 * Features:
 * - Persists auth state to localStorage
 * - Restores auth state on app load
 * - Provides login, logout, register methods
 * - Role-based access control helpers
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [storedAuth, setStoredAuth] = useLocalStorage('auth', null);

  /**
   * RESTORE AUTH STATE ON MOUNT
   * 
   * Checks localStorage for existing auth data
   * Automatically logs user in if valid token exists
   */
  useEffect(() => {
    if (storedAuth && storedAuth.token) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: storedAuth
      });
    }
  }, [storedAuth]);

  /**
   * PERSIST AUTH STATE CHANGES
   * 
   * Syncs auth state to localStorage whenever it changes
   * Enables persistence across page refreshes
   */
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      setStoredAuth({
        user: state.user,
        token: state.token
      });
    } else {
      setStoredAuth(null);
    }
  }, [state.isAuthenticated, state.user, state.token, setStoredAuth]);

  /**
   * LOGIN FUNCTION
   * 
   * Handles user login with email/password
   * 
   * @param {Object} credentials - { email, password }
   * @returns {Object} { success: boolean, error?: string }
   */
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user, token: data.token }
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * REGISTER FUNCTION
   * 
   * Handles new user registration
   * Automatically logs in user after successful registration
   */
  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user: data.user, token: data.token }
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  /**
   * LOGOUT FUNCTION
   * 
   * Clears auth state and removes stored credentials
   */
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  /**
   * UPDATE USER FUNCTION
   * 
   * Updates user profile data without re-authentication
   */
  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  /**
   * ROLE CHECK HELPER
   * 
   * Checks if current user has required role
   * Admin role has access to everything
   * 
   * @param {string} requiredRole - Role to check for
   * @returns {boolean} Whether user has role
   */
  const hasRole = (requiredRole) => {
    if (!state.user) return false;
    if (!requiredRole) return true;
    return state.user.role === requiredRole || state.user.role === 'admin';
  };

  /**
   * PERMISSION CHECK HELPER
   * 
   * Checks if user has specific permission
   * Useful for fine-grained access control
   */
  const hasPermission = (permission) => {
    if (!state.user) return false;
    return state.user.permissions?.includes(permission) || state.user.role === 'admin';
  };

  // Combine state and methods into context value
  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    hasRole,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * CUSTOM HOOK: useAuth
 * 
 * Purpose: Provides easy access to auth context
 * 
 * Usage:
 * const { user, login, logout, isAuthenticated } = useAuth();
 * 
 * @returns {Object} Auth context value
 * @throws {Error} If used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};