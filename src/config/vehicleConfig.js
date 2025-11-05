// Common vehicle types and prices configuration for all forms
export const STANDARD_VEHICLE_PRICES = {
  
};

// Common product types for all forms
export const STANDARD_PRODUCTS = [
  { value: "Select", label: "Select Product" },
  { value: "Cement", label: "Cement" },
  { value: "Steel", label: "Steel" },
  { value: "Sand", label: "Sand" },
  { value: "Woods", label: "Woods" },
  { value: "Chicken", label: "Chicken" },
  { value: "Gravel", label: "Gravel" },
  { value: "Stone", label: "Stone" }
];

// Default vehicle type
export const DEFAULT_VEHICLE_TYPE = "Truck";

// Helper function to get vehicle prices with fallback
export const getVehiclePrices = (settingsVehiclePrices = {}) => {
  return {
    ...STANDARD_VEHICLE_PRICES,
    ...settingsVehiclePrices
  };
};
