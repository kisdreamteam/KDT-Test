'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/client';
import type { Student } from '@/lib/types';

// Define the shape of the Class object (based on our layout.tsx)
interface Class {
  id: string;
  name: string;
  grade: string;
  school_year: string;
  teacher_id: string;
  is_archived: boolean;
  created_at: string;
  icon?: string;
  is_owner?: boolean;
}

// Define the shape of the TeacherProfile object
interface TeacherProfile {
  id: string;
  title: string;
  name: string;
  role: string;
  preferred_view?: 'seating' | 'students' | null;
}

type ViewPreference = 'seating' | 'students';

// Define the shape of the data we're sharing
interface DashboardContextType {
  classes: Class[];
  currentClass: Class | null;
  isLoadingClasses: boolean;
  teacherProfile: TeacherProfile | null;
  isLoadingProfile: boolean;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  isLoadingStudents: boolean;
  isLoading: boolean;
  refreshClasses: () => Promise<void>;
  refreshStudents: () => Promise<void>;
  viewMode: 'active' | 'archived';
  setViewMode: (mode: 'active' | 'archived') => void;
  viewPreference: ViewPreference;
  updateViewPreference: (newView: ViewPreference) => Promise<void>;
  activeSeatingLayoutId: string | null;
  setActiveSeatingLayoutId: (layoutId: string | null) => void;
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

// Dashboard-session cache: survives route remounts in the same client session.
let cachedTeacherProfile: TeacherProfile | null = null;
let cachedViewPreference: ViewPreference | null = null;
let teacherProfileFetchPromise: Promise<void> | null = null;
const studentsByClassCache = new Map<string, Student[]>();

function isMissingListAccessibleClassesRpc(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === 'PGRST202' ||
    error.code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('schema cache')
  );
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(() => cachedTeacherProfile);
  const [isLoadingProfile, setIsLoadingProfile] = useState(() => !cachedTeacherProfile);
  const [allClasses, setAllClasses] = useState<Class[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [viewPreference, setViewPreference] = useState<ViewPreference>(() => cachedViewPreference ?? 'students');
  const [activeSeatingLayoutId, setActiveSeatingLayoutId] = useState<string | null>(null);

  const currentClassId = useMemo(
    () => pathname?.match(/\/dashboard\/classes\/([^/]+)/)?.[1] ?? null,
    [pathname]
  );

  const fetchTeacherProfile = useCallback(async () => {
    if (cachedTeacherProfile) {
      setTeacherProfile(cachedTeacherProfile);
      if (cachedViewPreference) setViewPreference(cachedViewPreference);
      setIsLoadingProfile(false);
      return;
    }

    if (teacherProfileFetchPromise) {
      setIsLoadingProfile(true);
      await teacherProfileFetchPromise;
      setTeacherProfile(cachedTeacherProfile);
      if (cachedViewPreference) setViewPreference(cachedViewPreference);
      setIsLoadingProfile(false);
      return;
    }

    setIsLoadingProfile(true);
    teacherProfileFetchPromise = (async () => {
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;
      if (sessionError || !user) {
        if (sessionError) console.error('Session error:', sessionError);
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, title, name, role, preferred_view')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        if (error) console.error('Error fetching teacher profile:', error?.message || error);
        return;
      }

      const preferredView: ViewPreference =
        data.preferred_view === 'seating' || data.preferred_view === 'students'
          ? data.preferred_view
          : 'students';
      cachedViewPreference = preferredView;
      cachedTeacherProfile = { ...data, role: data.role || 'teacher' };
    })();

    try {
      await teacherProfileFetchPromise;
      setTeacherProfile(cachedTeacherProfile);
      if (cachedViewPreference) setViewPreference(cachedViewPreference);
    } finally {
      teacherProfileFetchPromise = null;
      setIsLoadingProfile(false);
    }
  }, [router]);

  const fetchClasses = useCallback(async () => {
    try {
      setIsLoadingClasses(true);
      const supabase = createClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const user = session?.user;
      if (sessionError || !user) {
        if (sessionError) console.error('Session error:', sessionError);
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase.rpc('list_accessible_classes');
      let rows: Class[] = [];
      if (error) {
        if (!isMissingListAccessibleClassesRpc(error)) {
          console.warn('list_accessible_classes failed, falling back:', error.message);
        }
        const { data: ownerRows, error: ownerError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id)
          .order('is_archived', { ascending: true })
          .order('created_at', { ascending: false });
        if (ownerError) {
          console.error('Error fetching classes (owner fallback):', ownerError?.message || ownerError);
          return;
        }
        rows = (ownerRows || []).map((r) => ({ ...r, is_owner: true }));
      } else {
        rows = (data || []) as Class[];
      }

      const sorted = [...rows].sort((a, b) => {
        if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setAllClasses(sorted);
    } catch (err) {
      console.error('Unexpected error fetching classes:', err);
    } finally {
      setIsLoadingClasses(false);
    }
  }, [router]);

  const fetchStudents = useCallback(async () => {
    if (!currentClassId) {
      setStudents([]);
      setIsLoadingStudents(false);
      return;
    }

    const cached = studentsByClassCache.get(currentClassId);
    if (cached) {
      setStudents(cached);
      setIsLoadingStudents(false);
      return;
    }

    try {
      setIsLoadingStudents(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          points,
          avatar,
          student_number,
          gender,
          class_id
        `)
        .eq('class_id', currentClassId)
        .order('last_name', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error?.message || error);
        setStudents([]);
        return;
      }
      const next = data || [];
      studentsByClassCache.set(currentClassId, next);
      setStudents(next);
    } catch (err) {
      console.error('Unexpected error fetching students:', err);
      setStudents([]);
    } finally {
      setIsLoadingStudents(false);
    }
  }, [currentClassId]);

  const updateViewPreference = useCallback(async (newView: ViewPreference) => {
    setViewPreference(newView);
    cachedViewPreference = newView;
    try {
      const supabase = createClient();
      const { data: authData, error: sessionError } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id ?? teacherProfile?.id;
      if (sessionError || !userId) {
        if (sessionError) console.error('Session error while updating preferred view:', sessionError);
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ preferred_view: newView })
        .eq('id', userId);
      if (error) console.error('Error updating preferred view:', error);
    } catch (err) {
      console.error('Unexpected error updating preferred view:', err);
    }
  }, [teacherProfile?.id]);

  useEffect(() => {
    void fetchTeacherProfile();
    void fetchClasses();
  }, [fetchTeacherProfile, fetchClasses]);

  useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const classes = useMemo(
    () => allClasses.filter((cls) => (viewMode === 'archived' ? cls.is_archived : !cls.is_archived)),
    [allClasses, viewMode]
  );
  const currentClass = useMemo(
    () => allClasses.find((cls) => cls.id === currentClassId) ?? null,
    [allClasses, currentClassId]
  );

  const value: DashboardContextType = {
    classes,
    currentClass,
    isLoadingClasses,
    teacherProfile,
    isLoadingProfile,
    students,
    setStudents,
    isLoadingStudents,
    isLoading: isLoadingProfile || isLoadingClasses || isLoadingStudents,
    refreshClasses: fetchClasses,
    refreshStudents: fetchStudents,
    viewMode,
    setViewMode,
    viewPreference,
    updateViewPreference,
    activeSeatingLayoutId,
    setActiveSeatingLayoutId,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

