'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  points: number;
  avatar?: string;
  student_number?: string;
}

export default function ClassRosterPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (classId) {
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  const fetchStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const supabase = createClient();
      
      const { data: students, error: fetchError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          points,
          avatar,
          student_number
        `)
        .eq('class_id', classId)
        .order('last_name', { ascending: true });

      if (fetchError) {
        console.error('Error fetching students:', fetchError?.message || fetchError);
        setError('Failed to load students. Please try again.');
        return;
      }

      // Update state with the students data
      if (students) {
        setStudents(students);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Unexpected error fetching students:', err instanceof Error ? err.message : err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading students...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchStudents}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Roster</h1>
          <p className="text-gray-600">View and manage student information</p>
        </div>

        {/* Student Cards Grid */}
        {students.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg className="w-24 h-24 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No students yet</h2>
            <p className="text-gray-600 mb-8">Students will appear here once they are added to this class.</p>
            {/* Add New Student Button for Empty State */}
            <div 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer transform hover:scale-105"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="flex items-center space-x-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Your First Student</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {students.map((student) => (
              <div
                key={student.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Student Avatar */}
                <div className="flex justify-center mb-4">
                  <Image
                    src="/images/students/avatars/student_avatar_1.png"
                    alt={`${student.first_name} ${student.last_name} avatar`}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                </div>

                {/* Student Name */}
                <div className="text-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {student.first_name} {student.last_name}
                  </h3>
                </div>

                {/* Student Points */}
                <div className="text-center">
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                    <span className="mr-1">⭐</span>
                    {student.points || 0} points
                  </div>
                </div>
              </div>
            ))}

            {/* Add New Student Card */}
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
                  Add New Student
                </h3>

                {/* Placeholder Text */}
                <p className="text-sm text-gray-600 text-center">
                  Add another student
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="text-center text-gray-500">
            <p>Footer Section</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
