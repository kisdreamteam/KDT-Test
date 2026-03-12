-- Allow seat_index to be NULL for legacy groups (created before seat_index feature).
-- App sorts by first_name when any assignment in a group has null seat_index.

ALTER TABLE student_seat_assignments
ALTER COLUMN seat_index DROP NOT NULL;
