INSERT INTO badges (slug, name, description, category, trigger_type, trigger_condition, is_earnable)
VALUES 
  ('shelf_starter', 'Shelf Starter', 'Added your first book to PagePass', 'special', 'automatic', '{"event_type": "book_added", "count": 1}', true),
  ('circle_maker', 'Circle Maker', 'Created your first circle', 'circle', 'automatic', '{"event_type": "circle_created", "count": 1}', true),
  ('first_lend', 'First Lend', 'Lent your first book to someone', 'lending', 'automatic', '{"event_type": "handoff_confirmed", "count": 1, "role": "giver"}', true)
ON CONFLICT (slug) DO NOTHING;
