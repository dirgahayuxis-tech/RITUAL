-- Schema for Ritual (Ruang Intelektual)
-- Compatible with Supabase (PostgreSQL)

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  bio TEXT,
  whatsapp_no TEXT,
  portfolio_links JSONB DEFAULT '{}'::jsonb,
  image_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Courses table
CREATE TABLE courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  mentor_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  type TEXT CHECK (type IN ('online', 'offline')) NOT NULL,
  location_city TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are viewable by everyone." ON courses FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Mentors can manage their own courses." ON courses FOR ALL USING (auth.uid() = mentor_id);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews are viewable by everyone." ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews." ON reviews FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_location ON courses(location_city);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
