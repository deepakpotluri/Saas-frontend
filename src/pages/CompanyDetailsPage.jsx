import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchCompanyFinancials } from '../services/api';
import { trackFinancialDataLoaded } from '../utils/analytics';

const CompanyDetailsPage = () => {
  const { ticker } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(location.state?.company || null);
  const [financialData, setFinancialData] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  const [growthData, setGrowthData] = useState({
    revenueGrowth: null,
    grossProfitGrowth: null,
    netIncomeGrowth: null
  });
  const [latestTwoYearsData, setLatestTwoYearsData] = useState([]);
  
  useEffect(() => {
    const loadCompanyData = async () => {
      if (!ticker) {
        setError('No company ticker provided');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchCompanyFinancials(ticker);
        setFinancialData(data);
        
        // Track that financial data was successfully loaded
        if (window.gtag) {
          window.gtag('event', 'view_company_details', {
            'event_category': 'User Engagement',
            'event_label': data.name || company?.name || ticker,
            'company_ticker': ticker,
            'company_focus': data.focus || company?.focus || 'N/A'
          });
          
          // Also track using our utility if available
          if (typeof trackFinancialDataLoaded === 'function') {
            trackFinancialDataLoaded(ticker, data.name || company?.name);
          }
        }
        
        // If we don't have the company info from navigation state
        if (!company) {
          // Extract revenue, profit and income directly from the data
          const revenue = data.raw_values?.current_revenue || data.current_revenue;
          const grossProfit = data.raw_values?.current_grossProfit || data.current_grossProfit;
          const netIncome = data.raw_values?.current_netIncome || data.current_netIncome;
          
          // Basic company info extraction from financial data
          setCompany({
            name: data.name || ticker,
            ticker: ticker,
            focus: data.focus || 'N/A',
            financials: {
              marketCap: data.market_cap,
              revenue: revenue,
              revenueGrowth: data.growth_metrics?.revenue_growth_pct?.toFixed(1),
              netIncome: netIncome,
              netIncomeGrowth: data.growth_metrics?.net_income_growth_pct?.toFixed(1),
              grossProfit: grossProfit,
              grossProfitGrowth: data.growth_metrics?.gross_profit_growth_pct?.toFixed(1),
              marketCapToRevenueMultiple: data.valuation_multiples_raw?.marketcap_to_revenue?.toFixed(2),
              marketCapToNetIncomeMultiple: data.valuation_multiples_raw?.marketcap_to_netincome?.toFixed(2),
              marketCapToGrossProfitMultiple: data.valuation_multiples_raw?.marketcap_to_grossprofit?.toFixed(2),
              year: data.latest_fiscal_year
            }
          });
          
          console.log("Company data extracted:", {
            revenue, 
            grossProfit, 
            netIncome
          });
        }
        
        // Process yearly data for display
        if (data.income_statement && data.income_statement.length > 0) {
          // Sort statements by date for display
          const sortedStatements = [...data.income_statement].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          );
          
          // Process yearly data
          const processedYearlyData = sortedStatements.map((statement, index) => {
            const prevYear = index < sortedStatements.length - 1 ? sortedStatements[index + 1] : null;
            
            // For the most recent year, use pre-calculated growth metrics
            let revenueGrowth = null;
            let grossProfitGrowth = null;
            let netIncomeGrowth = null;
            
            if (index === 0) {
              revenueGrowth = data.growth_metrics?.revenue_growth_pct?.toFixed(2);
              grossProfitGrowth = data.growth_metrics?.gross_profit_growth_pct?.toFixed(2);
              netIncomeGrowth = data.growth_metrics?.net_income_growth_pct?.toFixed(2);
            } else if (prevYear) {
              // For previous years, calculate on-the-fly
              revenueGrowth = prevYear.revenue && prevYear.revenue !== 0
                ? ((statement.revenue - prevYear.revenue) / Math.abs(prevYear.revenue) * 100).toFixed(2)
                : null;
                
              grossProfitGrowth = prevYear.grossProfit && prevYear.grossProfit !== 0
                ? ((statement.grossProfit - prevYear.grossProfit) / Math.abs(prevYear.grossProfit) * 100).toFixed(2)
                : null;
                
              netIncomeGrowth = prevYear.netIncome && prevYear.netIncome !== 0
                ? ((statement.netIncome - prevYear.netIncome) / Math.abs(prevYear.netIncome) * 100).toFixed(2)
                : null;
            }
            
            return {
              year: statement.calendarYear,
              date: statement.date,
              revenue: statement.revenue,
              revenueGrowth,
              grossProfit: statement.grossProfit,
              grossProfitGrowth,
              netIncome: statement.netIncome,
              netIncomeGrowth,
              eps: statement.epsdiluted
              // Removed marketCap and related multiples
            };
          });
          
          setYearlyData(processedYearlyData);
          
          // Set growth data directly from pre-calculated metrics
          setGrowthData({
            revenueGrowth: data.growth_metrics?.revenue_growth_pct?.toFixed(1),
            grossProfitGrowth: data.growth_metrics?.gross_profit_growth_pct?.toFixed(1),
            netIncomeGrowth: data.growth_metrics?.net_income_growth_pct?.toFixed(1)
          });
          
          // Extract latest two years data for the YoY comparison
          setLatestTwoYearsData(processedYearlyData.slice(0, 2));
        }
      } catch (err) {
        console.error(`Error loading data for ${ticker}:`, err);
        setError(`Failed to load data for ${ticker}`);
        
        // Track error in Google Analytics
        if (window.gtag) {
          window.gtag('event', 'data_load_error', {
            'event_category': 'Error',
            'event_label': `${ticker}: ${err.message || 'Unknown error'}`
          });
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanyData();
  }, [ticker, company]);
  
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

  const formatGrowthRate = (value) => {
    // Check if value is null, undefined, or NaN
    if (value === null || value === undefined || isNaN(parseFloat(value))) {
      return 'N/A';
    }
    
    const numericValue = parseFloat(value);
    const color = numericValue > 0 ? 'text-green-600' : numericValue < 0 ? 'text-red-600' : 'text-gray-600';
    const prefix = numericValue > 0 ? '+' : '';
    
    return (
      <span className={color}>
        {prefix}{numericValue}%
      </span>
    );
  };
  
  const formatMultiple = (value) => {
    if (!value && value !== 0) return 'N/A';
    return `${value}x`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent"></div>
          <span className="mt-4 text-lg">Loading company data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!company) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-yellow-700">
          <h2 className="text-xl font-bold mb-2">Company Not Found</h2>
          <p>We couldn't find the company information for ticker: {ticker}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center mb-6">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Companies
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="border-b border-gray-200 pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            {company.name} 
            <span className="text-gray-500 ml-2 font-mono">({company.ticker})</span>
          </h1>
          <p className="text-gray-600 mt-2">{company.focus}</p>
        </div>
        
        {/* Latest Revenue */}
        {company.financials && company.financials.revenue && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Latest Revenue</h2>
            <p className="text-3xl font-bold text-blue-800">{formatCurrency(company.financials.revenue)}</p>
            {company.financials.revenueGrowth && (
              <p className="mt-1">
                YoY Growth: {formatGrowthRate(company.financials.revenueGrowth)}
              </p>
            )}
          </div>
        )}
      
        {company.financials && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Key Financial Metrics ({company.financials.year || 'N/A'})</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Revenue with YoY Growth */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <p className="text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.revenue || yearlyData[0]?.revenue || 'N/A')}</p>
                  <p className="text-sm mt-1">
                    YoY Growth: {formatGrowthRate(company.financials.revenueGrowth || yearlyData[0]?.revenueGrowth)}
                  </p>
                </div>
                
                {/* Market Cap */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.marketCap || yearlyData[0]?.marketCap || 'N/A')}</p>
                </div>
                
                {/* Gross Profit with YoY Growth */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-600">Gross Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.grossProfit || yearlyData[0]?.grossProfit || 'N/A')}</p>
                  <p className="text-sm mt-1">
                    YoY Growth: {formatGrowthRate(company.financials.grossProfitGrowth || yearlyData[0]?.grossProfitGrowth)}
                  </p>
                </div>
                
                {/* Net Income with YoY Growth */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.netIncome || yearlyData[0]?.netIncome || 'N/A')}</p>
                  <p className="text-sm mt-1">
                    YoY Growth: {formatGrowthRate(company.financials.netIncomeGrowth || yearlyData[0]?.netIncomeGrowth)}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Growth Metrics Summary */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Growth Summary</h2>
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-gray-700 font-medium">Revenue Growth</p>
                    <p className="text-3xl font-bold mt-2">
                      {formatGrowthRate(company.financials.revenueGrowth || growthData.revenueGrowth)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-700 font-medium">Gross Profit Growth</p>
                    <p className="text-3xl font-bold mt-2">
                      {formatGrowthRate(company.financials.grossProfitGrowth || growthData.grossProfitGrowth)}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-700 font-medium">Net Income Growth</p>
                    <p className="text-3xl font-bold mt-2">
                      {formatGrowthRate(company.financials.netIncomeGrowth || growthData.netIncomeGrowth)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Valuation Multiples</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap / Revenue</p>
                  <p className="text-2xl font-bold">{formatMultiple(company.financials.marketCapToRevenueMultiple)}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap / Gross Profit</p>
                  <p className="text-2xl font-bold">{formatMultiple(company.financials.marketCapToGrossProfitMultiple)}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap / Net Income</p>
                  <p className="text-2xl font-bold">{formatMultiple(company.financials.marketCapToNetIncomeMultiple)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {yearlyData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Historical Financial Data & Growth</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Growth</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Growth</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((yearData, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{yearData.year}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.revenue)}</td>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{formatGrowthRate(yearData.revenueGrowth)}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.grossProfit)}</td>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{formatGrowthRate(yearData.grossProfitGrowth)}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.netIncome)}</td>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{formatGrowthRate(yearData.netIncomeGrowth)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        
        {yearlyData.length > 1 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Growth Visualization</h2>
            <div className="p-4 bg-white border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Revenue Growth Chart - Simplified Bar Representation */}
                <div className="border p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 text-center">Revenue Growth</h3>
                  <div className="space-y-2">
                    {yearlyData.slice(0, 5).map((year, index) => {
                      const growthValue = parseFloat(year.revenueGrowth || 0);
                      const barWidth = Math.min(Math.abs(growthValue), 100);
                      const barColor = growthValue >= 0 ? 'bg-green-500' : 'bg-red-500';
                      const textColor = growthValue >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={index} className="flex items-center">
                          <span className="text-sm w-12 text-gray-600">{year.year}</span>
                          <div className="flex-1 bg-gray-200 h-5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${barColor}`} 
                              style={{width: `${barWidth}%`, marginLeft: growthValue < 0 ? 'auto' : '0'}}
                            ></div>
                          </div>
                          <span className={`ml-2 text-sm font-bold ${textColor}`}>
                            {growthValue > 0 ? '+' : ''}{growthValue}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Gross Profit Growth Chart */}
                <div className="border p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 text-center">Gross Profit Growth</h3>
                  <div className="space-y-2">
                    {yearlyData.slice(0, 5).map((year, index) => {
                      const growthValue = parseFloat(year.grossProfitGrowth || 0);
                      const barWidth = Math.min(Math.abs(growthValue), 100);
                      const barColor = growthValue >= 0 ? 'bg-green-500' : 'bg-red-500';
                      const textColor = growthValue >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={index} className="flex items-center">
                          <span className="text-sm w-12 text-gray-600">{year.year}</span>
                          <div className="flex-1 bg-gray-200 h-5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${barColor}`} 
                              style={{width: `${barWidth}%`, marginLeft: growthValue < 0 ? 'auto' : '0'}}
                            ></div>
                          </div>
                          <span className={`ml-2 text-sm font-bold ${textColor}`}>
                            {growthValue > 0 ? '+' : ''}{growthValue}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Net Income Growth Chart */}
                <div className="border p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-2 text-center">Net Income Growth</h3>
                  <div className="space-y-2">
                    {yearlyData.slice(0, 5).map((year, index) => {
                      const growthValue = parseFloat(year.netIncomeGrowth || 0);
                      const barWidth = Math.min(Math.abs(growthValue), 100);
                      const barColor = growthValue >= 0 ? 'bg-green-500' : 'bg-red-500';
                      const textColor = growthValue >= 0 ? 'text-green-600' : 'text-red-600';
                      
                      return (
                        <div key={index} className="flex items-center">
                          <span className="text-sm w-12 text-gray-600">{year.year}</span>
                          <div className="flex-1 bg-gray-200 h-5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${barColor}`} 
                              style={{width: `${barWidth}%`, marginLeft: growthValue < 0 ? 'auto' : '0'}}
                            ></div>
                          </div>
                          <span className={`ml-2 text-sm font-bold ${textColor}`}>
                            {growthValue > 0 ? '+' : ''}{growthValue}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {financialData && financialData.income_statement && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Detailed Financial Data</h2>
            
            {/* Income Statement Details */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-blue-800">Income Statement Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost of Revenue</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">R&D Expenses</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SG&A Expenses</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Income</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operating Margin</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EBITDA</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Margin</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.income_statement
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((statement, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{statement.calendarYear}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.revenue)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.costOfRevenue)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.researchAndDevelopmentExpenses)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.sellingGeneralAndAdministrativeExpenses)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.operatingIncome)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{statement.operatingIncomeRatio ? `${(statement.operatingIncomeRatio * 100).toFixed(2)}%` : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.ebitda)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(statement.netIncome)}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{statement.netIncomeRatio ? `${(statement.netIncomeRatio * 100).toFixed(2)}%` : 'N/A'}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* EPS and Shareholder Data */}
            <div className="bg-white border border-gray-200 rounded-lg mb-6">
              <div className="bg-green-50 px-4 py-3 border-b border-gray-200">
                <h3 className="font-medium text-green-800">EPS & Shareholder Data</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPS</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPS Diluted</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares Outstanding</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shares Outstanding Diluted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {financialData.income_statement
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((statement, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{statement.calendarYear}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${statement.eps || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${statement.epsdiluted || 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{statement.weightedAverageShsOut ? (statement.weightedAverageShsOut / 1000000).toFixed(2) + 'M' : 'N/A'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{statement.weightedAverageShsOutDil ? (statement.weightedAverageShsOutDil / 1000000).toFixed(2) + 'M' : 'N/A'}</td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Market Cap History */}
            {financialData.market_cap && financialData.market_cap.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="bg-purple-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-purple-800">Market Cap History</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {financialData.market_cap
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatCurrency(item.marketCap)}</td>
                          </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* Valuation Metrics */}
            {financialData.valuation_multiples && (
              <div className="bg-white border border-gray-200 rounded-lg mt-6">
                <div className="bg-amber-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-medium text-amber-800">Valuation Metrics</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Market Cap to Revenue</p>
                      <p className="text-xl font-bold text-gray-800">{financialData.valuation_multiples.marketcap_to_revenue || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Market Cap to Gross Profit</p>
                      <p className="text-xl font-bold text-gray-800">{financialData.valuation_multiples.marketcap_to_grossprofit || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-600 text-sm mb-1">Market Cap to Net Income</p>
                      <p className="text-xl font-bold text-gray-800">{financialData.valuation_multiples.marketcap_to_netincome || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailsPage;