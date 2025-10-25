'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import Modal from '../../components/ui/Modal';
import CreateClassForm from '../../components/forms/CreateClassForm';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const classes = [
    {
      id: 'fake-id-1',
      name: '4-5 Homeroom',
      studentCount: 36,
      icon: '🏠',
    },
    {
      id: 'fake-id-2',
      name: '4-5 Math',
      studentCount: 36,
      icon: '📚',
    },
    {
      id: 'fake-id-3',
      name: 'LBE_GameDay',
      studentCount: 36,
      icon: '🎮',
    },
    {
      id: 'fake-id-4',
      name: 'Grade 4 - LBE',
      studentCount: 29,
      icon: '📖',
    },
    {
      id: 'fake-id-5',
      name: 'Grade 1 - LBE',
      studentCount: 26,
      icon: '⭐',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Class Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Regular Class Cards */}
        {classes.map((cls, index) => (
          <Link
            key={cls.id}
            href={`/dashboard/classes/${cls.id}`}
            className="block"
          >
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer relative group">
              {/* Settings Icon */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* Class Icon */}
              <div className="text-center mb-4">
                <Image
                  src="/images/1Landing Page Image.png"
                  alt={`${cls.name} icon`}
                  width={80}
                  height={80}
                  className="mx-auto mb-2"
                />
              </div>

              {/* Class Name */}
              <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
                {cls.name}
              </h3>

              {/* Student Count */}
              <p className="text-sm text-gray-600 text-center">
                {cls.studentCount} Students
              </p>
            </div>
          </Link>
        ))}

        {/* Add New Class Card */}
        <div 
          className="bg-blue-100 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="text-center">
            {/* Add Icon */}
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white text-2xl font-bold">+</span>
              </div>
            </div>

            {/* Add Text */}
            <h3 className="text-lg font-semibold text-gray-800 text-center mb-2">
              Add New Class
            </h3>

            {/* Placeholder Student Count */}
            <p className="text-sm text-gray-600 text-center">
              36 Students
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <CreateClassForm onClose={() => setIsModalOpen(false)} />
      </Modal>
    </div>
  );
}
