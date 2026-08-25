-- 1. Create Profiles Table (user study stats)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    streak INTEGER DEFAULT 0 NOT NULL,
    last_study_date TEXT,
    progress JSONB DEFAULT '{}'::jsonb NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create User Words Table (saved and learned words sync)
CREATE TABLE IF NOT EXISTS public.user_words (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    word_id TEXT NOT NULL,
    is_saved BOOLEAN DEFAULT false NOT NULL,
    is_learned BOOLEAN DEFAULT false NOT NULL,
    learned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id, word_id)
);

-- 3. Create Custom Words Table (words created by the user)
CREATE TABLE IF NOT EXISTS public.custom_words (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    character TEXT NOT NULL,
    traditional TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    meaning TEXT NOT NULL,
    hsk_level INTEGER DEFAULT 1 NOT NULL,
    examples JSONB DEFAULT '[]'::jsonb NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_words ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for Profiles
CREATE POLICY "Allow users to read their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 6. Create RLS Policies for User Words
CREATE POLICY "Allow users to read their own user_words" 
    ON public.user_words FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own user_words" 
    ON public.user_words FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own user_words" 
    ON public.user_words FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own user_words" 
    ON public.user_words FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Create RLS Policies for Custom Words
CREATE POLICY "Allow users to read their own custom_words" 
    ON public.custom_words FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own custom_words" 
    ON public.custom_words FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own custom_words" 
    ON public.custom_words FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own custom_words" 
    ON public.custom_words FOR DELETE 
    USING (auth.uid() = user_id);

-- 8. Create automatic profile creation on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, streak, last_study_date, progress)
    VALUES (new.id, 0, NULL, '{}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Create HSK Question Bank Table
CREATE TABLE IF NOT EXISTS public.hsk_question_bank (
    id TEXT PRIMARY KEY,
    level INTEGER NOT NULL,
    syllabus_version TEXT DEFAULT '2.0' NOT NULL,
    section TEXT NOT NULL,
    question_type TEXT NOT NULL,
    difficulty TEXT DEFAULT 'medium' NOT NULL,
    question_text TEXT NOT NULL,
    pinyin_text TEXT,
    audio_text TEXT,
    audio_url TEXT,
    image_url TEXT,
    passage TEXT,
    words_to_arrange JSONB,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    explanation TEXT NOT NULL,
    vocabulary_ids JSONB DEFAULT '[]'::jsonb,
    grammar_ids JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    quality_score NUMERIC DEFAULT 1.0,
    status TEXT DEFAULT 'approved' NOT NULL,
    source TEXT DEFAULT 'curated' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. Create HSK User Exam History Table
CREATE TABLE IF NOT EXISTS public.hsk_exam_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    exam_id TEXT NOT NULL,
    level INTEGER NOT NULL,
    syllabus_version TEXT DEFAULT '2.0' NOT NULL,
    mode TEXT DEFAULT 'mock' NOT NULL,
    title TEXT NOT NULL,
    total_score NUMERIC NOT NULL,
    max_score NUMERIC NOT NULL,
    passing_score NUMERIC NOT NULL,
    is_passed BOOLEAN NOT NULL,
    accuracy NUMERIC NOT NULL,
    time_spent_seconds INTEGER NOT NULL,
    section_scores JSONB NOT NULL,
    user_answers JSONB NOT NULL,
    weaknesses JSONB DEFAULT '[]'::jsonb NOT NULL,
    exam_snapshot JSONB NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 11. Create HSK User Weaknesses Tracking Table
CREATE TABLE IF NOT EXISTS public.hsk_user_weaknesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    weakness_name TEXT NOT NULL,
    level INTEGER NOT NULL,
    miss_count INTEGER DEFAULT 1 NOT NULL,
    last_missed_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(user_id, weakness_name, level)
);

-- 12. Enable RLS on new HSK tables
ALTER TABLE public.hsk_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsk_exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hsk_user_weaknesses ENABLE ROW LEVEL SECURITY;

-- 13. RLS for Question Bank (Public read, admin write)
CREATE POLICY "Allow public read approved questions"
    ON public.hsk_question_bank FOR SELECT
    USING (status = 'approved' OR auth.role() = 'authenticated');

-- 14. RLS for Exam Results
CREATE POLICY "Allow users to read their own exam results"
    ON public.hsk_exam_results FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow users to insert their own exam results"
    ON public.hsk_exam_results FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 15. RLS for User Weaknesses
CREATE POLICY "Allow users to read their own weaknesses"
    ON public.hsk_user_weaknesses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert/update their own weaknesses"
    ON public.hsk_user_weaknesses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own weaknesses"
    ON public.hsk_user_weaknesses FOR UPDATE
    USING (auth.uid() = user_id);

