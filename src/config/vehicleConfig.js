// Common vehicle types and prices configuration for all forms
export const STANDARD_VEHICLE_PRICES = {
  "Daalo": 100,
  "Tractor": 300,
  "GadahGano": 100,
  "Mazda": 300,
  "Datson": 150,
  "Shahzore": 150,
  "Chingchi": 100,
  "Truck": 250,
  "Trailer": 350,
  "Container": 400,
  "Daala": 200,
  "RocketDouble": 200,
  "Bike": 50,
  "Bags" : 100,
  "DahWheeler": 500,
  "SixWheeler": 400,
  
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
