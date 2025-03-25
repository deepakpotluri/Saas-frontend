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
    
    // Track page view on route change
    if (window.gtag) { 
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: pathname
      });
    }
  }, [pathname]);
  
  return null;
}

function App() {
  const [appState, setAppState] = useState(null);
  
  // Initialize Google Analytics verification
  useEffect(() => {
    // Check if Google Analytics is available
    if (typeof window.gtag !== 'function') {
      console.warn('Google Analytics (gtag) is not available. Events will not be tracked.');
    } else {
      console.log('Google Analytics is properly loaded.');
      
      // Send a test event in development
      if (process.env.NODE_ENV === 'development') {
        window.gtag('event', 'ga_verification', {
          'event_category': 'System',
          'event_label': 'GA Verification',
          'non_interaction': true
        });
      }
    }
  }, []);
  
  // Clear localStorage on page refresh
  useEffect(() => {
    // Clear localStorage when the component mounts (on refresh)
    localStorage.removeItem('saasMultiplesState');
    
    // Add event listener for beforeunload to track actual refresh
    const handleBeforeUnload = () => {
      localStorage.removeItem('saasMultiplesState');
      
      // Track user leaving the site
      if (window.gtag) {
        window.gtag('event', 'page_exit', {
          'event_category': 'User Engagement',
          'event_label': 'User left the site',
          'non_interaction': true
        });
      }
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
      
      // Track state changes in Google Analytics
      if (window.gtag && newState.selectedCountry) {
        window.gtag('event', 'filter_selection', {
          'event_category': 'User Interaction',
          'event_label': 'Filter Changed',
          'country': newState.selectedCountry,
          'category': newState.selectedCategory || 'All'
        });
      }
      
      return newState;
    });
  }, []);
  
  // Clear state function
  const clearState = useCallback(() => {
    localStorage.removeItem('saasMultiplesState');
    setAppState(null);
    
    // Track state reset in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'reset_filters', {
        'event_category': 'User Interaction',
        'event_label': 'Filters Reset'
      });
    }
    
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