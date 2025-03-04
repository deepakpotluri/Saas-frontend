import React, { useState } from 'react';

const RegionSidebar = ({ regions, selectedRegion, onRegionSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!regions || regions.length === 0) {
    return <div className="p-4 text-gray-500">No regions available</div>;
  }

  const filteredRegions = regions.filter(region => 
    region.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full">
      <div className="p-3">
        <input
          type="text"
          placeholder="Search regions..."
          className="w-full p-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="overflow-y-auto">
        {filteredRegions.map((region, index) => {
          // Count total companies in the region
          let companyCount = 0;
          if (region.categories) {
            companyCount = region.categories.reduce((total, category) => 
              total + (category.companies?.length || 0), 0);
          } else {
            companyCount = region.companies?.length || 0;
          }
          
          return (
            <div
              key={index}
              onClick={() => onRegionSelect(region)}
              className={`p-3 cursor-pointer hover:bg-blue-50 border-l-4 ${
                selectedRegion && selectedRegion.name === region.name
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-transparent'
              }`}
            >
              <div className="font-medium text-gray-700">{region.name}</div>
              {/* <div className="text-xs text-gray-500 mt-1">
                {companyCount} {companyCount === 1 ? 'Company' : 'Companies'}
              </div> */}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RegionSidebar;