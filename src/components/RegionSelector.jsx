import React from 'react';

const RegionSelector = ({ regions, selectedRegion, onRegionChange }) => {
  if (!regions || regions.length === 0) {
    return <div className="text-center py-4">No regions available</div>;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center flex-wrap gap-3">
        {regions.map((region, index) => (
          <button
            key={index}
            onClick={() => onRegionChange(region)}
            className={`px-4 py-2 rounded-full text-sm ${
              selectedRegion && selectedRegion.name === region.name
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RegionSelector;