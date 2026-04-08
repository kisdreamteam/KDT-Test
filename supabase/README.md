# Supabase migrations

## Collaborators (`class_collaborators`)

If you see **404** errors for `lookup_teacher_by_email`, `list_class_collaborators`, or `class_collaborators` in the browser console, the migration has not been applied to your remote project yet.

### Apply the migration

1. Open the Supabase Dashboard for your project.
2. Go to **SQL Editor** → **New query**.
3. Paste and run [`migrations/20250406000000_class_collaborators_and_rpcs.sql`](./migrations/20250406000000_class_collaborators_and_rpcs.sql) (creates table, RLS including hardened INSERT, and RPCs).

If you **already** applied an older version of that file **without** `collaborator_id <> auth.uid()` on INSERT, also run [`migrations/20250406100000_class_collaborators_insert_owner_harden.sql`](./migrations/20250406100000_class_collaborators_insert_owner_harden.sql) to replace the INSERT policy.

Alternatively, if you use the Supabase CLI with a linked project:

```bash
supabase db push
```

(from a repo root that includes `supabase/config.toml` and is linked to your project)

### Verify objects exist

Run in **SQL Editor**:

```sql
-- Table
SELECT to_regclass('public.class_collaborators') IS NOT NULL AS class_collaborators_exists;

-- RPCs (should return 2 rows)
SELECT proname
FROM pg_proc
JOIN pg_namespace n ON n.oid = pg_proc.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('lookup_teacher_by_email', 'list_class_collaborators');
```

### Manual retest (EditClassModal → Teachers)

1. Open **Edit Class** → **Teachers** tab (as the class owner).
2. Add a valid `@kshcm.net` email for an existing teacher → confirm dialog → row appears in list → success modal.
3. Try an email with no account → “Teacher not found” modal.
4. Remove a collaborator → row disappears.
5. Non-owners should not be able to insert/delete collaborator rows (RLS).
