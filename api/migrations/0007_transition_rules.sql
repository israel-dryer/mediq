INSERT INTO appointment_transition (from_status, to_status, actor) VALUES
  -- staff
  ('scheduled', 'confirmed', 'staff'),
  ('scheduled', 'arrived',   'staff'),
  ('scheduled', 'canceled',  'staff'),
  ('scheduled', 'bumped',    'staff'),
  ('scheduled', 'no_show',   'staff'),
  ('confirmed', 'arrived',   'staff'),
  ('confirmed', 'canceled',  'staff'),
  ('confirmed', 'bumped',    'staff'),
  ('confirmed', 'no_show',   'staff'),
  ('arrived',   'roomed',    'staff'),
  ('arrived',   'completed', 'staff'),
  ('arrived',   'canceled',  'staff'),
  ('roomed',    'completed', 'staff'),
  ('roomed',    'canceled',  'staff'),
  -- patient
  ('scheduled', 'confirmed', 'patient'),
  ('scheduled', 'arrived',   'patient'),
  ('scheduled', 'canceled',  'patient'),
  ('confirmed', 'arrived',   'patient'),
  ('confirmed', 'canceled',  'patient');