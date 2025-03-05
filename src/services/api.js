// src/services/api.js
// Dynamically determine API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://saas-backend-one.vercel.app/api'
  : 'http://localhost:5000/api';

export const fetchAllCompanies = async () => {
  try {
    const response = await fetch(`${API_URL}/companies`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all companies:', error);
    throw error;
  }
};

export const fetchAllRegions = async () => {
  try {
    const response = await fetch(`${API_URL}/regions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all regions:', error);
    throw error;
  }
};

export const fetchUSACompanies = async () => {
  try {
    const response = await fetch(`${API_URL}/companies/usa`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching USA companies:', error);
    throw error;
  }
};

export const fetchRegionCompanies = async (regionName) => {
  try {
    const response = await fetch(`${API_URL}/companies/region/${regionName}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching companies for region ${regionName}:`, error);
    throw error;
  }
};