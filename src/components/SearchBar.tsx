'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

interface SearchBarProps {
  className?: string;
  placeholder?: string;
}

export default function SearchBar({ className, placeholder = "Search..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setLoading(true);
      try {
        const searchQuery = query.trim();
        const { data, error } = await supabase
          .from('blogs')
          .select('id, title, category')
          .eq('published', true)
          .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
          .limit(20);

        if (error) {
          console.error('Search suggestions error:', error);
          setSuggestions([]);
        } else if (data) {
          // Filter to only include results that contain the search query
          const filteredData = data.filter(item => 
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          
          // Sort results to prioritize titles that start with the query
          const sortedData = filteredData.sort((a, b) => {
            const aStartsWith = a.title.toLowerCase().startsWith(searchQuery.toLowerCase());
            const bStartsWith = b.title.toLowerCase().startsWith(searchQuery.toLowerCase());
            
            if (aStartsWith && !bStartsWith) return -1;
            if (!aStartsWith && bStartsWith) return 1;
            return a.title.localeCompare(b.title);
          }).slice(0, 8);
          
          setSuggestions(sortedData);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.error('Search suggestions failed:', err);
        setSuggestions([]);
      }
      setLoading(false);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 150);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown' && suggestions.length > 0) {
      e.preventDefault();
      // Focus first suggestion (could be enhanced with keyboard navigation)
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    setQuery(suggestion.title);
    setShowSuggestions(false);
    handleSearch(suggestion.title);
  };

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} className=" text-gray-900 dark:text-white font-semibold">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div ref={searchRef} className={`relative flex items-center ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyPress}
        autoComplete="off"
        className="bg-transparent outline-none flex-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full"
      />
      <button 
        onClick={() => handleSearch()} 
        className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors ml-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg z-[60]">
          {loading ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">Searching...</div>
          ) : suggestions.length > 0 ? (
            <div className="py-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {highlightMatch(suggestion.title, query)}
                  </div>
                  {suggestion.category && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.category}</div>
                  )}
                </button>
              ))}
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
}