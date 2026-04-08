-- Accessible classes for owner/collaborator dashboards
CREATE OR REPLACE FUNCTION public.list_accessible_classes()
RETURNS TABLE (
  id uuid,
  name text,
  grade text,
  school_year text,
  teacher_id uuid,
  is_archived boolean,
  created_at timestamptz,
  icon text,
  is_owner boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.name::text,
    c.grade::text,
    c.school_year::text,
    c.teacher_id,
    c.is_archived,
    c.created_at,
    c.icon::text,
    (c.teacher_id = auth.uid()) AS is_owner
  FROM public.classes c
  WHERE
    c.teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.class_collaborators cc
      WHERE cc.class_id = c.id
        AND cc.collaborator_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.list_accessible_classes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_accessible_classes() TO authenticated;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- SELECT: class owner or collaborator
DROP POLICY IF EXISTS classes_select_owner_or_collaborator ON public.classes;
CREATE POLICY classes_select_owner_or_collaborator
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.class_collaborators cc
      WHERE cc.class_id = classes.id
        AND cc.collaborator_id = auth.uid()
    )
  );

-- INSERT: owner can only create rows for themself
DROP POLICY IF EXISTS classes_insert_owner_only ON public.classes;
CREATE POLICY classes_insert_owner_only
  ON public.classes
  FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

-- UPDATE: owner only (collaborators cannot change class settings/archive status)
DROP POLICY IF EXISTS classes_update_owner_only ON public.classes;
CREATE POLICY classes_update_owner_only
  ON public.classes
  FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid())
  WITH CHECK (teacher_id = auth.uid());

-- DELETE: owner only
DROP POLICY IF EXISTS classes_delete_owner_only ON public.classes;
CREATE POLICY classes_delete_owner_only
  ON public.classes
  FOR DELETE
  TO authenticated
  USING (teacher_id = auth.uid());
