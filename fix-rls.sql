-- Fix the infinite recursion in circle_members policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Members can view circle membership" ON public.circle_members;

-- Create a simpler policy that doesn't cause recursion
-- Users can see their own memberships + memberships in circles they own
CREATE POLICY "Users can view circle membership" 
  ON public.circle_members FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.circles
      WHERE circles.id = circle_members.circle_id
      AND circles.owner_id = auth.uid()
    )
  );

-- Also allow users to see other members in circles they belong to via a function
CREATE OR REPLACE FUNCTION public.is_circle_member(circle_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.circle_members
    WHERE circle_id = circle_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policy to use the function
DROP POLICY IF EXISTS "Users can view circle membership" ON public.circle_members;

CREATE POLICY "Circle members can view membership" 
  ON public.circle_members FOR SELECT USING (
    user_id = auth.uid() OR
    is_circle_member(circle_id)
  );
