-- Add category column to existing blogs table
ALTER TABLE public.blogs 
ADD COLUMN category TEXT NOT NULL DEFAULT 'Tech';

-- Add check constraint to ensure only valid categories are used
ALTER TABLE public.blogs 
ADD CONSTRAINT blogs_category_check 
CHECK (category IN (
  'Art', 'Automotive', 'Beauty', 'Book and Writing', 'Business', 'DIY', 'Education', 
  'Entertainment', 'Fashion', 'Finance', 'Food and Recipe', 'Gaming', 'Green Living', 
  'Health', 'History', 'Home Décor', 'Interior Design', 'Internet Services', 
  'Love and Relationships', 'Marketing', 'Mental Health', 'Minimalism', 'Money-Saving', 
  'Music', 'News and Current Affairs', 'Parenting', 'Personal', 'Personal Development', 
  'Photography', 'Productivity', 'Religion', 'Review', 'SaaS', 'Science', 
  'Self-Improvement', 'Sports', 'Tech', 'Travel', 'Wellness', 'Yoga and Meditation'
));

-- Create index on category column for better query performance
CREATE INDEX idx_blogs_category ON public.blogs(category);

-- Create index on category and published columns for filtered queries
CREATE INDEX idx_blogs_category_published ON public.blogs(category, published);