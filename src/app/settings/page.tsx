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
  const [activeTab, setActiveTab] = useState('categories');
  const [deleteLoading, setDeleteLoading] = useState(false);
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

  const deleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data.'
    );
    
    if (!confirmed) return;
    
    setDeleteLoading(true);
    try {
      await supabase.from('user_categories').delete().eq('user_id', user.id);
      await supabase.from('saved_blogs').delete().eq('user_id', user.id);
      await supabase.from('users').delete().eq('id', user.id);
      
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    }
    setDeleteLoading(false);
  };



  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-4">
              Settings
            </h1>
            <p className="text-gray-600">
              Manage your account and preferences
            </p>
          </div>

          <div className="flex border-b border-gray-200 mb-8">
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-gray-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'account'
                  ? 'border-gray-600 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Manage Account
            </button>
          </div>

          {activeTab === 'categories' && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-colors ${
                      selectedCategories.includes(category)
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-black border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Selected: {selectedCategories.length} categories
                </p>
                <button
                  onClick={saveCategories}
                  disabled={loading}
                  className="px-8 py-3 bg-gray-800 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="mb-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Danger Zone</h3>
                <p className="text-red-700 mb-4">
                  Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
                </p>
                <button
                  onClick={deleteAccount}
                  disabled={deleteLoading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account Permanently'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}