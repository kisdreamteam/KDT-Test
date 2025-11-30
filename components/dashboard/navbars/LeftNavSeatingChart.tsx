'use client';

import { useSeatingChart } from '@/context/SeatingChartContext';
import { Student } from '@/lib/types';

export default function LeftNavSeatingChart() {
  const { unseatedStudents, setSelectedStudentForGroup } = useSeatingChart();

  const handleStudentClick = (student: Student) => {
    setSelectedStudentForGroup(student);
    // Dispatch event to indicate a student is ready to be added to a group
    window.dispatchEvent(new CustomEvent('studentSelectedForGroup', { 
      detail: { student } 
    }));
  };

  return (
    <div className="p-4 flex flex-col h-full max-h-screen overflow-y-auto bg-[#dd7f81] font-spartan text-[#4A3B8D] border-r-0">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Unseated Students</h2>
        <p className="text-sm ">
          Click a student to add them to a group
        </p>
      </div>

      {/* Students List */}
      <div className="space-y-2 flex-1 overflow-y-auto">
        {unseatedStudents.length === 0 ? (
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

