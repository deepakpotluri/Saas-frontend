import React, { useState, useEffect } from 'react';

const IncomeStatementModal = ({ company, loading, onClose }) => {
  const [selectedYear, setSelectedYear] = useState(0);
  
  // Add body class to prevent scrolling when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, []);
  
  if (!company) return null;
  
  const { incomeStatementData, error } = company;
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return 'N/A';
    
    // Convert to millions for better readability
    const valueInMillions = value / 1000000;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valueInMillions) + "M";
  };
  
  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return (value * 100).toFixed(2) + '%';
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex justify-center items-center overflow-auto">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-6xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-bold mr-2">
                {company.ticker.split('/')[0]}
              </span>
              {company.name}
            </h2>
            <p className="text-gray-600 text-sm mt-1">{company.focus}</p>
            {company.categoryName && (
              <p className="text-gray-500 text-xs mt-1">Category: {company.categoryName}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
              <span className="ml-3 text-gray-600">Loading financial data...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : !incomeStatementData || incomeStatementData.length === 0 ? (
            <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
              No financial data available for this company.
            </div>
          ) : (
            <>
              {/* Year selector */}
              <div className="mb-6 flex flex-wrap gap-2">
                {incomeStatementData.map((statement, index) => (
                  <button 
                    key={index}
                    onClick={() => setSelectedYear(index)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      selectedYear === index 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {statement.calendarYear || statement.date.substring(0, 4)}
                  </button>
                ))}
              </div>
              
              {/* Income statement data */}
              <div className="overflow-x-auto modal-table-container">
                <table className="min-w-full divide-y divide-gray-200 modal-table">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Metric
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Value
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ratio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {incomeStatementData[selectedYear] && (
                      <>
                        <tr className="bg-gray-50">
                          <td colSpan="3" className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700">
                            Fiscal Year: {incomeStatementData[selectedYear].calendarYear} 
                            | Date: {incomeStatementData[selectedYear].date} 
                            | Currency: {incomeStatementData[selectedYear].reportedCurrency}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-800">Revenue</td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-800 font-medium">
                            {formatCurrency(incomeStatementData[selectedYear].revenue)}
                          </td>
                          <td className="px-4 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm text-right text-gray-500">
                            100%
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Cost of Revenue</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {formatCurrency(incomeStatementData[selectedYear].costOfRevenue)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].costOfRevenue / incomeStatementData[selectedYear].revenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Gross Profit</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800 font-medium">
                            {formatCurrency(incomeStatementData[selectedYear].grossProfit)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].grossProfitRatio)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Operating Expenses</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {formatCurrency(incomeStatementData[selectedYear].operatingExpenses)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].operatingExpenses / incomeStatementData[selectedYear].revenue)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Operating Income</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800 font-medium">
                            {formatCurrency(incomeStatementData[selectedYear].operatingIncome)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].operatingIncomeRatio)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">EBITDA</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {formatCurrency(incomeStatementData[selectedYear].ebitda)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].ebitdaratio)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Income Before Tax</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {formatCurrency(incomeStatementData[selectedYear].incomeBeforeTax)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].incomeBeforeTaxRatio)}
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">Income Tax Expense</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            {formatCurrency(incomeStatementData[selectedYear].incomeTaxExpense)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            {formatPercentage(incomeStatementData[selectedYear].incomeTaxExpense / incomeStatementData[selectedYear].revenue)}
                          </td>
                        </tr>
                        <tr className="bg-gray-100">
                          <td className="px-6 py-3 text-sm font-bold text-gray-800">Net Income</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800 font-bold">
                            {formatCurrency(incomeStatementData[selectedYear].netIncome)}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800 font-bold">
                            {formatPercentage(incomeStatementData[selectedYear].netIncomeRatio)}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">EPS (Basic)</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            ${incomeStatementData[selectedYear].eps}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            -
                          </td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-6 py-3 text-sm font-medium text-gray-800">EPS (Diluted)</td>
                          <td className="px-6 py-3 text-sm text-right text-gray-800">
                            ${incomeStatementData[selectedYear].epsdiluted}
                          </td>
                          <td className="px-6 py-3 text-sm text-right text-gray-500">
                            -
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Footer with disclaimer */}
              <div className="mt-6 text-xs text-gray-500 border-t border-gray-100 pt-4">
                <p>Data source: Financial Modeling Prep API</p>
                <p>All values shown in millions of {incomeStatementData[selectedYear]?.reportedCurrency || 'USD'}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeStatementModal;