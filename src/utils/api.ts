// API configuration for the ORC Protocol
import axios from 'axios';

export const API_BASE_URL = 'https://orc-backend.railway.app/api/v1';

// Function to create API URLs
export const apiUrl = (path: string) => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

// Function to get data from the API
export const getApiDataWithFallback = async (endpoint: string, mockDataPath: string) => {
  try {
    const response = await axios.get(apiUrl(endpoint));
    return response.data;
  } catch (error) {
    console.warn(`API request failed for ${endpoint}, using real API fallback.`);
    // Just try again with a timeout
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await axios.get(apiUrl(endpoint));
      return response.data;
    } catch (retryError) {
      console.error(`API retry also failed for ${endpoint}`, retryError);
      throw retryError;
    }
  }
};

// Function to setup real-time streaming updates for indexer status
export const setupIndexerStatusStream = (callback: (data: any) => void, interval = 3000) => {
  // Initial fetch
  fetchIndexerStatus();
  
  // Setup interval for polling
  const intervalId = setInterval(fetchIndexerStatus, interval);
  
  // Function to fetch indexer status
  async function fetchIndexerStatus() {
    try {
      const response = await axios.get(apiUrl('indexer/status'));
      if (response.data && response.data.success) {
        callback(response.data);
      }
    } catch (error) {
      console.error('Error fetching indexer status:', error);
    }
  }
  
  // Return a cleanup function
  return () => {
    clearInterval(intervalId);
  };
};