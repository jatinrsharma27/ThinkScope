'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import Navbar from '../../components/Navbar';

export default function SavedBlogs() {
  const [savedBlogs, setSavedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user and fetch saved blogs
    const fetchSavedBlogs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // Fetch saved blogs with blog details
        const { data, error } = await supabase
          .from('saved_blogs')
          .select(`
            id,
            created_at,
            blogs (
              id,
              title,
              content,
              created_at
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSavedBlogs(data);
        }
      }
      setLoading(false);
    };

    fetchSavedBlogs();
  }, []);

  const removeSavedBlog = async (savedBlogId: string) => {
    const { error } = await supabase
      .from('saved_blogs')
      .delete()
      .eq('id', savedBlogId);

    if (!error) {
      setSavedBlogs(savedBlogs.filter(item => item.id !== savedBlogId));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">Loading saved blogs...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6 text-gray-900 dark:text-white">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Saved Blogs</h1>
          <p className="text-gray-600 dark:text-gray-400">Your bookmarked articles</p>
        </header>

        <main>
          {savedBlogs.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">No saved blogs yet</div>
              <a href="/" className="text-gray-600 hover:text-gray-500">
                Browse blogs to save some
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {savedBlogs.map(item => (
                <article key={item.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <a href="/blog" className="block">
                        <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer transition-colors">
                          {item.blogs?.title || 'Untitled'}
                        </h2>
                      </a>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {item.blogs?.content ? item.blogs.content.substring(0, 150) + '...' : 'No content available'}
                      </p>
                      <time className="text-sm text-gray-500 dark:text-gray-500">
                        Saved on {formatDate(item.created_at)}
                      </time>
                    </div>
                    
                    <button
                      onClick={() => removeSavedBlog(item.id)}
                      className="ml-4 p-5 text-red-500 hover:text-red-700 transition-colors"
                      title="Remove from saved"
                    >
                      <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                      </svg>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}