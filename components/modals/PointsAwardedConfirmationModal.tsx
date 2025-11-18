'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';

interface PointsAwardedConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentAvatar: string;
  studentFirstName: string;
  points: number;
  categoryName: string;
  categoryIcon?: string;
}

export default function PointsAwardedConfirmationModal({
  isOpen,
  onClose,
  studentAvatar,
  studentFirstName,
  points,
  categoryName,
  categoryIcon,
}: PointsAwardedConfirmationModalProps) {
  // Auto-dismiss after 0.5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1000); // 0.5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-180 max-h-50">
      <div className="flex flex-row bg-white rounded-2xl p-8 items-center justify-center gap-12 p-1 shadow-lg">
          {/* Student Avatar */}
          <div className="relative w-40">
            <Image
              src={studentAvatar || "/images/classes/avatars/avatar-01.png"}
              alt={`${studentFirstName} avatar`}
              width={120}
              height={120}
              className="rounded-lg object-cover"
              onError={(e) => {
                e.currentTarget.src = '/images/classes/avatars/avatar-01.png';
              }}
            />
          </div>

          <div className="flex flex-col gap-10 w-100 justify-center items-center">
            {/* Student First Name */}
            <h2 className="text-5xl font-bold text-gray-900">{studentFirstName}</h2>
            <div className="flex flex-row gap-2 items-center justify-center">
                {/* Points Awarded */}
                <div className="text-4xl font-bold text-red-600">
                {points > 0 ? '+' : ''}{points}
                </div>
                {/* Awarded For Section */}
                <span className="text-lg font-semibold text-gray-900"> awarded for</span>
                {/* Category Name */}
                <span className="text-lg font-semibold text-gray-900">{categoryName}</span>

                
            </div>
          </div>    
            
          <div className="flex items-center gap-3 w-40">
              {/* Category Icon */}
              {categoryIcon && (
                <div className="w-12 h-12 flex items-center justify-center">
                  <Image
                    src={categoryIcon}
                    alt={categoryName}
                    width={120}
                    height={120}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

          </div>
        </div>  
    </Modal>
  );
}

