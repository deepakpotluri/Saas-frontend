import React from 'react';
import { useNavigate } from 'react-router-dom';

const CompanyList = ({ companies, exchangeName }) => {
  const navigate = useNavigate();
  
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
  
  const handleCompanyClick = (company) => {
    // Navigate to the company details page with the company data
    navigate(`/company/${company.ticker}`, { state: { company } });
  };

  if (!companies || companies.length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded text-gray-500">
        No companies found in this selection.
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-3">
        Companies ({exchangeName}) - {companies.length} results
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticker
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Focus
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Market Cap
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gross Profit
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Net Income
              </th>
              <th className="py-2 px-4 border-b border-gray-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Year
              </th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, index) => (
              <tr 
                key={`${company.ticker}-${index}`} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleCompanyClick(company)}
              >
                <td className="py-3 px-4 border-b border-gray-200">
                  <div className="font-medium text-blue-600 hover:underline">
                    {company.name}
                  </div>
                </td>
                <td className="py-3 px-4 border-b border-gray-200 font-mono">
                  {company.ticker}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.focus}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm font-medium">
                  {company.financials ? formatCurrency(company.financials.marketCap) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatCurrency(company.financials.grossProfit) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? formatCurrency(company.financials.netIncome) : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b border-gray-200 text-sm">
                  {company.financials ? company.financials.year : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompanyList;