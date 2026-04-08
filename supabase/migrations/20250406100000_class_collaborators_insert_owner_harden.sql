-- If you already applied an older version of 20250406000000 without the self-insert guard,
-- run this (or re-run the full 20250406000000 file from a fresh DB). Safe to apply after the main migration.

DROP POLICY IF EXISTS class_collaborators_insert_owner ON public.class_collaborators;

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
