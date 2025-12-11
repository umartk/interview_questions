# React Advanced Components

## 🎯 Purpose
This project demonstrates advanced React patterns and concepts essential for senior frontend developer interviews. It covers state management, custom hooks, performance optimization, and component architecture.

## 📁 Project Structure

```
react/
├── src/
│   ├── App.js              # Main app with routing and providers
│   ├── components/
│   │   ├── UI/
│   │   │   ├── DataTable.js    # Advanced table with sorting/pagination
│   │   │   └── Modal.js        # Reusable modal with animations
│   │   └── Forms/
│   │       └── ProductForm.js  # Form with validation (react-hook-form)
│   ├── contexts/
│   │   ├── AuthContext.js      # Authentication state management
│   │   └── NotificationContext.js # Toast notifications
│   └── hooks/
│       ├── useApi.js           # API calls with React Query
│       ├── useDebounce.js      # Debounce hook for search
│       └── useLocalStorage.js  # Persistent state hook
└── package.json
```

## 🔑 Key Concepts Covered

### 1. Custom Hooks
- **useApi**: Encapsulates API logic with React Query
- **useDebounce**: Delays value updates for search optimization
- **useLocalStorage**: Syncs state with localStorage

### 2. Context API & State Management
- **AuthContext**: Global authentication state with useReducer
- **NotificationContext**: Toast notification system
- **Interview Tip**: When to use Context vs Redux vs React Query

### 3. Performance Optimization
- **React Query**: Server state caching and synchronization
- **Memoization**: useMemo, useCallback, React.memo
- **Code Splitting**: Lazy loading with React.lazy

### 4. Component Patterns
- **Compound Components**: Related components that work together
- **Render Props**: Sharing logic between components
- **Higher-Order Components**: Component enhancement pattern

### 5. Form Handling
- **React Hook Form**: Performant form validation
- **Controlled vs Uncontrolled**: When to use each
- **Field Arrays**: Dynamic form fields

## 🚀 Getting Started

```bash
npm install
npm start     # Development server
npm run build # Production build
npm test      # Run tests
```

## 🎤 Common Interview Questions

1. **What's the difference between useMemo and useCallback?**
   - useMemo: Memoizes a computed value
   - useCallback: Memoizes a function reference
   - Both prevent unnecessary recalculations/re-renders

2. **When would you use useReducer over useState?**
   - Complex state logic with multiple sub-values
   - Next state depends on previous state
   - State updates from multiple event handlers

3. **How do you prevent unnecessary re-renders?**
   - React.memo for component memoization
   - useMemo/useCallback for values/functions
   - Proper key usage in lists
   - State colocation (keep state close to where it's used)

4. **Explain the React component lifecycle with hooks**
   - Mount: useEffect with empty deps []
   - Update: useEffect with deps [value]
   - Unmount: useEffect cleanup function

5. **What's the difference between Context and Redux?**
   - Context: Built-in, simpler, good for low-frequency updates
   - Redux: External, more features, better for complex state
   - Consider React Query for server state

## 📊 Component Examples

### Custom Hook Usage
```javascript
// Debounced search
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

useEffect(() => {
  fetchResults(debouncedSearch);
}, [debouncedSearch]);
```

### Context with useReducer
```javascript
const [state, dispatch] = useReducer(authReducer, initialState);

const login = async (credentials) => {
  dispatch({ type: 'LOGIN_START' });
  try {
    const data = await api.login(credentials);
    dispatch({ type: 'LOGIN_SUCCESS', payload: data });
  } catch (error) {
    dispatch({ type: 'LOGIN_FAILURE', payload: error });
  }
};
```
