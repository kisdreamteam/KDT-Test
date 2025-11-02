'use client';

import { createContext, useContext, ReactNode } from 'react';

// Define the shape of the Class object (based on our layout.tsx)
interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  is_archived: boolean;
  created_at: string;
}

// Define the shape of the TeacherProfile object
interface TeacherProfile {
  id: string;
  title: string;
  name: string;
  role: string;
}

// Define the shape of the data we're sharing
interface DashboardContextType {
  classes: Class[];
  isLoadingClasses: boolean;
  teacherProfile: TeacherProfile | null;
  isLoadingProfile: boolean;
  refreshClasses: () => void; // A function to refetch classes
}

// Create the context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Create a custom hook for easy access
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

// Export the provider
export const DashboardProvider = DashboardContext.Provider;

