'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import Navbar from '../../components/Navbar';
import CategoriesBar from '../../components/CategoriesBar';

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const searchQuery = query.trim();
        let supabaseQuery = supabase
          .from('blogs')
          .select('*')
          .eq('published', true);

        // Only filter by category if the column exists and category is not 'All'
        if (selectedCategory !== 'All') {
          try {
            supabaseQuery = supabaseQuery.eq('category', selectedCategory);
          } catch (err) {
            // If category column doesn't exist, ignore the filter
            console.warn('Category column not found, ignoring category filter');
          }
        }

        const { data, error } = await supabaseQuery.order('created_at', { ascending: false });

        if (error) {
          console.error('Search error:', error);
          setResults([]);
        } else if (data) {
          // Filter to only include results that contain the exact search query in title only
          const filteredData = data.filter(item => {
            const title = (item.title || '').toLowerCase();
            const search = searchQuery.toLowerCase();
            
            return title.includes(search);
          });
          
          // Sort results to prioritize titles that start with the query
          const sortedData = filteredData.sort((a, b) => {
            const aStartsWith = a.title.toLowerCase().startsWith(searchQuery.toLowerCase());
            const bStartsWith = b.title.toLowerCase().startsWith(searchQuery.toLowerCase());
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
          
          setResults(sortedData);
        }


      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      }
      setLoading(false);
    };

    fetchResults();
  }, [query, selectedCategory]);

  if (loading) {
    return (
      <>
        <Navbar />
        <CategoriesBar selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center">Searching...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <CategoriesBar selectedCategory={selectedCategory} onCategorySelect={setSelectedCategory} />
      <div className="max-w-6xl mx-auto p-6 text-gray-900 dark:text-white">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
            Search Results
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
          </p>
        </header>

        <main>
          {results.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 dark:text-gray-400 mb-4">
                No results found for "{query}"
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              </div>
              <div className="space-y-2">
                <p className="text-gray-600 dark:text-gray-400">Try:</p>
                <ul className="text-sm text-gray-500 dark:text-gray-500">
                  <li>• Different keywords</li>
                  <li>• More general terms</li>
                  <li>• Checking spelling</li>
                  <li>• Selecting "All" categories</li>
                </ul>
              </div>
              <a href="/" className="inline-block mt-4 text-blue-600 hover:text-blue-500">
                Browse all blogs
              </a>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((post) => (
                <article key={post.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                  <a href={`/blog?id=${post.id}`} className="block">
                    <h2 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors">
                      {post.title}
                    </h2>
                  </a>
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-full">
                        {post.category}
                      </span>
                    )}
                    <time className="text-sm text-gray-500 dark:text-gray-500">
                      {formatDate(post.created_at)}
                    </time>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    {post.content ? post.content.substring(0, 200) + '...' : 'No content available'}
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