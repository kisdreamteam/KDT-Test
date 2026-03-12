-- Add seat_index column to student_seat_assignments for explicit display order within a group.
-- First student = 1, second = 2, etc. Swapping students swaps their seat_index values.

ALTER TABLE student_seat_assignments
ADD COLUMN IF NOT EXISTS seat_index integer;

-- Backfill: assign seat_index 1, 2, 3, ... per seating_group_id using existing row order (id).
WITH ranked AS (
  SELECT id, seating_group_id,
         row_number() OVER (PARTITION BY seating_group_id ORDER BY id) AS rn
  FROM student_seat_assignments
)
UPDATE student_seat_assignments s
SET seat_index = ranked.rn
FROM ranked
WHERE s.id = ranked.id;

-- Set default for new rows (app also sets explicitly)
ALTER TABLE student_seat_assignments
ALTER COLUMN seat_index SET DEFAULT 1;

-- Keep seat_index nullable so legacy groups (before this feature) can have null and sort by first name in the app.
