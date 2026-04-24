// modal wrapper for all modals (custom modal component)
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fixedTop?: boolean; // New prop for fixed top positioning
}

export default function Modal({ isOpen, onClose, children, className = '', fixedTop = false }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[9999] ${fixedTop ? 'flex items-start justify-center pt-8 sm:pt-12 md:pt-16' : 'flex items-center justify-center'}`}>
      {/* Semi-transparent background overlay */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal content */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full mx-4 ${fixedTop ? 'max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-8rem)]' : 'max-h-[90vh]'} overflow-y-auto ${className || 'max-w-md'}`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-9 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        
        {/* Modal content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

