'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type SortOption = 'number' | 'alphabetical' | 'points';

interface StudentSortContextType {
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
}

const StudentSortContext = createContext<StudentSortContextType | undefined>(undefined);

export function useStudentSort() {
  const context = useContext(StudentSortContext);
  if (!context) {
    throw new Error('useStudentSort must be used within a StudentSortProvider');
  }
  return context;
}

export function StudentSortProvider({ children }: { children: ReactNode }) {
  const [sortBy, setSortBy] = useState<SortOption>('number'); // Default to 'number'

  return (
    <StudentSortContext.Provider value={{ sortBy, setSortBy }}>
      {children}
    </StudentSortContext.Provider>
  );
}

