import Image from 'next/image';

// Hardcoded student data
const students = [
  { id: '1', firstName: 'John', lastName: 'Doe', points: 15 },
  { id: '2', firstName: 'Jane', lastName: 'Smith', points: 20 },
  { id: '3', firstName: 'Peter', lastName: 'Jones', points: 10 }
];

export default function ClassRosterPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Class Roster</h1>
          <p className="text-gray-600">View and manage student information</p>
        </div>

        {/* Student Cards Grid */}
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
                  alt={`${student.firstName} ${student.lastName} avatar`}
                  width={60}
                  height={60}
                  className="rounded-full"
                />
              </div>

              {/* Student Name */}
              <div className="text-center mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {student.firstName} {student.lastName}
                </h3>
              </div>

              {/* Student Points */}
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  <span className="mr-1">⭐</span>
                  {student.points} points
                </div>
              </div>
            </div>
          ))}
        </div>

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

