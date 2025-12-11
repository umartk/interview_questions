/**
 * =============================================================================
 * CUSTOM API HOOKS - React Query Integration
 * =============================================================================
 * 
 * PURPOSE:
 * Provides reusable hooks for API operations using React Query, including:
 * - Automatic caching and background refetching
 * - Loading and error states
 * - Optimistic updates
 * - Request deduplication
 * 
 * WHY REACT QUERY?
 * - Separates server state from client state
 * - Built-in caching reduces API calls
 * - Automatic background updates keep data fresh
 * - Handles loading/error states automatically
 * 
 * INTERVIEW TOPICS:
 * - Server state vs client state
 * - Caching strategies
 * - Optimistic updates
 * - Query invalidation
 */

import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * AXIOS INSTANCE
 * 
 * Creates a configured axios instance with:
 * - Base URL for all requests
 * - Default timeout
 * - Can add default headers
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

/**
 * CUSTOM HOOK: useApi
 * 
 * Purpose: Provides configured axios instance with auth interceptors
 * 
 * Interceptors:
 * - Request: Adds Authorization header with JWT token
 * - Response: Handles 401 errors (auto logout)
 * 
 * @returns {AxiosInstance} Configured axios instance
 */
export const useApi = () => {
  const { token, logout } = useAuth();
  const { showNotification } = useNotification();


  /**
   * REQUEST INTERCEPTOR
   * 
   * Purpose: Automatically adds auth token to all requests
   * 
   * How it works:
   * 1. Intercepts every outgoing request
   * 2. Adds Authorization header if token exists
   * 3. Passes modified config to axios
   */
  apiClient.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  /**
   * RESPONSE INTERCEPTOR
   * 
   * Purpose: Handles common error scenarios globally
   * 
   * Benefits:
   * - Centralized error handling
   * - Automatic logout on 401
   * - Consistent error notifications
   */
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout();
        showNotification('Session expired. Please login again.', 'error');
      } else if (error.response?.status >= 500) {
        showNotification('Server error. Please try again later.', 'error');
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
};

/**
 * =============================================================================
 * PRODUCTS API HOOKS
 * =============================================================================
 */

/**
 * useProducts - Fetch products list with filtering
 * 
 * @param {Object} filters - Query parameters (page, limit, category, etc.)
 * @returns {Object} React Query result (data, isLoading, error, etc.)
 * 
 * Features:
 * - keepPreviousData: Shows old data while fetching new (better UX)
 * - staleTime: Data considered fresh for 5 minutes (reduces refetches)
 */
export const useProducts = (filters = {}) => {
  const api = useApi();
  
  return useQuery(
    ['products', filters], // Query key - changes trigger refetch
    async () => {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/products?${params}`);
      return response.data;
    },
    {
      keepPreviousData: true, // Keep showing old data while fetching
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    }
  );
};

/**
 * useProduct - Fetch single product by ID
 * 
 * @param {string} productId - Product ID to fetch
 * @returns {Object} React Query result
 * 
 * Note: enabled option prevents query when productId is falsy
 */
export const useProduct = (productId) => {
  const api = useApi();
  
  return useQuery(
    ['product', productId],
    async () => {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    },
    {
      enabled: !!productId, // Only run query if productId exists
    }
  );
};

/**
 * useCreateProduct - Mutation hook for creating products
 * 
 * @returns {Object} Mutation object with mutate function
 * 
 * Features:
 * - onSuccess: Invalidates products cache (triggers refetch)
 * - onError: Shows error notification
 */
export const useCreateProduct = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation(
    async (productData) => {
      const response = await api.post('/products', productData);
      return response.data;
    },
    {
      onSuccess: () => {
        // Invalidate products cache to refetch fresh data
        queryClient.invalidateQueries(['products']);
        showNotification('Product created successfully!', 'success');
      },
      onError: (error) => {
        showNotification(
          error.response?.data?.message || 'Failed to create product',
          'error'
        );
      },
    }
  );
};

/**
 * useUpdateProduct - Mutation hook for updating products
 * 
 * Invalidates both the products list and the specific product cache
 */
export const useUpdateProduct = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation(
    async ({ id, ...productData }) => {
      const response = await api.put(`/products/${id}`, productData);
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries(['products']);
        queryClient.invalidateQueries(['product', variables.id]);
        showNotification('Product updated successfully!', 'success');
      },
      onError: (error) => {
        showNotification(
          error.response?.data?.message || 'Failed to update product',
          'error'
        );
      },
    }
  );
};

/**
 * useDeleteProduct - Mutation hook for deleting products
 */
export const useDeleteProduct = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation(
    async (productId) => {
      const response = await api.delete(`/products/${productId}`);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['products']);
        showNotification('Product deleted successfully!', 'success');
      },
      onError: (error) => {
        showNotification(
          error.response?.data?.message || 'Failed to delete product',
          'error'
        );
      },
    }
  );
};

/**
 * =============================================================================
 * USERS & ORDERS API HOOKS
 * =============================================================================
 */

export const useUsers = (filters = {}) => {
  const api = useApi();
  return useQuery(['users', filters], async () => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/users?${params}`);
    return response.data;
  }, { keepPreviousData: true });
};

export const useOrders = (filters = {}) => {
  const api = useApi();
  return useQuery(['orders', filters], async () => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/orders?${params}`);
    return response.data;
  }, { keepPreviousData: true });
};

export const useCreateOrder = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  return useMutation(
    async (orderData) => {
      const response = await api.post('/orders', orderData);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['orders']);
        showNotification('Order created successfully!', 'success');
      },
      onError: (error) => {
        showNotification(
          error.response?.data?.message || 'Failed to create order',
          'error'
        );
      },
    }
  );
};

/**
 * useAnalytics - Fetch analytics data
 * 
 * @param {string} type - Analytics type (revenue, users, orders)
 * @param {Object} params - Query parameters
 * 
 * Features:
 * - Shorter staleTime for more frequent updates
 * - refetchInterval for auto-refresh
 */
export const useAnalytics = (type, params = {}) => {
  const api = useApi();
  
  return useQuery(
    ['analytics', type, params],
    async () => {
      const queryParams = new URLSearchParams(params);
      const response = await api.get(`/analytics/${type}?${queryParams}`);
      return response.data;
    },
    {
      staleTime: 2 * 60 * 1000,      // 2 minutes
      refetchInterval: 5 * 60 * 1000, // Auto-refresh every 5 minutes
    }
  );
};