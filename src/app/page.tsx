'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../lib/utils';
import Navbar from "../components/Navbar";
import CategoriesBar from "../components/CategoriesBar";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchBlogs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase
        .from('blogs')
        .select('*')
        .eq('published', true);
      
      if (selectedCategory !== 'All') {
        query = query.eq('category', selectedCategory);
      } else if (session?.user) {
        // If user is logged in and 'All' is selected, show only their preferred categories
        const { data: userCategories } = await supabase
          .from('user_categories')
          .select('category')
          .eq('user_id', session.user.id);
        
        if (userCategories && userCategories.length > 0) {
          const categories = userCategories.map(item => item.category);
          query = query.in('category', categories);
        }
      }
      
      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchBlogs();
  }, [selectedCategory]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-pulse space-y-4 w-full max-w-2xl">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-30 mb-2"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CategoriesBar 
        selectedCategory={selectedCategory} 
        onCategorySelect={setSelectedCategory} 
      />
      <div className="max-w-6xl mx-auto p-6 text-gray-900 dark:text-white">

        <main>
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">No blogs published yet</div>
              <p className="text-gray-600 dark:text-gray-400">Check back later for new content!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <article key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <time className="text-sm text-gray-500 dark:text-gray-500">
                    {formatDate(post.created_at)}
                  </time>
                  <a href="/blog" className="block">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-100 cursor-pointer transition-colors">{post.title}</h2>
                  </a>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {post.content ? post.content.substring(0, 150) + '...' : 'No content available'}
                  </p>

                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}
