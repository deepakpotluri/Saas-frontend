import React, { useState, useEffect } from 'react';
import { fetchUSACategories } from '../services/api';
import { trackCategoryFilter } from '../utils/analytics'; // Import the analytics utility

const CategoryDropdown = ({ onCategorySelect, initialValue = 'All' }) => {
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(initialValue);
  
  useEffect(() => {
    const getCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchUSACategories();
        
        if (Array.isArray(data)) {
          setCategories(['All', ...data]);
          setError(null);
        } else {
          console.error('Invalid data format for categories:', data);
          setError('Failed to load categories: Invalid data format');
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    
    getCategories();
  }, []);
  
  // Update selected category when initialValue changes
  useEffect(() => {
    if (initialValue && initialValue !== selectedCategory) {
      setSelectedCategory(initialValue);
    }
  }, [initialValue]);
  
  const handleChange = (e) => {
    const category = e.target.value;
    setSelectedCategory(category);
    
    // Track the category selection in Google Analytics
    trackCategoryFilter(category);
    
    onCategorySelect(category);
  };
  
  if (loading) {
    return (
      <div className="w-full h-8 bg-gray-100 rounded animate-pulse">
        <p className="sr-only">Loading categories...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 text-xs p-2 border border-red-200 rounded bg-red-50">
        {error}
      </div>
    );
  }
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category
      </label>
      <select
        value={selectedCategory}
        onChange={handleChange}
        className="block w-full px-3 py-1.5 text-sm leading-tight bg-white border border-gray-300 rounded appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      >
        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </select>
      <div className="absolute bottom-0 right-0 flex items-center px-2 pointer-events-none h-8">
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  );
};

export default CategoryDropdown;