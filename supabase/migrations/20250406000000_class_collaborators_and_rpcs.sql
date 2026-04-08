-- class_collaborators: shared class access for teachers (collaborators only; owner remains classes.teacher_id)
-- RLS + RPCs for email resolution via auth.users (profiles do not store email in this project)

CREATE TABLE IF NOT EXISTS public.class_collaborators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes (id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  primary_user boolean NOT NULL DEFAULT false,
  CONSTRAINT class_collaborators_class_collaborator_unique UNIQUE (class_id, collaborator_id)
);

CREATE INDEX IF NOT EXISTS class_collaborators_class_id_idx
  ON public.class_collaborators (class_id);

ALTER TABLE public.class_collaborators ENABLE ROW LEVEL SECURITY;

-- SELECT: class owner or the collaborator themself
CREATE POLICY class_collaborators_select_owner_or_collaborator
  ON public.class_collaborators
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_collaborators.class_id
        AND c.teacher_id = auth.uid()
    )
    OR collaborator_id = auth.uid()
  );

-- INSERT: only the class owner; cannot add self as collaborator row
CREATE POLICY class_collaborators_insert_owner
  ON public.class_collaborators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_collaborators.class_id
        AND c.teacher_id = auth.uid()
    )
    AND class_collaborators.collaborator_id <> auth.uid()
  );

-- DELETE: only the class owner
CREATE POLICY class_collaborators_delete_owner
  ON public.class_collaborators
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.classes c
      WHERE c.id = class_collaborators.class_id
        AND c.teacher_id = auth.uid()
    )
  );

-- Resolve a teacher by @kshcm.net email (auth.users + profiles)
CREATE OR REPLACE FUNCTION public.lookup_teacher_by_email(p_email text)
RETURNS TABLE (id uuid, name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name::text, u.email::text
  FROM auth.users u
  INNER JOIN public.profiles p ON p.id = u.id
  WHERE lower(trim(both FROM u.email)) = lower(trim(both FROM p_email))
    AND lower(trim(both FROM u.email)) LIKE '%@kshcm.net'
    AND lower(trim(both FROM p_email)) LIKE '%@kshcm.net'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_teacher_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_teacher_by_email(text) TO authenticated;

-- List collaborators for a class with name + email (caller must be owner or collaborator)
CREATE OR REPLACE FUNCTION public.list_class_collaborators(p_class_id uuid)
RETURNS TABLE (row_id uuid, collaborator_id uuid, name text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cc.id, cc.collaborator_id, p.name::text, u.email::text
  FROM public.class_collaborators cc
  INNER JOIN public.profiles p ON p.id = cc.collaborator_id
  INNER JOIN auth.users u ON u.id = cc.collaborator_id
  WHERE cc.class_id = p_class_id
    AND (
      EXISTS (
        SELECT 1 FROM public.classes c
        WHERE c.id = p_class_id AND c.teacher_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.class_collaborators cc2
        WHERE cc2.class_id = p_class_id AND cc2.collaborator_id = auth.uid()
      )
    );
$$;

REVOKE ALL ON FUNCTION public.list_class_collaborators(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_class_collaborators(uuid) TO authenticated;
