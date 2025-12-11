/**
 * =============================================================================
 * DEBOUNCE HOOKS - Performance Optimization
 * =============================================================================
 * 
 * PURPOSE:
 * Provides debouncing functionality to delay execution of expensive operations
 * like API calls during rapid user input (typing in search fields).
 * 
 * WHAT IS DEBOUNCING?
 * Debouncing ensures a function is only called after a specified delay
 * since the last invocation. If called again before the delay, the timer resets.
 * 
 * VISUAL EXAMPLE:
 * 
 * User types: H-e-l-l-o (each letter triggers onChange)
 * 
 * Without debounce:
 * API calls: H → He → Hel → Hell → Hello (5 API calls!)
 * 
 * With 300ms debounce:
 * API calls: Hello (1 API call after user stops typing)
 * 
 * DEBOUNCE VS THROTTLE:
 * - Debounce: Waits for pause in events (search input)
 * - Throttle: Limits to X calls per time period (scroll events)
 * 
 * INTERVIEW TOPICS:
 * - Performance optimization techniques
 * - When to use debounce vs throttle
 * - Custom hooks patterns
 * - useEffect cleanup
 */

import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Purpose: Returns a debounced version of a value
 * 
 * How it works:
 * 1. Value changes trigger the effect
 * 2. Effect sets a timeout to update debounced value
 * 3. If value changes again before timeout, cleanup cancels it
 * 4. Only the final value (after delay) is returned
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {any} Debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 * 
 * // API call only triggers when debouncedSearch changes
 * useEffect(() => {
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebounce = (value, delay) => {
  // State to hold the debounced value
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    /**
     * SET TIMEOUT
     * 
     * Creates a timer that will update the debounced value
     * after the specified delay
     */
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    /**
     * CLEANUP FUNCTION
     * 
     * This runs when:
     * 1. Component unmounts
     * 2. Value or delay changes (before next effect)
     * 
     * Cancels the pending timeout, preventing the update
     * This is the key to debouncing - only the last timeout completes
     */
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-run effect when value or delay changes

  return debouncedValue;
};

/**
 * useDebounceCallback Hook
 * 
 * Purpose: Debounces a callback function execution
 * 
 * Use when you need to debounce a function call rather than a value
 * 
 * @param {Function} callback - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Array} deps - Dependencies that trigger the callback
 * 
 * @example
 * useDebounceCallback(() => {
 *   saveToServer(formData);
 * }, 1000, [formData]);
 */
export const useDebounceCallback = (callback, delay, deps) => {
  useEffect(() => {
    const handler = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
};

/**
 * =============================================================================
 * COMMON USE CASES
 * =============================================================================
 * 
 * 1. SEARCH INPUT:
 *    - Debounce search queries to reduce API calls
 *    - Typical delay: 300-500ms
 * 
 * 2. FORM AUTO-SAVE:
 *    - Save form data after user stops typing
 *    - Typical delay: 1000-2000ms
 * 
 * 3. WINDOW RESIZE:
 *    - Recalculate layout after resize stops
 *    - Typical delay: 100-200ms
 * 
 * 4. BUTTON CLICKS:
 *    - Prevent double-submit on forms
 *    - Typical delay: 300ms
 * 
 * =============================================================================
 * INTERVIEW QUESTIONS
 * =============================================================================
 * 
 * Q: Implement debounce from scratch
 * A: 
 * function debounce(fn, delay) {
 *   let timeoutId;
 *   return function(...args) {
 *     clearTimeout(timeoutId);
 *     timeoutId = setTimeout(() => fn.apply(this, args), delay);
 *   };
 * }
 * 
 * Q: When would you use throttle instead of debounce?
 * A: 
 * - Throttle: Scroll events, mouse move, game loops
 * - Debounce: Search input, form validation, resize
 * 
 * Q: What's the cleanup function in useEffect for?
 * A:
 * - Prevents memory leaks
 * - Cancels pending operations
 * - Runs before next effect and on unmount
 */