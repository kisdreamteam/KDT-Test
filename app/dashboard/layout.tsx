'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const classes = [
    { name: '+ New Class', icon: '➕' },
    { name: '4-5 Homeroom', icon: '🏠' },
    { name: '4-5 Math', icon: '📚' },
    { name: '4-5 SD', icon: '🍄' },
    { name: 'Grade 4 - LBE', icon: '📖' },
    { name: 'Grade 1 - LBE', icon: '🍀' },
  ];

  return (
    <div className="flex h-screen bg-pink-50">
      {/* Left Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r-2 border-purple-800 flex flex-col`}>
        <div className="p-4 flex flex-col h-full">
          {/* Character Illustration */}
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="text-center">
              <Image
                src="/images/1Landing Page Image.png"
                alt="User Avatar"
                width={200}
                height={200}
                className="mx-auto mb-2"
              />
              <div className="text-sm text-gray-600 font-bold text-center">Korean International School</div>
            </div>
          </div>

          {/* All Classes Section */}
          <div className="bg-blue-900 text-white p-3 rounded-lg mb-4">
            <h2 className="text-center font-semibold">All Classes</h2>
          </div>

          {/* Classes List */}
          <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
            {classes.map((cls, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 hover:bg-purple-300 rounded cursor-pointer"
              >
                <span className="text-lg">{cls.icon}</span>
                <span className="text-sm font-medium">{cls.name}</span>
              </div>
            ))}
          </div>

          {/* User Section */}
          <div className="mt-auto">
            <div className="bg-pink-400 text-white p-3 rounded-lg mb-2">
              <div className="text-center font-semibold">Kieun</div>
            </div>
            <div className="text-center text-sm text-gray-600">
              21 teachers
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white h-20 py-4 flex items-center justify-between px-4">
          {/* Hamburger Menu */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 text-2xl hover:text-gray-800"
          >
            ☰
          </button>

          {/* KIS Points Logo */}
          <div className="flex items-center">
            <Image
              src="/images/1Landing Page Image.png"
              alt="KIS Points"
              width={120}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-pink-50 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
