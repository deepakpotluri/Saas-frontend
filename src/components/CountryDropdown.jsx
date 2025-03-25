import React, { useState, useEffect } from 'react';
import { fetchCountries } from '../services/api';
import { trackCountryFilter } from '../utils/analytics'; // Import the analytics utility

const CountryDropdown = ({ onCountrySelect, initialValue = '' }) => {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  
  // Fetch countries on component mount
  useEffect(() => {
    const getCountries = async () => {
      try {
        setLoading(true);
        const data = await fetchCountries();
        
        if (Array.isArray(data)) {
          setCountries(data);
          setError(null);
        } else {
          setError('Failed to load countries: Invalid data format');
        }
      } catch (err) {
        setError('Failed to load countries');
      } finally {
        setLoading(false);
      }
    };
    
    getCountries();
  }, []);
  
  // Update selected country when initialValue changes
  useEffect(() => {
    setSelectedCountry(initialValue || '');
  }, [initialValue]);
  
  const handleChange = (e) => {
    const country = e.target.value;
    setSelectedCountry(country);
    
    // Track the country selection in Google Analytics
    if (country) {
      trackCountryFilter(country);
    }
    
    onCountrySelect(country);
  };
  
  if (loading) {
    return (
      <div className="w-full h-8 bg-gray-100 rounded animate-pulse">
        <p className="sr-only">Loading countries...</p>
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
        Country
      </label>
      <select
        value={selectedCountry}
        onChange={handleChange}
        className="block w-full px-3 py-1.5 text-sm leading-tight bg-white border border-gray-300 rounded appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="">Select a country</option>
        {countries.map((country, index) => (
          <option key={index} value={country}>
            {country}
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

export default CountryDropdown;