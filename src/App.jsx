import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from '../src/pages/HomePage';
import CompanyDetailsPage from '../src/pages/CompanyDetailsPage';
import Navbar from '../src/components/Navbar';

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [appState, setAppState] = useState(null);

  // Clear localStorage on page refresh
  useEffect(() => {
    // Clear localStorage when the component mounts (on refresh)
    localStorage.removeItem('saasMultiplesState');
    
    // Add event listener for beforeunload to track actual refresh
    const handleBeforeUnload = () => {
      localStorage.removeItem('saasMultiplesState');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Use useCallback to memoize this function
  const handleStateChange = useCallback((newState) => {
    if (!newState || !newState.selectedCountry) return;
    
    setAppState(prevState => {
      // Only update if there are actual changes
      if (JSON.stringify(prevState) === JSON.stringify(newState)) {
        return prevState;
      }
      
      return newState;
    });
  }, []);

  // Clear state function
  const clearState = useCallback(() => {
    localStorage.removeItem('saasMultiplesState');
    setAppState(null);
    
    // Force page reload to ensure all components reset
    window.location.reload();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50">
        <Navbar onClearState={clearState} />
        <div className="pt-16">
          <Routes>
            <Route 
              path="/" 
              element={
                <HomePage 
                  initialState={appState} 
                  onStateChange={handleStateChange} 
                />
              } 
            />
            <Route path="/company/:ticker" element={<CompanyDetailsPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;