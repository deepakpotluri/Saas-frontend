import React, { useState, useEffect } from 'react' 
import Navbar from '../src/components/Navbar' 
import RegionDisplay from '../src/components/RegionDisplay' 
import RegionSidebar from '../src/components/RegionSidebar' 
import LoadingSpinner from '../src/components/LoadSpinner' 
import { fetchAllRegions } from '../src/services/api'

function App() {
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const regionsData = await fetchAllRegions()
        
        // Process regions to ensure proper structure
        const processedRegions = regionsData.map(region => {
          // For USA and regions with categories, add company count
          if (region.categories) {
            return {
              ...region,
              categories: region.categories.map(category => ({
                ...category,
                companyCount: category.companies?.length || 0
              }))
            };
          }
          
          // For regions without categories, ensure companies array exists
          return {
            ...region,
            companies: region.companies || []
          };
        });
        
        setRegions(processedRegions)
        
        // Set the first region as default selected (USA if available)
        const usaRegion = processedRegions.find(region => 
          region.name.includes("United States") || region.name.includes("USA")
        )
        setSelectedRegion(usaRegion || processedRegions[0])
        
        setError(null)
      } catch (err) {
        console.error('Error loading data:', err)
        setError('Failed to load SaaS companies data. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleRegionChange = (region) => {
    setSelectedRegion(region)
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-64 lg:w-72 bg-white shadow-md h-full overflow-y-auto fixed left-0">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-700">Regions</h2>
          </div>
          {loading ? (
            <div className="p-4">
              <LoadingSpinner small />
            </div>
          ) : (
            <RegionSidebar 
              regions={regions} 
              selectedRegion={selectedRegion} 
              onRegionSelect={handleRegionChange} 
            />
          )}
        </div>
        
        {/* Main Content - uses all remaining space */}
        <div className="ml-64 lg:ml-72 flex-1 p-4 lg:p-6 overflow-y-auto">
          {/* Scrolling Financial Data Notice */}
          <div className="bg-gray-800 text-white px-4 py-2 rounded-md mb-6 shadow-sm overflow-hidden relative">
            <div className="animate-marquee whitespace-nowrap">
              <span className="mx-4">📊 Financial data is currently only available for US SaaS Companies</span>
              
            </div>
          </div>

          <div className="max-w-full mx-auto">
            <div className="mb-6 lg:mb-8">
              {/* <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-2">SaaS Companies Database</h1>
              <p className="text-gray-600">
                Explore SaaS companies categorized by region and industry focus.
              </p> */}
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <div className="bg-red-50 p-4 rounded-md text-red-700">
                {error}
              </div>
            ) : selectedRegion ? (
              <RegionDisplay region={selectedRegion} />
            ) : (
              <div className="text-center py-10 text-gray-500">
                Select a region from the sidebar to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App