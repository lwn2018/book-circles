-- Badge Evaluation Trigger
-- Awards badges automatically when user_events are inserted

-- Insert the 3 starter badges if they don't exist
-- Valid categories: lending, borrowing, circle, impact, time, special
INSERT INTO badges (slug, name, description, category, trigger_type, trigger_condition, is_earnable)
VALUES 
  ('shelf_starter', 'Shelf Starter', 'Added your first book to PagePass', 'special', 'automatic', '{"event_type": "book_added", "count": 1}', true),
  ('circle_maker', 'Circle Maker', 'Created your first circle', 'circle', 'automatic', '{"event_type": "circle_created", "count": 1}', true),
  ('first_lend', 'First Lend', 'Lent your first book to someone', 'lending', 'automatic', '{"event_type": "handoff_confirmed", "count": 1, "role": "giver"}', true)
ON CONFLICT (slug) DO NOTHING;

-- Create the badge evaluation function
CREATE OR REPLACE FUNCTION evaluate_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
  event_count INTEGER;
  should_award BOOLEAN;
  existing_displayed_badge_id UUID;
  notification_message TEXT;
BEGIN
  -- Loop through automatic badges that could be triggered by this event type
  FOR badge_record IN 
    SELECT id, slug, name, trigger_condition
    FROM badges 
    WHERE trigger_type = 'automatic' 
      AND is_earnable = true
      AND trigger_condition->>'event_type' = NEW.event_type
  LOOP
    should_award := false;
    
    -- Check if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = NEW.user_id AND badge_id = badge_record.id) THEN
      CONTINUE; -- Skip, already earned
    END IF;
    
    -- Evaluate based on badge criteria
    CASE badge_record.slug
      WHEN 'shelf_starter' THEN
        -- User has added at least 1 book
        SELECT COUNT(*) INTO event_count
        FROM user_events 
        WHERE user_id = NEW.user_id AND event_type = 'book_added';
        should_award := event_count >= 1;
        notification_message := 'You earned Shelf Starter! Your first book is on the shelf.';
        
      WHEN 'circle_maker' THEN
        -- User has created at least 1 circle
        SELECT COUNT(*) INTO event_count
        FROM user_events 
        WHERE user_id = NEW.user_id AND event_type = 'circle_created';
        should_award := event_count >= 1;
        notification_message := 'You earned Circle Maker! You started something great.';
        
      WHEN 'first_lend' THEN
        -- User has confirmed at least 1 handoff as the giver
        SELECT COUNT(*) INTO event_count
        FROM user_events 
        WHERE user_id = NEW.user_id 
          AND event_type = 'handoff_confirmed'
          AND metadata->>'role' = 'giver';
        should_award := event_count >= 1;
        notification_message := 'You earned First Lend! Your first book is on its way.';
        
      ELSE
        -- Unknown badge, skip
        CONTINUE;
    END CASE;
    
    IF should_award THEN
      -- Clear any currently displayed badge for this user
      UPDATE user_badges 
      SET is_displayed = false 
      WHERE user_id = NEW.user_id AND is_displayed = true;
      
      -- Award the badge (ON CONFLICT handles idempotency)
      INSERT INTO user_badges (user_id, badge_id, earned_at, is_displayed)
      VALUES (NEW.user_id, badge_record.id, NOW(), true)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
      
      -- Create notification
      INSERT INTO notifications (user_id, type, message, action_url, read, created_at)
      VALUES (
        NEW.user_id, 
        'badge_earned', 
        notification_message,
        '/settings', -- Could link to badge collection page when built
        false,
        NOW()
      );
      
      RAISE NOTICE 'Awarded badge % to user %', badge_record.slug, NEW.user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on user_events
DROP TRIGGER IF EXISTS evaluate_badges_trigger ON user_events;

CREATE TRIGGER evaluate_badges_trigger
AFTER INSERT ON user_events
FOR EACH ROW
EXECUTE FUNCTION evaluate_badges();

-- Ensure unique constraint exists on user_badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_badges_user_id_badge_id_key'
  ) THEN
    ALTER TABLE user_badges ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
  END IF;
END $$;
