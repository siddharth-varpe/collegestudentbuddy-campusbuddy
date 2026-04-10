-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  user_type TEXT NOT NULL DEFAULT 'student' CHECK (user_type IN ('student', 'faculty')),
  division TEXT,
  year_of_study INTEGER,
  branch TEXT,
  roll_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, user_type, division, year_of_study, branch, roll_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'student'),
    NEW.raw_user_meta_data->>'division',
    (NEW.raw_user_meta_data->>'year_of_study')::INTEGER,
    NEW.raw_user_meta_data->>'branch',
    NEW.raw_user_meta_data->>'roll_number'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create college_data table
CREATE TABLE public.college_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.college_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read college data" ON public.college_data FOR SELECT TO authenticated USING (true);
CREATE POLICY "Faculty can insert college data" ON public.college_data FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Faculty can update college data" ON public.college_data FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Faculty can delete college data" ON public.college_data FOR DELETE TO authenticated USING (true);

-- Create syncspot_questions table
CREATE TABLE public.syncspot_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  asked_by UUID REFERENCES auth.users(id),
  student_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.syncspot_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read syncspot questions" ON public.syncspot_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert syncspot questions" ON public.syncspot_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update syncspot questions" ON public.syncspot_questions FOR UPDATE TO authenticated USING (true);

-- Create syncspot_answers table
CREATE TABLE public.syncspot_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.syncspot_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.syncspot_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read syncspot answers" ON public.syncspot_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can insert syncspot answers" ON public.syncspot_answers FOR INSERT TO authenticated WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_college_data_updated_at BEFORE UPDATE ON public.college_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_syncspot_questions_updated_at BEFORE UPDATE ON public.syncspot_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', true);

CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Anyone can read documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');