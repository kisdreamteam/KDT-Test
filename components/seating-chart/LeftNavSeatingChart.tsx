'use client';

import { useState, useEffect } from 'react';
import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';

interface LeftNavSeatingChartProps {
  classId: string;
}

export default function LeftNavSeatingChart({ classId }: LeftNavSeatingChartProps) {
  const { unseatedStudents, setUnseatedStudents, setSelectedStudentForGroup } = useSeatingChart();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch students for this class
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setIsLoading(true);
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('class_id', classId)
          .order('student_number', { ascending: true });

        if (error) {
          console.error('Error fetching students:', error);
          return;
        }

        if (data) {
          // For now, all students are unseated (we'll filter by actual seating later)
          setUnseatedStudents(data as Student[]);
        }
      } catch (err) {
        console.error('Unexpected error fetching students:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (classId) {
      fetchStudents();
    }
  }, [classId, setUnseatedStudents]);

  const handleStudentClick = (student: Student) => {
    setSelectedStudentForGroup(student);
    // Dispatch event to indicate a student is ready to be added to a group
    window.dispatchEvent(new CustomEvent('studentSelectedForGroup', { 
      detail: { student } 
    }));
  };

  return (
    <div className="p-4 flex flex-col h-full max-h-screen overflow-y-auto bg-[#dd7f81] font-spartan text-[#4A3B8D]">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Unseated Students</h2>
        <p className="text-sm ">
          Click a student to add them to a group
        </p>
      </div>

      {/* Students List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            <span className="ml-2 text-sm">Loading students...</span>
          </div>
        ) : unseatedStudents.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm">All students are seated</p>
          </div>
        ) : (
          unseatedStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => handleStudentClick(student)}
              className="flex items-center p-3 hover:bg-blue-300 rounded-lg cursor-pointer transition-colors bg-blue-100 border border-gray-200"
            >
              {/* Student Name with Number */}
              <div className="flex-1 min-w-0">
                <span className="text-base font-medium text-[#4A3B8D] block truncate font-spartan">
                  {student.student_number ? `${student.student_number}. ` : ''}{student.first_name}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/30">
        <div className="text-center">
          <p className="text-sm text-white/90">
            {unseatedStudents.length} unseated
          </p>
        </div>
      </div>
    </div>
  );
}

