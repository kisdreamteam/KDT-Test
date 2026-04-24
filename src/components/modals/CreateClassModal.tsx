'use client';

import Modal from '@/components/modals/Modal';
import CreateClassForm from '@/components/forms/CreateClassForm';

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateClassModal({ isOpen, onClose }: CreateClassModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CreateClassForm onClose={onClose} />
    </Modal>
  );
}

