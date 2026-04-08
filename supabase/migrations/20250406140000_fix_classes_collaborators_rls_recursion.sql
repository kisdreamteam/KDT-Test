-- Fix infinite recursion between classes and class_collaborators RLS policies.
-- Inline EXISTS(subquery other table) caused mutual policy re-evaluation.
-- SECURITY DEFINER helpers read underlying rows without re-entering RLS.

CREATE OR REPLACE FUNCTION public.is_class_owner(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.id = p_class_id
      AND c.teacher_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_collaborator_for_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_collaborators cc
    WHERE cc.class_id = p_class_id
      AND cc.collaborator_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_class_owner(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_class_owner(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_collaborator_for_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_collaborator_for_class(uuid) TO authenticated;

DROP POLICY IF EXISTS classes_select_owner_or_collaborator ON public.classes;
CREATE POLICY classes_select_owner_or_collaborator
  ON public.classes
  FOR SELECT
  TO authenticated
  USING (
    teacher_id = auth.uid()
    OR public.is_collaborator_for_class(id)
  );

DROP POLICY IF EXISTS class_collaborators_select_owner_or_collaborator ON public.class_collaborators;
CREATE POLICY class_collaborators_select_owner_or_collaborator
  ON public.class_collaborators
  FOR SELECT
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR collaborator_id = auth.uid()
  );

DROP POLICY IF EXISTS class_collaborators_insert_owner ON public.class_collaborators;
CREATE POLICY class_collaborators_insert_owner
  ON public.class_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_class_owner(class_id)
    AND collaborator_id <> auth.uid()
  );

DROP POLICY IF EXISTS class_collaborators_delete_owner ON public.class_collaborators;
CREATE POLICY class_collaborators_delete_owner
  ON public.class_collaborators
  FOR DELETE
  TO authenticated
  USING (public.is_class_owner(class_id));
