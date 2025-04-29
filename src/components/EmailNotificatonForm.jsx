import React, { useState } from 'react';
import { trackNotificationSubscription } from '../utils/analytics';

// Define the API URL based on the environment
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : 'https://saas-backend-three.vercel.app/api';

const EnhancedEmailNotificationForm = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [notificationTypes, setNotificationTypes] = useState({
    allCountries: true,
    metricsUpdates: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Common country codes for dropdown
  const countryCodes = [
    { code: '+1', country: 'US/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+49', country: 'Germany' },
    { code: '+33', country: 'France' },
    { code: '+61', country: 'Australia' },
    { code: '+81', country: 'Japan' },
    { code: '+86', country: 'China' },
    { code: '+91', country: 'India' },
    { code: '+52', country: 'Mexico' },
    { code: '+55', country: 'Brazil' },
    { code: '+34', country: 'Spain' },
    { code: '+39', country: 'Italy' },
    { code: '+82', country: 'South Korea' },
    { code: '+65', country: 'Singapore' },
    { code: '+971', country: 'UAE' },
  ];

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhoneNumber = (phone) => {
    // Allow empty phone (optional) or validate if provided
    if (!phone) return true;
    
    // Basic phone validation - can be made more sophisticated
    const re = /^\d{6,15}$/;
    return re.test(phone);
  };

  const handleSubmit = async () => {
    // Reset states
    setError('');
    
    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate phone if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid phone number (digits only)');
      return;
    }
    
    // Validate that at least one notification type is selected
    if (!notificationTypes.allCountries && !notificationTypes.metricsUpdates) {
      setError('Please select at least one notification preference');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format phone with country code if provided
      const formattedPhone = phoneNumber ? `${countryCode}${phoneNumber}` : '';
      
      // Prepare subscription data
      const subscriptionData = {
        email,
        phone: formattedPhone,
        notifyAllCountries: notificationTypes.allCountries,
        notifyMetricsUpdates: notificationTypes.metricsUpdates
      };
      
      // Use the dynamic API_URL instead of hardcoded URL
      const response = await fetch(`${API_URL}/notifications/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to subscribe');
      }
      
      setSuccess(true);
      setEmail('');
      setPhoneNumber('');
      
      // Track the subscription event
      trackNotificationSubscription(email);
      
      // Close the modal after 2 seconds on success
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err) {
      setError('Failed to subscribe. Please try again later.');
      console.error('Subscription error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Get Notified</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded p-4 text-green-800 mb-4">
            Thanks for subscribing! We'll notify you when complete data is available.
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Subscribe to get notified when we add complete financial data for all companies.
            </p>
            
            <div>
              {/* Email Field */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="your@email.com"
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Phone Field with Country Code */}
              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex">
                  <select
                    id="countryCode"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-1/3 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    {countryCodes.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.code} {country.country}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    id="phone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-2/3 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Phone number"
                    disabled={isSubmitting}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Digits only, no spaces or special characters</p>
              </div>
              
              {/* Notification Type Checkboxes */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Preferences
                </label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      id="all-countries"
                      name="all-countries"
                      type="checkbox"
                      checked={notificationTypes.allCountries}
                      onChange={() => setNotificationTypes({
                        ...notificationTypes,
                        allCountries: !notificationTypes.allCountries
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="all-countries" className="ml-2 block text-sm text-gray-700">
                      Notification for All Countries Data
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="metrics-update"
                      name="metrics-update"
                      type="checkbox"
                      checked={notificationTypes.metricsUpdates}
                      onChange={() => setNotificationTypes({
                        ...notificationTypes,
                        metricsUpdates: !notificationTypes.metricsUpdates
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="metrics-update" className="ml-2 block text-sm text-gray-700">
                      Notify when metrics are updated
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </span>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedEmailNotificationForm;