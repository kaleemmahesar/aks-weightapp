/**
 * Centralized date formatting utilities for consistent PST timezone handling
 */

/**
 * Formats a date string to PST (Asia/Karachi) timezone in 12-hour format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string in "01 Jan 2025, 2:30 PM" format or "-" if invalid
 */
export const formatToPST = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "numeric", 
    minute: "2-digit", 
    hour12: true
  });
};

/**
 * Gets current date and time in PST (Asia/Karachi) timezone
 * @returns {string} Current date and time in PST format
 */
export const getCurrentPSTDateTime = () => {
  const now = new Date();
  return now.toLocaleString("en-GB", {
    timeZone: "Asia/Karachi",
    day: "2-digit", 
    month: "short", 
    year: "numeric",
    hour: "numeric", 
    minute: "2-digit", 
    hour12: true
  });
};

/**
 * Gets current date and time in ISO format for PST timezone (for database storage)
 * @returns {string} Current date and time in ISO format adjusted for PST
 */
export const getCurrentPSTISOString = () => {
  const now = new Date();
  // Convert to PST and then to ISO string
  const pstDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  return pstDate.toISOString();
};