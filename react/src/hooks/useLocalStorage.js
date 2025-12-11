/**
 * =============================================================================
 * LOCAL STORAGE HOOK - Persistent State Management
 * =============================================================================
 * 
 * PURPOSE:
 * Provides a useState-like hook that automatically persists state to
 * localStorage and syncs across browser tabs.
 * 
 * WHY USE THIS HOOK?
 * - Persist user preferences (theme, language)
 * - Store auth tokens
 * - Cache form data
 * - Remember UI state (sidebar collapsed, etc.)
 * 
 * FEATURES:
 * - Same API as useState
 * - Automatic JSON serialization/deserialization
 * - Cross-tab synchronization
 * - Error handling for storage failures
 * 
 * INTERVIEW TOPICS:
 * - localStorage vs sessionStorage vs cookies
 * - Custom hooks patterns
 * - Storage event for cross-tab sync
 * - Error handling in hooks
 */

import { useState, useEffect } from 'react';

/**
 * useLocalStorage Hook
 * 
 * Purpose: Syncs React state with localStorage
 * 
 * @param {string} key - localStorage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @returns {[any, Function]} [storedValue, setValue] - Like useState
 * 
 * @example
 * const [theme, setTheme] = useLocalStorage('theme', 'light');
 * const [user, setUser] = useLocalStorage('user', null);
 */
export const useLocalStorage = (key, initialValue) => {
  /**
   * LAZY INITIALIZATION
   * 
   * useState accepts a function for lazy initialization
   * This function only runs on first render, not on every render
   * 
   * Why lazy init?
   * - localStorage.getItem is synchronous and can be slow
   * - JSON.parse can be expensive for large objects
   * - Only need to read from storage once on mount
   */
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from localStorage
      const item = window.localStorage.getItem(key);
      
      // Parse stored JSON or return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      /**
       * ERROR HANDLING
       * 
       * Errors can occur if:
       * - localStorage is disabled (private browsing)
       * - Storage quota exceeded
       * - Invalid JSON stored
       */
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  /*
*
   * SET VALUE FUNCTION
   * 
   * Wrapper around setStoredValue that also updates localStorage
   * 
   * Supports both direct values and updater functions:
   * - setValue('new value')
   * - setValue(prev => prev + 1)
   * 
   * @param {any|Function} value - New value or updater function
   */
  const setValue = (value) => {
    try {
      /**
       * SUPPORT UPDATER FUNCTION
       * 
       * Like useState, we support passing a function
       * that receives the previous value
       */
      const valueToStore = value instanceof Function 
        ? value(storedValue) 
        : value;
      
      // Update React state
      setStoredValue(valueToStore);
      
      // Update localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  /**
   * CROSS-TAB SYNCHRONIZATION
   * 
   * Listens for storage events from other tabs/windows
   * Updates local state when another tab changes the value
   * 
   * Use case: User logs out in one tab, all tabs should update
   * 
   * Note: storage event only fires in OTHER tabs, not the current one
   */
  useEffect(() => {
    const handleStorageChange = (e) => {
      // Only handle changes to our key
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    // Add event listener
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup on unmount
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
};

/**
 * =============================================================================
 * STORAGE COMPARISON (Interview Topic)
 * =============================================================================
 * 
 * localStorage:
 * - Persists until explicitly cleared
 * - ~5MB storage limit
 * - Synchronous API
 * - Same-origin only
 * - Good for: User preferences, cached data
 * 
 * sessionStorage:
 * - Cleared when tab closes
 * - ~5MB storage limit
 * - Synchronous API
 * - Per-tab isolation
 * - Good for: Temporary form data, wizard state
 * 
 * Cookies:
 * - Can set expiration
 * - ~4KB limit
 * - Sent with every HTTP request
 * - Can be httpOnly (not accessible via JS)
 * - Good for: Auth tokens, server-side sessions
 * 
 * IndexedDB:
 * - Large storage (50MB+)
 * - Asynchronous API
 * - Supports complex queries
 * - Good for: Offline apps, large datasets
 * 
 * =============================================================================
 * SECURITY CONSIDERATIONS
 * =============================================================================
 * 
 * 1. DON'T store sensitive data in localStorage
 *    - Accessible via JavaScript (XSS vulnerability)
 *    - Use httpOnly cookies for auth tokens instead
 * 
 * 2. Validate data read from storage
 *    - Could be tampered with
 *    - Could be from old app version
 * 
 * 3. Handle storage quota exceeded
 *    - Gracefully degrade functionality
 *    - Clear old data if needed
 * 
 * =============================================================================
 * COMMON INTERVIEW QUESTIONS
 * =============================================================================
 * 
 * Q: Why use lazy initialization in useState?
 * A: Prevents expensive operations (localStorage read) on every render
 * 
 * Q: How do you sync state across browser tabs?
 * A: Listen for 'storage' event on window object
 * 
 * Q: What happens if localStorage is full?
 * A: QuotaExceededError is thrown, need try/catch
 * 
 * Q: Is localStorage synchronous or asynchronous?
 * A: Synchronous, which can block the main thread for large data
 */