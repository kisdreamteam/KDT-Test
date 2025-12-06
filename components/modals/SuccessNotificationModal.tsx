'use client';

import { useEffect } from 'react';
import Modal from './Modal';

interface SuccessNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  icon?: React.ReactNode;
  autoCloseDelay?: number; // in milliseconds, default 2000
  type?: 'success' | 'error' | 'info'; // default 'success'
}

export default function SuccessNotificationModal({
  isOpen,
  onClose,
  title,
  message,
  icon,
  autoCloseDelay = 2000,
  type = 'success',
}: SuccessNotificationModalProps) {
  const buttonColorClass = type === 'error' 
    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
    : type === 'info'
    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
  // Auto-dismiss after delay
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose, autoCloseDelay]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start space-x-4">
          {icon && (
            <div className="flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {message}
            </p>
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${buttonColorClass}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

