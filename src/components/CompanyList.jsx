import React, { useState } from 'react';
import IncomeStatementModal from '../components/IncomeStatementModal';

const CompanyList = ({ companies, showCategory = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!companies || companies.length === 0) {
    return <div className="p-4 text-center text-gray-500">No companies found</div>;
  }

  const filteredCompanies = companies.filter(company => 
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.focus?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (showCategory && company.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleTickerClick = async (company) => {
    setSelectedCompany(company);
    setShowModal(true);
    setLoading(true);
    
    try {
      // Get ticker without any additional data after a slash
      const ticker = company.ticker.split('/')[0];
      
      // Fetch income statement data from Financial Modeling Prep API
      const response = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?period=annual&apikey=Sq8sEaeSf3hwz0YxXUE39iXW55yCAnuY`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedCompany({...company, incomeStatementData: data});
    } catch (error) {
      console.error('Error fetching financial data:', error);
      setSelectedCompany({...company, error: 'Failed to load financial data. Please try again later.'});
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search companies..."
          className="w-full p-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredCompanies.length > 0 ? (
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-100 w-full">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24 lg:w-36">
                  Ticker
                </th>
                <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                {showCategory && (
                  <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-40 lg:w-60">
                    Category
                  </th>
                )}
                <th scope="col" className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Focus
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredCompanies.map((company, index) => (
                <tr 
                  key={index} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer group" 
                  onClick={() => handleTickerClick(company)}
                  title="Click to view financial data"
                >
                  <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 group-hover:bg-gray-200">
                        {company.ticker.split('/')[0] || company.ticker}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                    <div className="font-medium text-gray-900 group-hover:text-gray-700 flex items-center">
                      {company.name}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="h-4 w-4 ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </td>
                  {showCategory && (
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                      <span className="text-xs bg-gray-100 text-gray-700 py-1 px-2 rounded">
                        {company.categoryName}
                      </span>
                    </td>
                  )}
                  <td className="px-4 lg:px-6 py-3 text-sm text-gray-500">
                    {company.focus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-4 text-gray-500 bg-white rounded-lg shadow-sm p-6">
          No companies match your search criteria
        </div>
      )}
      
      {/* Income Statement Modal */}
      {showModal && (
        <IncomeStatementModal 
          company={selectedCompany} 
          loading={loading}
          onClose={closeModal}
        />
      )}
    </div>
  );
};



export default CompanyList;