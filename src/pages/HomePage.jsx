import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CountryDropdown from '../components/CountryDropdown';
import CategoryDropdown from '../components/CategoryDropdown';
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
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [columnWidths, setColumnWidths] = useState({
    col1: 200, // company name
    col2: 100, // ticker
    col3: 150  // focus
  });

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
      
      // Fetch the company list along with financial data from API
      const data = await fetchCompanies(
        country, 
        category !== 'All' ? category : null
      );
      
      if (!data || !data.companies) {
        setCompanies([]);
        setError('Failed to load companies: Invalid data format');
        setLoading(false);
        return;
      }
      
      // Process the companies data to ensure the financial structure matches CompanyDetailsPage
      const processedCompanies = data.companies.map(company => {
        // Skip processing if financials is missing completely
        if (!company.financials) return company;
        
        // Extract financial data exactly like in CompanyDetailsPage
        const financialsData = company.financials;
        
        // Extract revenue, profit and income directly from the data - match CompanyDetailsPage exactly
        const revenue = financialsData.raw_values?.current_revenue || financialsData.current_revenue || financialsData.revenue;
        const grossProfit = financialsData.raw_values?.current_grossProfit || financialsData.current_grossProfit || financialsData.grossProfit;
        const netIncome = financialsData.raw_values?.current_netIncome || financialsData.current_netIncome || financialsData.netIncome;
        const marketCap = financialsData.market_cap || financialsData.marketCap;
        
        // Create a new financials object with the exact same structure as CompanyDetailsPage
        const standardizedFinancials = {
          marketCap: marketCap,
          revenue: revenue,
          revenueGrowth: financialsData.growth_metrics?.revenue_growth_pct?.toFixed(1) || financialsData.revenueGrowth,
          netIncome: netIncome,
          netIncomeGrowth: financialsData.growth_metrics?.net_income_growth_pct?.toFixed(1) || financialsData.netIncomeGrowth,
          grossProfit: grossProfit,
          grossProfitGrowth: financialsData.growth_metrics?.gross_profit_growth_pct?.toFixed(1) || financialsData.grossProfitGrowth,
          marketCapToRevenueMultiple: financialsData.valuation_multiples_raw?.marketcap_to_revenue?.toFixed(2) || financialsData.marketCapToRevenueMultiple,
          marketCapToNetIncomeMultiple: financialsData.valuation_multiples_raw?.marketcap_to_netincome?.toFixed(2) || financialsData.marketCapToNetIncomeMultiple,
          marketCapToGrossProfitMultiple: financialsData.valuation_multiples_raw?.marketcap_to_grossprofit?.toFixed(2) || financialsData.marketCapToGrossProfitMultiple,
          year: financialsData.latest_fiscal_year || financialsData.year
        };
        
        // Return the company with standardized financials
        return {
          ...company,
          financials: standardizedFinancials
        };
      });
      
      // Log to troubleshoot financial data
      console.log('Processed companies:', processedCompanies);
      
      // Set the processed companies
      setCompanies(processedCompanies);
      setLoading(false);
      setStateChanged(true);
      
    } catch (err) {
      console.error('Error in loadCompanies:', err);
      setError('Failed to load companies data');
      setCompanies([]);
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
    if (value === null || value === undefined || value === '') return 'N/A';
    
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
    if (value === null || value === undefined || value === '') return 'N/A';
    return `${value}x`;
  };
  
  // Format growth rate for display
  const formatGrowthRate = (value) => {
    // Check if value is null, undefined, or NaN
    if (value === null || value === undefined || value === '' || isNaN(parseFloat(value))) {
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

  // Render table view with fixed first three columns
  const renderTableView = () => {
    // CSS for the table with fixed columns
    const tableStyle = `
      .fixed-table-container {
        width: 100%;
        overflow-x: auto;
      }
      
      .fixed-table {
        width: max-content;
        border-collapse: separate;
        border-spacing: 0;
      }
      
      .fixed-table th:nth-child(-n+3),
      .fixed-table td:nth-child(-n+3) {
        position: sticky;
        z-index: 1;
      }
      
      /* Set explicit left positions for each fixed column */
      .fixed-table th:nth-child(1),
      .fixed-table td:nth-child(1) {
        left: 0;
      }
      
      .fixed-table th:nth-child(2),
      .fixed-table td:nth-child(2) {
        left: ${columnWidths.col1}px;
      }
      
      .fixed-table th:nth-child(3),
      .fixed-table td:nth-child(3) {
        left: ${columnWidths.col1 + columnWidths.col2}px;
      }
      
      /* Background colors for fixed columns */
      .fixed-table thead th:nth-child(-n+3) {
        background-color: #f9fafb; /* bg-gray-50 equivalent */
        z-index: 2; /* Higher z-index for header cells */
      }
      
      .fixed-table tbody tr:nth-child(odd) td:nth-child(-n+3) {
        background-color: white;
      }
      
      .fixed-table tbody tr:nth-child(even) td:nth-child(-n+3) {
        background-color: #f9fafb; /* bg-gray-50 equivalent */
      }
      
      /* Hover state for fixed columns */
      .fixed-table tbody tr:hover td:nth-child(-n+3) {
        background-color: #ebf5ff; /* hover:bg-blue-50 equivalent */
      }
      
      /* Add a shadow to the last fixed column */
      .fixed-table th:nth-child(3),
      .fixed-table td:nth-child(3) {
        box-shadow: 4px 0 6px -2px rgba(0,0,0,0.1);
      }
      
      /* Ensure borders look right with separate cells */
      .fixed-table th, 
      .fixed-table td {
        border-bottom: 1px solid #e5e7eb; /* border-gray-200 */
        border-right: 1px solid #e5e7eb;
      }
      
      .fixed-table th:last-child,
      .fixed-table td:last-child {
        border-right: none;
      }
      
      /* Fixed width for columns */
      .fixed-table th:nth-child(1),
      .fixed-table td:nth-child(1) {
        width: ${columnWidths.col1}px;
        min-width: ${columnWidths.col1}px;
        max-width: ${columnWidths.col1}px;
      }
      
      .fixed-table th:nth-child(2),
      .fixed-table td:nth-child(2) {
        width: ${columnWidths.col2}px;
        min-width: ${columnWidths.col2}px;
        max-width: ${columnWidths.col2}px;
      }
      
      .fixed-table th:nth-child(3),
      .fixed-table td:nth-child(3) {
        width: ${columnWidths.col3}px;
        min-width: ${columnWidths.col3}px;
        max-width: ${columnWidths.col3}px;
      }
    `;
    
    return (
      <>
        <style>{tableStyle}</style>
        <div className="fixed-table-container">
          <table className="fixed-table bg-white border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticker</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Focus</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Growth</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit Growth</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income Growth</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap/Revenue</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap/Gross Profit</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap/Net Income</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((company, index) => (
                <tr 
                  key={`${company.ticker}-${index}`} 
                  className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 cursor-pointer`}
                  onClick={() => handleCompanyClick(company)}
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-blue-600 hover:underline">{company.name}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">{company.ticker}</td>
                  <td className="py-3 px-4 text-sm">{company.focus}</td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatCurrency(company.financials?.marketCap)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatCurrency(company.financials?.revenue)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatGrowthRate(company.financials?.revenueGrowth)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatCurrency(company.financials?.grossProfit)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatGrowthRate(company.financials?.grossProfitGrowth)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatCurrency(company.financials?.netIncome)}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {formatGrowthRate(company.financials?.netIncomeGrowth)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatMultiple(company.financials?.marketCapToRevenueMultiple)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatMultiple(company.financials?.marketCapToGrossProfitMultiple)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {formatMultiple(company.financials?.marketCapToNetIncomeMultiple)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {company.financials?.year || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  // Render card view
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
                        {formatGrowthRate(company.financials.revenueGrowth)}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Gross</p>
                      <p className="text-sm font-bold">
                        {formatGrowthRate(company.financials.grossProfitGrowth)}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">Net Inc</p>
                      <p className="text-sm font-bold">
                        {formatGrowthRate(company.financials.netIncomeGrowth)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Valuation Multiples</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">MCap/Rev</p>
                      <p className="text-sm font-bold">
                        {formatMultiple(company.financials.marketCapToRevenueMultiple)}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">MCap/Gross</p>
                      <p className="text-sm font-bold">
                        {formatMultiple(company.financials.marketCapToGrossProfitMultiple)}
                      </p>
                    </div>
                    <div className="border border-gray-200 p-1 rounded">
                      <p className="text-xs text-gray-600">MCap/Net Inc</p>
                      <p className="text-sm font-bold">
                        {formatMultiple(company.financials.marketCapToNetIncomeMultiple)}
                      </p>
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
                <div className="text-sm text-gray-500">
                Data Updated on 14-04-25
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