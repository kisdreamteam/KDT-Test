'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/modals/Modal';

interface AddGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (groupName: string, columns: number) => void;
}

export default function AddGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
}: AddGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [columns, setColumns] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setGroupName('');
      setColumns(2);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = groupName.trim();
    
    if (!trimmedName) {
      alert('Please enter a group name.');
      return;
    }

    if (columns < 1 || columns > 3) {
      alert('Columns must be between 1 and 3.');
      return;
    }

    setIsLoading(true);
    try {
      await onCreateGroup(trimmedName, columns);
      // Modal will be closed by parent component after successful creation
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setGroupName('');
      setColumns(2);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Add New Group
          </h2>
          <p className="text-gray-600">
            Create a new seating group with a custom name and column layout.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Group 1, Reading Circle"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Columns
            </label>
            <div className="flex items-center gap-4">
              {[1, 2, 3].map((num) => (
                <label
                  key={num}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="columns"
                    value={num}
                    checked={columns === num}
                    onChange={() => setColumns(num)}
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 font-medium">{num}</span>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Select the number of columns for the grid layout
            </p>
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
              disabled={!groupName.trim() || isLoading}
              className="px-6 py-2 bg-purple-400 text-white rounded-lg font-medium hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

