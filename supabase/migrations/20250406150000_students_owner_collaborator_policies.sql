-- Grant class owner + collaborators access to students in that class.
-- Uses SECURITY DEFINER helpers from prior migration:
--   public.is_class_owner(uuid)
--   public.is_collaborator_for_class(uuid)

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS students_select_owner_or_collaborator ON public.students;
CREATE POLICY students_select_owner_or_collaborator
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );

DROP POLICY IF EXISTS students_insert_owner_or_collaborator ON public.students;
CREATE POLICY students_insert_owner_or_collaborator
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );

DROP POLICY IF EXISTS students_update_owner_or_collaborator ON public.students;
CREATE POLICY students_update_owner_or_collaborator
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  )
  WITH CHECK (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );

DROP POLICY IF EXISTS students_delete_owner_or_collaborator ON public.students;
CREATE POLICY students_delete_owner_or_collaborator
  ON public.students
  FOR DELETE
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );
