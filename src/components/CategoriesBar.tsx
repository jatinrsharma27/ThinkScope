'use client';

import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ALL_CATEGORIES = [
  'Art', 'Automotive', 'Beauty', 'Book and Writing', 'Business', 'DIY', 'Education', 
  'Entertainment', 'Fashion', 'Finance', 'Food and Recipe', 'Gaming', 'Green Living', 
  'Health', 'History', 'Home Décor', 'Interior Design', 'Internet Services', 
  'Love and Relationships', 'Marketing', 'Mental Health', 'Minimalism', 'Money-Saving', 
  'Music', 'Nature', 'News and Current Affairs', 'Parenting', 'Personal', 'Personal Development', 
  'Photography', 'Productivity', 'Religion', 'Review', 'SaaS', 'Science', 
  'Self-Improvement', 'Sports', 'Tech', 'Travel', 'Wellness', 'Yoga and Meditation'
];

interface CategoriesBarProps {
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

export default function CategoriesBar({ selectedCategory = 'All', onCategorySelect }: CategoriesBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    const loadUserCategories = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        const { data } = await supabase
          .from('user_categories')
          .select('category')
          .eq('user_id', session.user.id);
        
        if (data && data.length > 0) {
          const sortedCategories = data.map(item => item.category).sort();
          setCategories(['All', ...sortedCategories]);
        } else {
          setCategories(['All', ...ALL_CATEGORIES]);
        }
      } else {
        setCategories(['All', ...ALL_CATEGORIES]);
      }
    };
    loadUserCategories();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="relative flex items-center">
        {/* Left scroll button */}
        <button
          onClick={scrollLeft}
          className="absolute left-0 z-10 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Categories container */}
        <div ref={scrollRef} className="overflow-x-auto scrollbar-hide mx-10">
          <div className="flex space-x-4 min-w-max">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategorySelect?.(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Right scroll button */}
        <button
          onClick={scrollRight}
          className="absolute right-0 z-10 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full shadow-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}