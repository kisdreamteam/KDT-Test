import DashboardLayout from '@/layouts/dashboard/DashboardLayout';
import AppViewClasses from '@/components/features/dashboard/AppViewClasses';
import AppViewStudents from '@/components/features/dashboard/AppViewStudents';

interface DashboardModuleProps {
  view: 'classes' | 'students';
}

export default function DashboardModule({ view }: DashboardModuleProps) {
  return (
    <DashboardLayout>
      {view === 'classes' ? <AppViewClasses /> : <AppViewStudents />}
    </DashboardLayout>
  );
}
