'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const categories = [
  'Art', 'Automotive', 'Beauty', 'Book and Writing', 'Business', 'DIY', 'Education', 
  'Entertainment', 'Fashion', 'Finance', 'Food and Recipe', 'Gaming', 'Green Living', 
  'Health', 'History', 'Home Décor', 'Interior Design', 'Internet Services', 
  'Love and Relationships', 'Marketing', 'Mental Health', 'Minimalism', 'Money-Saving', 
  'Music', 'Nature','News and Current Affairs', 'Parenting', 'Personal', 'Personal Development', 
  'Photography', 'Productivity', 'Religion', 'Review', 'SaaS', 'Science', 
  'Self-Improvement', 'Sports', 'Tech', 'Travel', 'Wellness', 'Yoga and Meditation'
];

export default function AdminPanel() {
  const [title, setTitle] = useState('');
  const [blog, setBlog] = useState('');
  const [category, setCategory] = useState('Tech');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get current user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  const handlePublish = async () => {
    if (!title.trim() || !blog.trim()) {
      alert('Please fill in both title and blog content');
      return;
    }

    if (!user) {
      alert('Please sign in to publish blogs');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('blogs')
      .insert([
        {
          title: title.trim(),
          content: blog.trim(),
          category: category,
          author_id: user.id,
          published: true
        }
      ]);

    setLoading(false);

    if (error) {
      console.error('Error publishing blog:', error);
      console.error('Error details:', error.message, error.details, error.hint);
      alert(`Failed to publish blog: ${error.message}`);
    } else {
      alert('Blog published successfully!');
      setTitle('');
      setBlog('');
      setCategory('Tech');
    }
  };

  return (
    <div className="min-h-screen bg-white ">
      
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Admin Panel
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 ">
          <form onSubmit={(e) => { e.preventDefault(); handlePublish(); }} className="space-y-6">
            {/* Title Input */}
                    <h1 className="text-4xl font-bold text-gray-900 text-center">
           Blog Post
        </h1>
            <div>
              <label htmlFor="title" className="block text-xl font-bold text-black mb-2">
                Blog Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter your blog title..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block text-xl font-bold text-black mb-2">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 transition-colors"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Blog Content Textarea */}
            <div>
              <label htmlFor="blog" className="block text-xl font-bold text-black mb-2">
                Blog Content
              </label>
              <textarea
                id="blog"
                value={blog}
                onChange={(e) => setBlog(e.target.value)}
                placeholder="Write your blog content here..."
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-white focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-colors"
              />
            </div>

            {/* Publish Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-black text-white font-medium rounded-lg transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Publishing...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}