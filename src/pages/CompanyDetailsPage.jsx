import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchCompanyFinancials } from '../services/api';

const CompanyDetailsPage = () => {
  const { ticker } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(location.state?.company || null);
  const [financialData, setFinancialData] = useState(null);
  const [yearlyData, setYearlyData] = useState([]);
  
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
        
        // If we don't have the company info from navigation state
        if (!company) {
          // Basic company info extraction from financial data
          setCompany({
            name: data.name || ticker,
            ticker: ticker,
            focus: data.focus || 'N/A',
            financials: processFinancials(data)
          });
        }
        
        // Process yearly data for display
        if (data.income_statement && data.income_statement.length > 0) {
          const processedYearlyData = data.income_statement.map(statement => {
            const relevantMarketCap = data.market_cap && data.market_cap.length > 0 
              ? findClosestMarketCap(statement.date, data.market_cap)
              : null;
              
            return {
              year: statement.calendarYear,
              date: statement.date,
              revenue: statement.revenue,
              grossProfit: statement.grossProfit,
              netIncome: statement.netIncome,
              eps: statement.epsdiluted,
              marketCap: relevantMarketCap ? relevantMarketCap.marketCap : null,
              marketCapToNetIncomeMultiple: relevantMarketCap && statement.netIncome 
                ? (relevantMarketCap.marketCap / statement.netIncome).toFixed(2)
                : null,
              marketCapToGrossProfitMultiple: relevantMarketCap && statement.grossProfit 
                ? (relevantMarketCap.marketCap / statement.grossProfit).toFixed(2)
                : null
            };
          });
          
          // Sort by date descending
          processedYearlyData.sort((a, b) => new Date(b.date) - new Date(a.date));
          setYearlyData(processedYearlyData);
        }
      } catch (err) {
        console.error(`Error loading data for ${ticker}:`, err);
        setError(`Failed to load data for ${ticker}`);
      } finally {
        setLoading(false);
      }
    };
    
    loadCompanyData();
  }, [ticker, company]);
  
  const findClosestMarketCap = (statementDate, marketCapArray) => {
    if (!marketCapArray || marketCapArray.length === 0) return null;
    
    const statementDateObj = new Date(statementDate);
    let closestMarketCap = marketCapArray[0];
    let smallestDiff = Math.abs(new Date(marketCapArray[0].date) - statementDateObj);
    
    for (let i = 1; i < marketCapArray.length; i++) {
      const currentDiff = Math.abs(new Date(marketCapArray[i].date) - statementDateObj);
      if (currentDiff < smallestDiff) {
        smallestDiff = currentDiff;
        closestMarketCap = marketCapArray[i];
      }
    }
    
    return closestMarketCap;
  };
  
  const processFinancials = (data) => {
    if (!data || !data.income_statement || data.income_statement.length === 0) {
      return null;
    }
    
    // Get latest income statement
    const latestIncomeStatement = data.income_statement.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )[0];
    
    // Get latest market cap
    let latestMarketCap = null;
    if (data.market_cap && data.market_cap.length > 0) {
      latestMarketCap = data.market_cap.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      )[0];
    }
    
    // Handle cases where we might not have both data points
    const marketCap = latestMarketCap ? latestMarketCap.marketCap : null;
    const netIncome = latestIncomeStatement ? latestIncomeStatement.netIncome : null;
    const grossProfit = latestIncomeStatement ? latestIncomeStatement.grossProfit : null;
    
    return {
      marketCap,
      netIncome,
      grossProfit,
      marketCapToNetIncomeMultiple: (marketCap && netIncome) ? (marketCap / netIncome).toFixed(2) : null,
      marketCapToGrossProfitMultiple: (marketCap && grossProfit) ? (marketCap / grossProfit).toFixed(2) : null,
      year: latestIncomeStatement ? latestIncomeStatement.calendarYear : null
    };
  };
  
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
        
        {company.financials && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4">Key Financial Metrics ({company.financials.year || 'N/A'})</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.marketCap)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-gray-600">Gross Profit</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.grossProfit)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-gray-600">Net Income</p>
                  <p className="text-2xl font-bold">{formatCurrency(company.financials.netIncome)}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Valuation Multiples</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-amber-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap / Net Income</p>
                  <p className="text-2xl font-bold">{formatMultiple(company.financials.marketCapToNetIncomeMultiple)}</p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg">
                  <p className="text-gray-600">Market Cap / Gross Profit</p>
                  <p className="text-2xl font-bold">{formatMultiple(company.financials.marketCapToGrossProfitMultiple)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {yearlyData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Historical Financial Data</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Year</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Profit</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Income</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EPS</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Cap</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MktCap/Net Inc</th>
                    <th className="py-3 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MktCap/Gross</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((yearData, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-3 px-4 border-b border-gray-200">{yearData.year}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.revenue)}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.grossProfit)}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.netIncome)}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{yearData.eps || 'N/A'}</td>
                      <td className="py-3 px-4 border-b border-gray-200">{formatCurrency(yearData.marketCap)}</td>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{formatMultiple(yearData.marketCapToNetIncomeMultiple)}</td>
                      <td className="py-3 px-4 border-b border-gray-200 font-medium">{formatMultiple(yearData.marketCapToGrossProfitMultiple)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetailsPage;