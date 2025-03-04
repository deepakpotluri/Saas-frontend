import React, { useState, useEffect } from 'react';
import CategoryDisplay from './CategoryDisplay';
import CompanyList from './CompanyList';

const RegionDisplay = ({ region }) => {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Handle regions with categories (like USA) vs regions with direct company listings
  const hasCategories = region.categories && region.categories.length > 0;
  
  // For regions without categories, companies are directly in the region object
  const directCompanies = region.companies || [];

  useEffect(() => {
    // Reset selected categories when region changes
    setSelectedCategories([]);
    setShowAllCategories(false);
    
    // Combine all companies from all categories for the "All" option
    if (hasCategories) {
      const combinedCompanies = [];
      region.categories.forEach(category => {
        if (category.companies && category.companies.length > 0) {
          // Add category name to each company object for filtering
          const companiesWithCategory = category.companies.map(company => ({
            ...company,
            categoryName: category.name
          }));
          combinedCompanies.push(...companiesWithCategory);
        }
      });
      setAllCompanies(combinedCompanies);
    }
  }, [region, hasCategories]);

  const handleCategoryToggle = (categoryName) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryName)) {
        return prev.filter(cat => cat !== categoryName);
      } else {
        return [...prev, categoryName];
      }
    });
  };

  const handleSelectAllCategories = () => {
    if (showAllCategories) {
      setSelectedCategories([]);
      setShowAllCategories(false);
    } else {
      setSelectedCategories(region.categories.map(cat => cat.name));
      setShowAllCategories(true);
    }
  };

  // Determine which companies to display based on selected categories
  const getCompaniesToDisplay = () => {
    if (!hasCategories) return directCompanies;
    
    if (selectedCategories.length === 0) return [];
    
    if (showAllCategories) return allCompanies;
    
    const filtered = [];
    selectedCategories.forEach(categoryName => {
      const category = region.categories.find(cat => cat.name === categoryName);
      if (category && category.companies) {
        // Add category name to each company
        const companiesWithCategory = category.companies.map(company => ({
          ...company,
          categoryName: category.name
        }));
        filtered.push(...companiesWithCategory);
      }
    });
    
    return filtered;
  };

  const companiesToDisplay = getCompaniesToDisplay();

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-sm">
      <div className="bg-gray-50 p-5 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{region.name}</h2>
          {hasCategories && (
            <span className="text-gray-600 text-sm">
              {region.categories.length} Categories
            </span>
          )}
        </div>
      </div>

      {hasCategories ? (
        <div className="flex flex-col md:flex-row">
          {/* Category sidebar */}
          <div className="w-full md:w-72 lg:w-80 bg-gray-50 border-r border-gray-200 p-4 min-h-[500px] md:min-h-[600px]">
            <h3 className="text-gray-700 font-medium mb-3 text-sm uppercase tracking-wider">Categories</h3>
            
            <button 
              onClick={handleSelectAllCategories}
              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors mb-2 flex justify-between items-center ${
                showAllCategories 
                  ? 'bg-gray-200 text-gray-800 font-medium' 
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span>All Categories</span>
              <span className="text-xs bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded">
                {allCompanies.length}
              </span>
            </button>
            
            <div className="space-y-1 max-h-[400px] md:max-h-[500px] overflow-y-auto">
              {region.categories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategoryToggle(category.name)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex justify-between items-center ${
                    selectedCategories.includes(category.name)
                      ? 'bg-gray-200 text-gray-800 font-medium'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{category.name}</span>
                  <span className="text-xs bg-gray-200 text-gray-700 py-0.5 px-1.5 rounded flex-shrink-0">
                    {category.companies?.length || 0}
                  </span>
                </button>
              ))}
            </div>
            
            {selectedCategories.length > 0 && !showAllCategories && (
              <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
                <p>Selected: {selectedCategories.length} categories</p>
                <p>Showing: {companiesToDisplay.length} companies</p>
              </div>
            )}
          </div>

          {/* Main content area - fill remaining space */}
          <div className="flex-1 p-4 w-full">
            {selectedCategories.length > 0 ? (
              <CompanyList 
                companies={companiesToDisplay} 
                showCategory={selectedCategories.length > 1} 
              />
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200 mt-4">
                <p className="text-gray-500">Select one or more categories from the sidebar</p>
              </div>
            )}
          </div>
        </div>
      ) : directCompanies.length > 0 ? (
        // Display direct company listings (for non-USA regions)
        <div className="p-4">
          <CompanyList companies={directCompanies} />
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">No companies found for this region</div>
      )}
    </div>
  );
};

export default RegionDisplay;