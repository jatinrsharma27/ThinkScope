'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';

const CATEGORIES = [
  'Art', 'Automotive', 'Beauty', 'Book and Writing', 'Business', 'DIY', 'Education', 
  'Entertainment', 'Fashion', 'Finance', 'Food and Recipe', 'Gaming', 'Green Living', 
  'Health', 'History', 'Home Décor', 'Interior Design', 'Internet Services', 
  'Love and Relationships', 'Marketing', 'Mental Health', 'Minimalism', 'Money-Saving', 
  'Music', 'Nature', 'News and Current Affairs', 'Parenting', 'Personal', 'Personal Development', 
  'Photography', 'Productivity', 'Religion', 'Review', 'SaaS', 'Science', 
  'Self-Improvement', 'Sports', 'Tech', 'Travel', 'Wellness', 'Yoga and Meditation'
];

export default function Settings() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState('system');
  const [activeTab, setActiveTab] = useState('theme');
  const router = useRouter();

  useEffect(() => {
    const loadUserCategories = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth/signin');
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from('user_categories')
        .select('category')
        .eq('user_id', session.user.id);

      if (data) {
        setSelectedCategories(data.map(item => item.category));
      }
      
      const savedTheme = localStorage.getItem('theme-preference') || 'system';
      setTheme(savedTheme);
    };
    loadUserCategories();
  }, [router]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const saveCategories = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await supabase
        .from('user_categories')
        .delete()
        .eq('user_id', user.id);

      if (selectedCategories.length > 0) {
        const categoryData = selectedCategories.map(category => ({
          user_id: user.id,
          category
        }));

        const { error } = await supabase
          .from('user_categories')
          .insert(categoryData);

        if (error) throw error;
      }

      router.push('/');
    } catch (error) {
      console.error('Error saving categories:', error);
    }
    setLoading(false);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.removeItem('theme');
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    window.dispatchEvent(new Event('theme-changed'));
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Customize your preferences
            </p>
          </div>

          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
            <button
              onClick={() => setActiveTab('theme')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'theme'
                  ? 'border-gray-600 text-gray-800 dark:text-gray-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Theme
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-gray-600 text-gray-800 dark:text-gray-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Categories
            </button>
          </div>

          {activeTab === 'theme' && (
            <div className="mb-8">
              <div className="flex gap-4">
                {[{value: 'light', label: 'Light'}, {value: 'dark', label: 'Dark'}, {value: 'system', label: 'System'}].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`px-6 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      theme === option.value
                        ? 'bg-gray-900 text-white border-gray-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-gray-900 text-white border-gray-600'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
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
                  disabled={loading}
                  className="px-8 py-3 bg-gray-900 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}