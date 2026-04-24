'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/client';
import type { Student } from '@/lib/types';

export type PointLogRow = {
  id: string;
  studentName: string;
  reason: string;
  points: number;
  createdAt: string;
};

export function formatPointLogDateDDMMYYYY(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear());
  return `${day}/${month}/${year}`;
}

export function useClassPointLog(classId: string | undefined, students: Student[]) {
  const [isPointLogOpen, setIsPointLogOpen] = useState(false);
  const [isPointLogLoading, setIsPointLogLoading] = useState(false);
  const [pointLogError, setPointLogError] = useState<string | null>(null);
  const [pointLogRows, setPointLogRows] = useState<PointLogRow[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [logTotalCount, setLogTotalCount] = useState(0);

  const fetchPointLogRows = useCallback(async () => {
    if (!classId) return;
    try {
      setIsPointLogLoading(true);
      setPointLogError(null);
      const supabase = createClient();

      const studentNameMap = new Map<string, string>();
      const studentIds = students.map((s) => {
        const first = s.first_name ?? '';
        const last = s.last_name ?? '';
        studentNameMap.set(s.id, `${first} ${last}`.trim() || 'Unknown student');
        return s.id;
      });

      if (studentIds.length === 0) {
        setPointLogRows([]);
        setLogTotalCount(0);
        return;
      }

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
        console.error('Error fetching point events:', pointEventsError);
      }
      if (customEventsError) {
        console.error('Error fetching custom point events:', customEventsError);
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
          console.error('Error fetching point categories for log:', categoriesError);
        } else {
          (categoriesData ?? []).forEach((c: { id: string; name?: string }) => {
            categoryMap.set(c.id, c.name ?? 'Category');
          });
        }
      }

      const standardRows: PointLogRow[] = ((pointEvents ?? []) as Record<string, unknown>[]).map(
        (ev) => {
          const categoryId = ev.category_id as string;
          return {
            id: `standard-${ev.id}`,
            studentName: studentNameMap.get(ev.student_id as string) ?? 'Unknown student',
            reason: categoryMap.get(categoryId) ?? 'Point award',
            points: Number(ev.points ?? 0),
            createdAt: ev.created_at as string,
          };
        }
      );

      const customRows: PointLogRow[] = ((customEvents ?? []) as Record<string, unknown>[]).map(
        (ev) => {
          const memo = String(ev.memo ?? '').trim();
          return {
            id: `custom-${ev.id}`,
            studentName: studentNameMap.get(ev.student_id as string) ?? 'Unknown student',
            reason: memo ? `Custom: ${memo}` : 'Custom',
            points: Number(ev.points ?? 0),
            createdAt: ev.created_at as string,
          };
        }
      );

      const mergedRows = [...standardRows, ...customRows].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setPointLogRows(mergedRows);
      setLogTotalCount(mergedRows.length);
    } catch (err) {
      console.error('Unexpected error fetching point log rows:', err);
      setPointLogError('Failed to load point log.');
      setPointLogRows([]);
      setLogTotalCount(0);
    } finally {
      setIsPointLogLoading(false);
    }
  }, [classId, students]);

  useEffect(() => {
    if (isPointLogOpen) {
      setLogPage(1);
      fetchPointLogRows();
    }
  }, [isPointLogOpen, fetchPointLogRows]);

  const totalPages = Math.max(1, Math.ceil(logTotalCount / rowsPerPage));
  const safeLogPage = Math.min(Math.max(logPage, 1), totalPages);
  const pagedPointLogRows = useMemo(() => {
    const start = (safeLogPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return pointLogRows.slice(start, end);
  }, [pointLogRows, rowsPerPage, safeLogPage]);

  return {
    isPointLogOpen,
    setIsPointLogOpen,
    isPointLogLoading,
    pointLogError,
    pointLogRows,
    logPage,
    setLogPage,
    rowsPerPage,
    setRowsPerPage,
    logTotalCount,
    totalPages,
    safeLogPage,
    pagedPointLogRows,
    fetchPointLogRows,
  };
}
