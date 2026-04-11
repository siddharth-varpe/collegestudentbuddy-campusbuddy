
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read college data" ON public.college_data;
DROP POLICY IF EXISTS "Faculty can delete college data" ON public.college_data;
DROP POLICY IF EXISTS "Faculty can insert college data" ON public.college_data;
DROP POLICY IF EXISTS "Faculty can update college data" ON public.college_data;

-- Recreate with anon + authenticated access
CREATE POLICY "Anyone can read college data" ON public.college_data
FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can insert college data" ON public.college_data
FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can update college data" ON public.college_data
FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "Anyone can delete college data" ON public.college_data
FOR DELETE TO anon, authenticated USING (true);
