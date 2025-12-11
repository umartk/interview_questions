import React, { createContext, useContext, useReducer } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationContext = createContext();

const notificationReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [...state.notifications, action.payload]
      };
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: []
      };
    default:
      return state;
  }
};

const NotificationContainer = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
`;

const NotificationItem = styled(motion.div)`
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 300px;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return `
          background: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        `;
      case 'error':
        return `
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        `;
      case 'warning':
        return `
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          color: #856404;
        `;
      case 'info':
      default:
        return `
          background: #d1ecf1;
          border: 1px solid #bee5eb;
          color: #0c5460;
        `;
    }
  }}
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const NotificationIcon = styled.span`
  font-size: 1.2rem;
`;

const NotificationMessage = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
  padding: 0;
  margin-left: 0.5rem;
  
  &:hover {
    opacity: 1;
  }
`;

const getIcon = (type) => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
    default:
      return 'ℹ';
  }
};

const NotificationDisplay = ({ notifications, removeNotification }) => {
  return (
    <NotificationContainer>
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            type={notification.type}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <NotificationContent>
              <NotificationIcon>
                {getIcon(notification.type)}
              </NotificationIcon>
              <NotificationMessage>
                {notification.message}
              </NotificationMessage>
            </NotificationContent>
            <CloseButton
              onClick={() => removeNotification(notification.id)}
            >
              ×
            </CloseButton>
          </NotificationItem>
        ))}
      </AnimatePresence>
    </NotificationContainer>
  );
};

export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: []
  });

  const showNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        id,
        message,
        type,
        timestamp: Date.now()
      }
    });

    // Auto-remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    dispatch({
      type: 'REMOVE_NOTIFICATION',
      payload: id
    });
  };

  const clearAllNotifications = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Convenience methods
  const showSuccess = (message, duration) => showNotification(message, 'success', duration);
  const showError = (message, duration) => showNotification(message, 'error', duration);
  const showWarning = (message, duration) => showNotification(message, 'warning', duration);
  const showInfo = (message, duration) => showNotification(message, 'info', duration);

  const value = {
    notifications: state.notifications,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationDisplay 
        notifications={state.notifications}
        removeNotification={removeNotification}
      />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};