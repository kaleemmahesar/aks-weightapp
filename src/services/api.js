import axios from 'axios';

// Using PHP backend
const API_BASE_URL = 'http://localhost/weightscale';

const api = {
  // Authentication
  login: async (credentials) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/index.php?action=login`, credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Records
  getRecords: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/index.php?action=getRecords`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // First Weight
  saveFirstWeight: async (recordData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=saveFirstWeight`,
        recordData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Second Weight
  saveSecondWeight: async (recordData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=saveSecondWeight`,
        recordData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Final Weight
  saveFinalWeight: async (recordData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=saveFinalWeight`,
        recordData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update Record
  updateRecord: async (recordData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=updateRecord`,
        recordData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get Settings
  getSettings: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/index.php?action=getSettings`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update Settings
  updateSettings: async (settingsData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=updateSettings`,
        settingsData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Expenses
  getExpenses: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/index.php?action=getExpenses`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  addExpense: async (expenseData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=addExpense`,
        expenseData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateExpense: async (expenseData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=updateExpense`,
        expenseData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteExpense: async (expenseId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/index.php?action=deleteExpense`,
        { id: expenseId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default api;