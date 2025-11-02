'use client';

import { useState } from 'react';
import Image from 'next/image';
import Modal from '@/components/ui/Modal';

interface AwardPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  studentAvatar: string;
}

interface Skill {
  name: string;
  points: number;
  icon: React.ReactNode;
}

export default function AwardPointsModal({
  isOpen,
  onClose,
  studentName,
  studentAvatar,
}: AwardPointsModalProps) {
  const [activeTab, setActiveTab] = useState<'positive' | 'negative' | 'custom'>('positive');
  const [customPoints, setCustomPoints] = useState<number>(0);
  const [customMemo, setCustomMemo] = useState<string>('');

  // Icons for positive skills
  const positiveSkills: Skill[] = [
    {
      name: 'Helping others',
      points: 5,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      ),
    },
    {
      name: 'On task',
      points: 4,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
        </svg>
      ),
    },
    {
      name: 'Participating',
      points: 3,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 21c0 .5.4 1 1 1h4c.6 0 1-.5 1-1v-1H9v1zm3-19C8.1 2 5 5.1 5 9c0 2.4 1.2 4.5 3 5.7V17c0 .5.4 1 1 1h6c.6 0 1-.5 1-1v-2.3c1.8-1.3 3-3.4 3-5.7 0-3.9-3.1-7-7-7z"/>
        </svg>
      ),
    },
    {
      name: 'Persistence',
      points: 2,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
        </svg>
      ),
    },
    {
      name: 'Teamwork',
      points: 1,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      ),
    },
    {
      name: 'Working hard',
      points: 1,
      icon: (
        <svg className="w-10 h-10" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      ),
    },
  ];

  // Icons for negative skills (Needs work)
  const negativeSkills: Skill[] = [
    {
      name: 'Disruptive',
      points: -2,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      ),
    },
    {
      name: 'Off task',
      points: -3,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
        </svg>
      ),
    },
    {
      name: 'Not listening',
      points: -2,
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
        </svg>
      ),
    },
  ];

  const handleCustomSubmit = () => {
    // Handle custom points submission
    console.log('Custom points:', customPoints, 'Memo:', customMemo);
    // Add your submission logic here
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="relative">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          {/* Student Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Image
                src={studentAvatar}
                alt={studentName}
                width={48}
                height={48}
                className="rounded-full"
              />
              {/* Crown icon overlay */}
              <div className="absolute -top-1 -right-1">
                <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L8.5 8.5 2 9.5l5 5-1 7 6-3.5 6 3.5-1-7 5-5-6.5-1L12 2z"/>
                </svg>
              </div>
            </div>
            <span className="text-lg font-bold text-gray-900 lowercase">{studentName}</span>
            
            {/* Point Totals */}
            <div className="flex items-center gap-2 ml-4">
              <span className="px-3 py-1 bg-gray-100 border border-gray-300 rounded-full text-sm text-gray-700">
                (0) Points
              </span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                (89) CLASS
              </span>
              <span className="px-3 py-1 bg-yellow-400 text-white rounded-full text-sm font-medium">
                (100) Grade
              </span>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('positive')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'positive'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Positive
            {activeTab === 'positive' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('negative')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'negative'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Needs work
            {activeTab === 'negative' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-3 font-medium text-sm transition-colors relative ${
              activeTab === 'custom'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Custom Points
            {activeTab === 'custom' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"></span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
          {/* Positive Tab */}
          {activeTab === 'positive' && (
            <div className="grid grid-cols-3 gap-4">
              {positiveSkills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3" style={{ color: getSkillColor(skill.name) }}>
                      {skill.icon}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{skill.name}</h3>
                    <span className="text-xs font-medium text-gray-700 absolute top-2 right-3">
                      +{skill.points}
                    </span>
                  </div>
                </div>
              ))}
              {/* Add Skills Card */}
              <div className="bg-white rounded-lg border-2 border-purple-500 border-dashed p-4 hover:border-purple-600 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]">
                <div className="text-purple-500 mb-2">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-purple-600">Add skills</span>
              </div>
            </div>
          )}

          {/* Negative Tab (Needs work) */}
          {activeTab === 'negative' && (
            <div className="grid grid-cols-3 gap-4">
              {negativeSkills.map((skill, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer relative"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 text-red-500">
                      {skill.icon}
                    </div>
                    <h3 className="text-sm font-medium text-gray-900">{skill.name}</h3>
                    <span className="text-xs font-medium text-gray-700 absolute top-2 right-3">
                      {skill.points}
                    </span>
                  </div>
                </div>
              ))}
              {/* Add Skills Card */}
              <div className="bg-white rounded-lg border-2 border-purple-500 border-dashed p-4 hover:border-purple-600 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[120px]">
                <div className="text-purple-500 mb-2">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-purple-600">Add skills</span>
              </div>
            </div>
          )}

          {/* Custom Points Tab */}
          {activeTab === 'custom' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Point Value
                </label>
                <input
                  type="number"
                  value={customPoints || ''}
                  onChange={(e) => setCustomPoints(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter point value"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Memo (optional)
                </label>
                <textarea
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y"
                  placeholder="Add a note about these points..."
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleCustomSubmit}
                  className="px-6 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
                >
                  Submit Points
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Helper function to get skill icon colors
function getSkillColor(skillName: string): string {
  const colorMap: Record<string, string> = {
    'Helping others': '#EF4444', // red
    'On task': '#10B981', // green
    'Participating': '#FBBF24', // yellow
    'Persistence': '#F97316', // orange
    'Teamwork': '#3B82F6', // blue (multi-color represented)
    'Working hard': '#F59E0B', // amber/gold
  };
  return colorMap[skillName] || '#6B7280';
}
