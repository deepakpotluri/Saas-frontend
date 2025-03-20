const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://saas-backend-three.vercel.app/api';

// Helper function to handle API responses consistently
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
  }
  
  try {
    const data = await response.json();
    
    // Basic validation of the response
    if (data === null || data === undefined) {
      throw new Error('Invalid response: Empty data received from API');
    }
    
    return data;
  } catch (error) {
    throw new Error('Failed to parse API response');
  }
};

export const fetchCountries = async () => {
  try {
    const response = await fetch(`${API_URL}/countries`);
    const data = await handleApiResponse(response);
    
    // Ensure countries is an array
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchCountryData = async (countryName) => {
  if (!countryName) {
    throw new Error('Country name is required');
  }
  
  try {
    const response = await fetch(`${API_URL}/country/${encodeURIComponent(countryName)}`);
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
};

export const fetchUSACategories = async () => {
  try {
    const response = await fetch(`${API_URL}/categories/usa`);
    const data = await handleApiResponse(response);
    
    // Ensure categories is an array
    if (!Array.isArray(data)) {
      return [];
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchCompanies = async (countryName, category = null) => {
  if (!countryName) {
    throw new Error('Country name is required');
  }
  
  try {
    let url = `${API_URL}/companies/${encodeURIComponent(countryName)}`;
    
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    
    const response = await fetch(url);
    const data = await handleApiResponse(response);
    
    // Basic validation of the company data structure
    if (!data.companies) {
      return { companies: [], exchangeName: data.exchangeName || 'Unknown Exchange' };
    }
    
    return data;
  } catch (error) {
    throw error;
  }
};

export const fetchCompanyFinancials = async (ticker) => {
  if (!ticker) {
    throw new Error('Ticker is required');
  }
  
  try {
    const response = await fetch(`${API_URL}/financials/${encodeURIComponent(ticker)}`);
    return await handleApiResponse(response);
  } catch (error) {
    throw error;
  }
};