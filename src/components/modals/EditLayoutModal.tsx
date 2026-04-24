'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/modals/Modal';

interface EditLayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  onSave: (newName: string) => void | Promise<void>;
}

export default function EditLayoutModal({
  isOpen,
  onClose,
  currentName,
  onSave,
}: EditLayoutModalProps) {
  const [layoutName, setLayoutName] = useState(currentName);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLayoutName(currentName);
      setIsLoading(false);
    }
  }, [isOpen, currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = layoutName.trim();

    if (!trimmedName) {
      alert('Please enter a layout name.');
      return;
    }

    if (trimmedName === currentName) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await onSave(trimmedName);
      onClose();
    } catch (err) {
      console.error('Error saving layout name:', err);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setLayoutName(currentName);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Edit Layout Name
          </h2>
          <p className="text-gray-600">
            Current name: <span className="font-medium text-gray-800">{currentName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New layout name
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => setLayoutName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Math Groups"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!layoutName.trim() || isLoading}
              className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
