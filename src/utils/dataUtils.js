// Utility functions for handling PHP backend response data

/**
 * Safely extract records array from PHP backend response
 * @param {*} response - The response object from PHP backend
 * @returns {Array} - Array of records or empty array
 */
export const extractRecordsFromResponse = (response) => {
  if (!response) return [];
  
  // Try different possible response structures
  return response.data || response.records || response || [];
};

/**
 * Safely extract a single record from PHP backend response
 * @param {*} response - The response object from PHP backend
 * @returns {Object|null} - Single record object or null
 */
export const extractRecordFromResponse = (response) => {
  if (!response) return null;
  
  // Try different possible response structures
  return response.record || response.data || response;
};

/**
 * Check if PHP backend response indicates success
 * @param {*} response - The response object from PHP backend
 * @returns {boolean} - Whether the operation was successful
 */
export const isSuccessResponse = (response) => {
  if (!response) return false;
  
  // Handle both 'success' and 'status' fields
  return response.success === true || response.status === 'success';
};

/**
 * Safely access nested properties with fallback
 * @param {*} obj - Object to access
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {*} fallback - Fallback value if path doesn't exist
 * @returns {*} - The value at path or fallback
 */
export const safeGet = (obj, path, fallback = null) => {
  try {
    return path.split('.').reduce((current, key) => current && current[key], obj) || fallback;
  } catch {
    return fallback;
  }
};

/**
 * Normalize record object to ensure required fields exist
 * @param {Object} record - Raw record object from PHP backend
 * @returns {Object} - Normalized record with all required fields
 */
export const normalizeRecord = (record) => {
  if (!record) return null;
  
  return {
    id: record.id || null,
    vehicle_number: record.vehicle_number || record.vehicle || '',
    party_name: record.party_name || record.party || '',
    vehicle_type: record.vehicle_type || record.type || '',
    product: record.product || '',
    first_weight: record.first_weight || record.weight || 0,
    second_weight: record.second_weight || null,
    net_weight: record.net_weight || null,
    total_price: record.total_price || record.price || 0,
    first_weight_time: record.first_weight_time || record.firstTime || null,
    second_weight_time: record.second_weight_time || record.secondTime || null,
    driver_name: record.driver_name || record.driver || '',
    status: record.status || 'pending',
    final_weight: record.final_weight || 'No',
    business_name: record.business_name || record.businessName || null  // Handle both field names
  };
};
