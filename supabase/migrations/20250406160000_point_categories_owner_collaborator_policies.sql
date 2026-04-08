-- Grant class owner + collaborators access to point_categories (skill cards) for that class.
-- Uses SECURITY DEFINER helpers from prior migration:
--   public.is_class_owner(uuid)
--   public.is_collaborator_for_class(uuid)

ALTER TABLE public.point_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS point_categories_select_owner_or_collaborator ON public.point_categories;
CREATE POLICY point_categories_select_owner_or_collaborator
  ON public.point_categories
  FOR SELECT
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );

DROP POLICY IF EXISTS point_categories_insert_owner_or_collaborator ON public.point_categories;
CREATE POLICY point_categories_insert_owner_or_collaborator
  ON public.point_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );

DROP POLICY IF EXISTS point_categories_update_owner_or_collaborator ON public.point_categories;
CREATE POLICY point_categories_update_owner_or_collaborator
  ON public.point_categories
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

DROP POLICY IF EXISTS point_categories_delete_owner_or_collaborator ON public.point_categories;
CREATE POLICY point_categories_delete_owner_or_collaborator
  ON public.point_categories
  FOR DELETE
  TO authenticated
  USING (
    public.is_class_owner(class_id)
    OR public.is_collaborator_for_class(class_id)
  );
