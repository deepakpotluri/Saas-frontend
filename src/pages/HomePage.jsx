import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryDropdown from '../components/CountryDropdown';
import CategoryDropdown from '../components/CategoryDropdown';
import CompanyList from '../components/CompanyList';
import EmailNotificationForm from '../components/EmailNotificatonForm';
import { fetchCompanies, fetchCompanyFinancials } from '../services/api';
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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'

  // Extract exchange from name function
  const extractExchangeFromName = useCallback((countryName) => {
    const match = countryName.match(/\((.*?)\)/);
    return match ? match[1] : 'Unknown Exchange';
  }, []);

  // Calculate growth rates from income statements
  const calculateGrowthRates = (incomeStatements) => {
    if (!incomeStatements || incomeStatements.length < 2) {
      return {
        revenueGrowth: null,
        grossProfitGrowth: null,
        netIncomeGrowth: null
      };
    }
    
    // Sort statements by date (ascending)
    const sortedStatements = [...incomeStatements].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    
    // Get the latest two years for comparison
    const latestYear = sortedStatements[sortedStatements.length - 1];
    const previousYear = sortedStatements[sortedStatements.length - 2];
    
    // Calculate YoY growth rates
    let revenueGrowth = null;
    if (previousYear.revenue && previousYear.revenue !== 0) {
      revenueGrowth = ((latestYear.revenue - previousYear.revenue) / Math.abs(previousYear.revenue) * 100).toFixed(1);
    }
    
    let grossProfitGrowth = null;
    if (previousYear.grossProfit && previousYear.grossProfit !== 0) {
      grossProfitGrowth = ((latestYear.grossProfit - previousYear.grossProfit) / Math.abs(previousYear.grossProfit) * 100).toFixed(1);
    }
    
    let netIncomeGrowth = null;
    if (previousYear.netIncome && previousYear.netIncome !== 0) {
      netIncomeGrowth = ((latestYear.netIncome - previousYear.netIncome) / Math.abs(previousYear.netIncome) * 100).toFixed(1);
    }
    
    return {
      revenueGrowth,
      grossProfitGrowth,
      netIncomeGrowth
    };
  };

  // Process financial data for a company
  const processFinancialData = async (company) => {
    try {
      const financialData = await fetchCompanyFinancials(company.ticker);
      
      if (financialData && financialData.income_statement && financialData.income_statement.length > 0) {
        // Sort income statements by date (descending)
        const sortedStatements = [...financialData.income_statement].sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        
        // Get the latest income statement for revenue and other data
        const latestStatement = sortedStatements[0];
        
        // Calculate growth rates if we have more than one statement
        let growthRates = {
          revenueGrowth: null,
          grossProfitGrowth: null,
          netIncomeGrowth: null
        };
        
        if (sortedStatements.length > 1) {
          growthRates = calculateGrowthRates(financialData.income_statement);
        }
        
        // Update company financials with revenue and growth rates
        return {
          ...company,
          financials: {
            ...company.financials,
            revenue: latestStatement.revenue,
            grossProfit: latestStatement.grossProfit,
            netIncome: latestStatement.netIncome,
            revenueGrowth: growthRates.revenueGrowth,
            grossProfitGrowth: growthRates.grossProfitGrowth,
            netIncomeGrowth: growthRates.netIncomeGrowth,
            year: latestStatement.calendarYear
          }
        };
      }
      
      return company;
    } catch (error) {
      console.error(`Error fetching financial data for ${company.ticker}:`, error);
      return company;
    }
  };

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
        // Set companies initially
        setCompanies(data.companies);
        setStateChanged(true);
        
        // Only process detailed financials for US companies
        if (country.includes('United States')) {
          // Process each company to get growth data
          const enhancedCompanies = [];
          
          for (const company of data.companies) {
            const enhancedCompany = await processFinancialData(company);
            enhancedCompanies.push(enhancedCompany);
            
            // Update the companies state incrementally as each company is processed
            setCompanies(prevCompanies => {
              const updatedCompanies = [...prevCompanies];
              const index = updatedCompanies.findIndex(c => c.ticker === enhancedCompany.ticker);
              if (index !== -1) {
                updatedCompanies[index] = enhancedCompany;
              }
              return updatedCompanies;
            });
          }
        }
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
      if (initialState.viewMode) {
        setViewMode(initialState.viewMode);
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
        exchangeName,
        viewMode
      });
      setStateChanged(false);
    }
  }, [selectedCountry, selectedCategory, companies, exchangeName, viewMode, onStateChange, stateChanged]);

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

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setStateChanged(true);
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
  
  // Format growth rate for display
  const formatGrowthRate = (value) => {
    // Check if value is null, undefined, or NaN
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
      return 'N/A';
    }
    
    const numericValue = parseFloat(value);
    const prefix = numericValue > 0 ? '+' : '';
    
    return `${prefix}${numericValue}%`;
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

  // Render table view
  const renderTableView = () => {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focus</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Growth</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit Growth</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income Growth</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap/Gross Profit</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap/Net Income</th>
              <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr 
                key={`${company.ticker}-${index}`} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                onClick={() => handleCompanyClick(company)}
              >
                <td className="py-3 px-4 border-b border-gray-200">
                  <div className="font-medium text-blue-600 hover:underline">{company.name}</div>
                </td>
                <td className="py-3 px-4 border-b border-gray-200 font-mono">{company.ticker}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">{company.focus}</td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {company.financials ? formatCurrency(company.financials.marketCap) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {formatCurrency(
                    // Access revenue from company.financials which should now have it from detailed fetch
                    company.financials && company.financials.revenue
                  )}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {company.financials && company.financials.revenueGrowth ? formatGrowthRate(company.financials.revenueGrowth) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatCurrency(company.financials.grossProfit) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {company.financials && company.financials.grossProfitGrowth ? formatGrowthRate(company.financials.grossProfitGrowth) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatCurrency(company.financials.netIncome) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {company.financials && company.financials.netIncomeGrowth ? formatGrowthRate(company.financials.netIncomeGrowth) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatMultiple(company.financials.marketCapToGrossProfitMultiple) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatMultiple(company.financials.marketCapToNetIncomeMultiple) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? company.financials.year : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Render card view (existing view)
  const renderCardView = () => {
    return (
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
                  <div className="grid grid-cols-4 gap-2">
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Market Cap</p>
                      <p className="text-sm font-bold">{formatCurrency(company.financials.marketCap)}</p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="text-sm font-bold">{formatCurrency(company.financials.revenue)}</p>
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
                
                {/* Growth Summary Section */}
                <div className="border-t border-gray-200 pt-2 mb-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Growth Summary</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Revenue</p>
                      <p className="text-sm font-bold">
                        {company.financials && company.financials.revenueGrowth 
                          ? (parseFloat(company.financials.revenueGrowth) > 0 ? '+' : '') + company.financials.revenueGrowth + '%'
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Gross</p>
                      <p className="text-sm font-bold">
                        {company.financials && company.financials.grossProfitGrowth 
                          ? (parseFloat(company.financials.grossProfitGrowth) > 0 ? '+' : '') + company.financials.grossProfitGrowth + '%'
                          : 'N/A'}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Net Inc</p>
                      <p className="text-sm font-bold">
                        {company.financials && company.financials.netIncomeGrowth 
                          ? (parseFloat(company.financials.netIncomeGrowth) > 0 ? '+' : '') + company.financials.netIncomeGrowth + '%'
                          : 'N/A'}
                      </p>
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
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
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
        <div className="flex flex-wrap justify-between items-center mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-0">
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
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              onClick={() => handleViewModeChange('table')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('cards')}
              className={`px-4 py-2 text-sm font-medium ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } border border-gray-300 border-l-0 rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
            >
              Card View
            </button>
          </div>
        </div>
        
        {loading && (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
            <span className="ml-3 text-sm font-medium">Loading companies...</span>
          </div>
        )}
        
        {error && (
          <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        
        {!loading && !error && selectedCountry && companies.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Companies ({exchangeName}) - {companies.length} results
              </h2>
              
              <div className="text-sm text-gray-500">
                Click on a company to view detailed financial information
                <div className="text-sm text-black">
                The below Data is updated on 04-04-2025
              
              </div>
              </div>
              
            </div>
            
            {viewMode === 'table' ? renderTableView() : renderCardView()}
          </div>
        )}
        
        {!loading && !error && selectedCountry && companies.length === 0 && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-gray-500 text-center">
            No companies found in this selection.
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;