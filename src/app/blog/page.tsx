'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import Navbar from '../../components/Navbar';

export default function BlogPage() {
  const [isSaved, setIsSaved] = useState(false);
  const [blog, setBlog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      // Fetch latest blog
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setBlog(data);
        
        // Check if blog is already saved by current user
        if (session?.user) {
          const { data: savedData } = await supabase
            .from('saved_blogs')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('blog_id', data.id)
            .single();
          
          setIsSaved(!!savedData);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!user) {
      alert('Please sign in to save blogs');
      return;
    }

    if (!blog) return;

    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_blogs')
          .delete()
          .eq('user_id', user.id)
          .eq('blog_id', blog.id);

        if (!error) {
          setIsSaved(false);
        }
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_blogs')
          .insert({
            user_id: user.id,
            blog_id: blog.id
          });

        if (!error) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      alert('Failed to save blog. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center">Loading blog...</div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Navbar />
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">No blog found</div>
            <a href="/" className="text-blue-600 hover:text-blue-500">Go back to homepage</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6 py-12 relative">
        {/* Action buttons - desktop: top right, mobile: below title */}
        <div className="hidden md:flex absolute top-12 right-6 gap-2">
          <button 
            onClick={() => navigator.share ? navigator.share({title: blog.title, url: window.location.href}) : navigator.clipboard.writeText(window.location.href)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
          <button 
            onClick={handleSave}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg 
              className={`w-6 h-6 ${isSaved ? 'text-grey-700 fill-current' : 'text-gray-500 dark:text-gray-400'}`} 
              fill={isSaved ? 'currentColor' : 'none'} 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
        </div>

        <article className="prose prose-lg max-w-none dark:prose-invert">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {blog.title}
            </h1>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-400 text-sm">
              <div className="flex items-center">
                <time>{formatDate(blog.created_at)}</time>
                <span className="mx-2">•</span>
                <span>{Math.ceil(blog.content.length / 1000)} min read</span>
              </div>
              {/* Mobile action buttons */}
              <div className="flex md:hidden gap-2">
                <button 
                  onClick={() => navigator.share ? navigator.share({title: blog.title, url: window.location.href}) : navigator.clipboard.writeText(window.location.href)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button 
                  onClick={handleSave}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg 
                    className={`w-5 h-5 ${isSaved ? 'text-grey-700 fill-current' : 'text-gray-500 dark:text-gray-400'}`} 
                    fill={isSaved ? 'currentColor' : 'none'} 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          <div className="text-gray-800 dark:text-gray-200 leading-relaxed space-y-6">
            {blog.content.split('\n').map((paragraph: string, index: number) => (
              paragraph.trim() && (
                <p key={index}>
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}