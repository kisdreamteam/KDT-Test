import { createClient } from '@/lib/client';
import type { PointCategory } from '@/lib/types';

export type PointLogRow = {
  id: string;
  studentName: string;
  reason: string;
  points: number;
  createdAt: string;
};

export async function fetchPointCategoriesByClassIds(classIds: string[]): Promise<PointCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('point_categories')
    .select('*')
    .in('class_id', classIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as PointCategory[];
}

export async function fetchStudentIdsByClassIds(classIds: string[]): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .in('class_id', classIds);

  if (error) {
    throw error;
  }

  return (data ?? []).map((s: { id: string }) => s.id);
}

export async function fetchStudentIdsByClassId(classId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('students')
    .select('id')
    .eq('class_id', classId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((s: { id: string }) => s.id);
}

export async function awardPointsToStudents(params: {
  studentIds: string[];
  categoryId: string;
  points: number;
  memo?: string;
}): Promise<void> {
  const { studentIds, categoryId, points, memo = '' } = params;
  const supabase = createClient();

  const results = await Promise.all(
    studentIds.map(async (studentId) => {
      const { error } = await supabase.rpc('award_points_to_student', {
        student_id_in: studentId,
        category_id_in: categoryId,
        points_in: points,
        memo_in: memo,
      });
      return error;
    })
  );

  if (results.some((err) => err !== null)) {
    throw new Error('Failed to award points to one or more students.');
  }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) {
    return null;
  }
  return session.user.id;
}

export async function awardCustomPointsToStudents(params: {
  studentIds: string[];
  teacherId: string;
  points: number;
  memo?: string;
}): Promise<void> {
  const { studentIds, teacherId, points, memo } = params;
  const supabase = createClient();

  const { data: students, error: fetchError } = await supabase
    .from('students')
    .select('id, points')
    .in('id', studentIds);

  if (fetchError) {
    throw fetchError;
  }

  const rows = (students ?? []) as Array<{ id: string; points: number | null }>;
  const results = await Promise.all(
    rows.map(async (student) => {
      const { error: insertError } = await supabase
        .from('custom_point_events')
        .insert({
          student_id: student.id,
          teacher_id: teacherId,
          points,
          memo: memo || null,
        });

      if (insertError) {
        return insertError;
      }

      const currentPoints = student.points ?? 0;
      const { error: updateError } = await supabase
        .from('students')
        .update({ points: currentPoints + points })
        .eq('id', student.id);

      return updateError;
    })
  );

  if (results.some((err) => err !== null)) {
    throw new Error('Failed to apply custom points to one or more students.');
  }
}

export async function fetchPointLogRowsForStudents(params: {
  studentIds: string[];
  studentNameMap: Map<string, string>;
}): Promise<PointLogRow[]> {
  const { studentIds, studentNameMap } = params;
  const supabase = createClient();

  const { data: pointEvents, error: pointEventsError } = await supabase
    .from('point_events')
    .select('id, student_id, category_id, points, created_at')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  const { data: customEvents, error: customEventsError } = await supabase
    .from('custom_point_events')
    .select('id, student_id, points, memo, created_at')
    .in('student_id', studentIds)
    .order('created_at', { ascending: false });

  if (pointEventsError) {
    throw pointEventsError;
  }
  if (customEventsError) {
    throw customEventsError;
  }

  const categoryIds = Array.from(
    new Set(
      ((pointEvents ?? []) as { category_id?: string }[])
        .map((ev) => ev.category_id)
        .filter(Boolean)
    )
  );

  const categoryMap = new Map<string, string>();
  if (categoryIds.length > 0) {
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('point_categories')
      .select('id, name')
      .in('id', categoryIds);

    if (categoriesError) {
      throw categoriesError;
    }

    (categoriesData ?? []).forEach((c: { id: string; name?: string }) => {
      categoryMap.set(c.id, c.name ?? 'Category');
    });
  }

  const standardRows: PointLogRow[] = ((pointEvents ?? []) as Record<string, unknown>[]).map((ev) => {
    const categoryId = ev.category_id as string;
    return {
      id: `standard-${ev.id}`,
      studentName: studentNameMap.get(ev.student_id as string) ?? 'Unknown student',
      reason: categoryMap.get(categoryId) ?? 'Point award',
      points: Number(ev.points ?? 0),
      createdAt: ev.created_at as string,
    };
  });

  const customRows: PointLogRow[] = ((customEvents ?? []) as Record<string, unknown>[]).map((ev) => {
    const memoText = String(ev.memo ?? '').trim();
    return {
      id: `custom-${ev.id}`,
      studentName: studentNameMap.get(ev.student_id as string) ?? 'Unknown student',
      reason: memoText ? `Custom: ${memoText}` : 'Custom',
      points: Number(ev.points ?? 0),
      createdAt: ev.created_at as string,
    };
  });

  return [...standardRows, ...customRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

