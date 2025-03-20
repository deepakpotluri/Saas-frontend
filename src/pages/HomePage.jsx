import React, { useState, useEffect, useCallback } from 'react';
import CountryDropdown from '../components/CountryDropdown';
import CategoryDropdown from '../components/CategoryDropdown';
import CompanyList from '../components/CompanyList';
import { fetchCompanies } from '../services/api';

const HomePage = ({ initialState, onStateChange }) => {
  // Initialize state with empty values by default
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [exchangeName, setExchangeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stateChanged, setStateChanged] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Extract exchange from name function
  const extractExchangeFromName = useCallback((countryName) => {
    const match = countryName.match(/\((.*?)\)/);
    return match ? match[1] : 'Unknown Exchange';
  }, []);

  // Load companies function
  const loadCompanies = useCallback(async (country, category) => {
    if (!country) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchCompanies(
        country, 
        category !== 'All' ? category : null
      );
      
      if (data && data.companies) {
        setCompanies(data.companies);
        setStateChanged(true);
      } else {
        setCompanies([]);
        setError('Failed to load companies: Invalid data format');
      }
    } catch (err) {
      setError('Failed to load companies data');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize from saved state only once
  useEffect(() => {
    if (initialState && !hasInitialized) {
      if (initialState.selectedCountry) {
        setSelectedCountry(initialState.selectedCountry);
        setShowCategoryDropdown(initialState.selectedCountry.includes('United States'));
      }
      if (initialState.selectedCategory) {
        setSelectedCategory(initialState.selectedCategory);
      }
      if (initialState.companies) {
        setCompanies(initialState.companies);
      }
      if (initialState.exchangeName) {
        setExchangeName(initialState.exchangeName);
      }
      setHasInitialized(true);
    }
  }, [initialState, hasInitialized]);

  // When country changes
  useEffect(() => {
    if (!selectedCountry) {
      setCompanies([]);
      setExchangeName('');
      setShowCategoryDropdown(false);
      return;
    }

    const isUSA = selectedCountry.includes('United States');
    setShowCategoryDropdown(isUSA);
    
    if (!isUSA) {
      setSelectedCategory('All');
    }
    
    const extractedExchange = extractExchangeFromName(selectedCountry);
    setExchangeName(extractedExchange);
    
    loadCompanies(selectedCountry, selectedCategory);
  }, [selectedCountry, extractExchangeFromName, loadCompanies, selectedCategory]);

  // When category changes (only applies for US)
  useEffect(() => {
    const isUSA = selectedCountry && selectedCountry.includes('United States');
    if (isUSA && selectedCategory) {
      loadCompanies(selectedCountry, selectedCategory);
    }
  }, [selectedCategory, selectedCountry, loadCompanies]);

  // Save state changes for persistence but avoid infinite loops
  useEffect(() => {
    if (onStateChange && selectedCountry && stateChanged) {
      onStateChange({
        selectedCountry,
        selectedCategory,
        companies,
        exchangeName
      });
      setStateChanged(false);
    }
  }, [selectedCountry, selectedCategory, companies, exchangeName, onStateChange, stateChanged]);

  const handleCountrySelect = (country) => {
    if (country !== selectedCountry) {
      setSelectedCountry(country);
      setStateChanged(true);
    }
  };

  const handleCategorySelect = (category) => {
    if (category !== selectedCategory) {
      setSelectedCategory(category);
      setStateChanged(true);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">SaaS Multiples</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-64">
            <CountryDropdown 
              onCountrySelect={handleCountrySelect} 
              initialValue={selectedCountry} 
            />
          </div>
          
          {showCategoryDropdown && (
            <div className="w-64">
              <CategoryDropdown 
                onCategorySelect={handleCategorySelect} 
                initialValue={selectedCategory} 
              />
            </div>
          )}
        </div>
        
        {loading && (
          <div className="mt-6 flex items-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-solid border-blue-500 border-r-transparent"></div>
            <span className="ml-2 text-sm">Loading...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {!loading && !error && selectedCountry && (
          <CompanyList 
            companies={companies}
            exchangeName={exchangeName}
          />
        )}
      </div>
    </div>
  );
};

export default HomePage;