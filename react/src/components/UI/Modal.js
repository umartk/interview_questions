import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContainer = styled(motion.div)`
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  max-width: ${props => props.maxWidth || '500px'};
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: ${props => props.theme.colors.gray[800]};
  font-size: 1.25rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: ${props => props.theme.colors.gray[500]};
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  
  &:hover {
    background-color: ${props => props.theme.colors.gray[100]};
    color: ${props => props.theme.colors.gray[700]};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${props => props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.variant === 'primary' ? props.theme.colors.primary : 'white'};
  color: ${props => props.variant === 'primary' ? 'white' : props.theme.colors.gray[700]};
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  
  &:hover {
    opacity: 0.9;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth,
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleOverlayClick}
        >
          <ModalContainer
            maxWidth={maxWidth}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {title && (
              <ModalHeader>
                <ModalTitle>{title}</ModalTitle>
                {showCloseButton && (
                  <CloseButton onClick={onClose}>
                    ×
                  </CloseButton>
                )}
              </ModalHeader>
            )}
            
            <ModalBody>
              {children}
            </ModalBody>
            
            {footer && (
              <ModalFooter>
                {footer}
              </ModalFooter>
            )}
          </ModalContainer>
        </Overlay>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

// Convenience components for common modal patterns
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false 
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Loading...' : confirmText}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  );
};

export const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  title,
  children,
  submitText = 'Save',
  cancelText = 'Cancel',
  loading = false 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
    >
      <form onSubmit={handleSubmit}>
        {children}
        <ModalFooter>
          <Button type="button" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={loading}
          >
            {loading ? 'Loading...' : submitText}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default Modal;