'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

const CATEGORIES = [
  'Art', 'Automotive', 'Beauty', 'Book and Writing', 'Business', 'DIY', 'Education', 
  'Entertainment', 'Fashion', 'Finance', 'Food and Recipe', 'Gaming', 'Green Living', 
  'Health', 'History', 'Home Décor', 'Interior Design', 'Internet Services', 
  'Love and Relationships', 'Marketing', 'Mental Health', 'Minimalism', 'Money-Saving', 
  'Music', 'Nature', 'News and Current Affairs', 'Parenting', 'Personal', 'Personal Development', 
  'Photography', 'Productivity', 'Religion', 'Review', 'SaaS', 'Science', 
  'Self-Improvement', 'Sports', 'Tech', 'Travel', 'Wellness', 'Yoga and Meditation'
];

export default function CategorySelection() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/signin');
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const saveCategories = async () => {
    if (!user || selectedCategories.length === 0) return;

    setLoading(true);
    try {
      const categoryData = selectedCategories.map(category => ({
        user_id: user.id,
        category
      }));

      const { error: insertError } = await supabase
        .from('user_categories')
        .insert(categoryData);

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('users')
        .update({ categories_selected: true })
        .eq('id', user.id);

      if (updateError) throw updateError;

      router.push('/');
    } catch (error) {
      console.error('Error saving categories:', error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Interests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Select categories you're interested in to personalize your feed
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Selected: {selectedCategories.length} categories
          </p>
          <button
            onClick={saveCategories}
            disabled={selectedCategories.length === 0 || loading}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}