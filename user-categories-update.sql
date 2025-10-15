-- Create user_categories table for storing user category preferences
CREATE TABLE public.user_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create index for better query performance
CREATE INDEX idx_user_categories_user_id ON public.user_categories(user_id);

-- Add categories_selected column to users table to track if user has selected categories
ALTER TABLE public.users 
ADD COLUMN categories_selected BOOLEAN DEFAULT false;