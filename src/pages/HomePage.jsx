import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryDropdown from '../components/CountryDropdown';
import CategoryDropdown from '../components/CategoryDropdown';
import CompanyList from '../components/CompanyList';
import EmailNotificationForm from '../components/EmailNotificatonForm';
import { fetchCompanies } from '../services/api';
import { trackCompanyView } from '../utils/analytics';

const HomePage = ({ initialState, onStateChange }) => {
  const navigate = useNavigate();
  
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
  const [showNotificationForm, setShowNotificationForm] = useState(false);

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

  // Format currency for display
  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'N/A';
    
    // Convert to billions for readability
    const billion = 1000000000;
    if (Math.abs(value) >= billion) {
      return `$${(value / billion).toFixed(2)}B`;
    }
    
    // Convert to millions for smaller values
    const million = 1000000;
    if (Math.abs(value) >= million) {
      return `$${(value / million).toFixed(2)}M`;
    }
    
    return `$${value.toLocaleString()}`;
  };
  
  // Format multiple for display
  const formatMultiple = (value) => {
    if (!value && value !== 0) return 'N/A';
    return `${value}x`;
  };
  
  // Handle company click to navigate to details page
  const handleCompanyClick = (company) => {
    // Track the event using our analytics utility
    trackCompanyView({
      ...company,
      exchange: exchangeName
    });
    
    // Navigate to the company details page with the company data
    navigate(`/company/${company.ticker}`, { state: { company } });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex justify-between items-center">
        <p className="text-sm font-medium text-amber-800">Announcement: Financial data is only available for USA</p>
        <button 
          onClick={() => setShowNotificationForm(true)}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Notify for complete data
        </button>
      </div>
      
      {showNotificationForm && (
        <EmailNotificationForm onClose={() => setShowNotificationForm(false)} />
      )}
      
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
        
        {!loading && !error && selectedCountry && companies.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">
              Companies ({exchangeName}) - {companies.length} results
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company, index) => (
                <div 
                  key={`${company.ticker}-${index}`} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => handleCompanyClick(company)}
                >
                  <div className="mb-2">
                    <h3 className="text-lg font-medium text-blue-600">{company.name}</h3>
                    <div className="flex justify-between">
                      <span className="text-sm font-mono text-gray-600">{company.ticker}</span>
                      <span className="text-sm text-gray-600">{company.focus}</span>
                    </div>
                  </div>
                  
                  {company.financials && (
                    <div>
                      <div className="border-t border-gray-200 pt-2 mb-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Key Financial Metrics ({company.financials.year || 'N/A'})</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="border border-gray-200 p-1 rounded">
                            <p className="text-xs text-gray-600">Market Cap</p>
                            <p className="text-sm font-bold">{formatCurrency(company.financials.marketCap)}</p>
                          </div>
                          <div className="border border-gray-200 p-1 rounded">
                            <p className="text-xs text-gray-600">Gross Profit</p>
                            <p className="text-sm font-bold">{formatCurrency(company.financials.grossProfit)}</p>
                          </div>
                          <div className="border border-gray-200 p-1 rounded">
                            <p className="text-xs text-gray-600">Net Income</p>
                            <p className="text-sm font-bold">{formatCurrency(company.financials.netIncome)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border-t border-gray-200 pt-2">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Valuation Multiples</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="border border-gray-200 p-1 rounded">
                            <p className="text-xs text-gray-600">MCap/Net Inc</p>
                            <p className="text-sm font-bold">{formatMultiple(company.financials.marketCapToNetIncomeMultiple)}</p>
                          </div>
                          <div className="border border-gray-200 p-1 rounded">
                            <p className="text-xs text-gray-600">MCap/Gross</p>
                            <p className="text-sm font-bold">{formatMultiple(company.financials.marketCapToGrossProfitMultiple)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {!loading && !error && selectedCountry && companies.length === 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-gray-500">
            No companies found in this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;