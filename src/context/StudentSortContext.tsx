'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

const STORAGE_KEY = 'studentSortOrder';

export function StudentSortProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default to 'number'
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['number', 'alphabetical', 'points'].includes(stored)) {
        return stored as SortOption;
      }
    }
    return 'number';
  });

  // Persist to localStorage whenever sortBy changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, sortBy);
    }
  }, [sortBy]);

  return (
    <StudentSortContext.Provider value={{ sortBy, setSortBy }}>
      {children}
    </StudentSortContext.Provider>
  );
}

