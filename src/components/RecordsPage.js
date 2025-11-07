import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PrintModal from "../components/PrintModal";
import EditRecordModal from "./EditModal";
import { FaFileInvoice } from "react-icons/fa";
import { setSelectedRecord, fetchRecords } from "../redux/slices/recordsSlice";
import { fetchExpenses } from "../redux/slices/expenseSlice";
import { fetchSettings } from "../redux/slices/settingsSlice";
import RecordsFilters from "./RecordsFilters";
import FinancialSummary from "./FinancialSummary";
import RecordsTable from "./RecordsTable";
import Pagination from "./Pagination";
import ReportGenerator from "./ReportGenerator";

export default function RecordsPage() {
  const dispatch = useDispatch();
  const { records = [], selectedRecord: reduxSelectedRecord } = useSelector(state => state.records || {});
  const { expenses = [] } = useSelector(state => state.expenses || {});
  const { settings = {} } = useSelector(state => state.settings || {});
  
  // Initialize state with localStorage values or defaults
  const getInitialState = (key, defaultValue) => {
    const saved = localStorage.getItem(`recordsPage_${key}`);
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        // Special validation for reportType to ensure it's always a valid value
        if (key === 'reportType') {
          const validReportTypes = ['daily', 'monthly', 'yearly', 'overall', 'custom'];
          const isValid = validReportTypes.includes(parsed);
          return isValid ? parsed : defaultValue;
        }
        // Special handling for filter arrays to ensure they're always arrays
        if (key === 'vehicleTypeFilter' || key === 'partyFilter' || key === 'productFilter') {
          return Array.isArray(parsed) ? parsed : defaultValue;
        }
        return parsed;
      } catch (e) {
        return defaultValue;
      }
    }
    return defaultValue;
  };
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("first");
  const [search, setSearch] = useState(() => getInitialState('search', ""));
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalShow, setEditModalShow] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editSlipType, setEditSlipType] = useState("first");
  const [reportType, setReportType] = useState(() => getInitialState('reportType', "overall"));
  const [selectedMonth, setSelectedMonth] = useState(() => getInitialState('selectedMonth', new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(() => getInitialState('selectedYear', new Date().getFullYear()));
  const [customFromDate, setCustomFromDate] = useState(() => getInitialState('customFromDate', ""));
  const [customToDate, setCustomToDate] = useState(() => getInitialState('customToDate', ""));
  const [partyFilter, setPartyFilter] = useState(() => getInitialState('partyFilter', []));
  const [productFilter, setProductFilter] = useState(() => getInitialState('productFilter', []));
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(() => getInitialState('vehicleTypeFilter', []));
  const [loading, setLoading] = useState(true);

  // Save filter state to localStorage whenever filters change
  useEffect(() => {
    localStorage.setItem('recordsPage_search', JSON.stringify(search));
  }, [search]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_reportType', JSON.stringify(reportType));
  }, [reportType]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_selectedMonth', JSON.stringify(selectedMonth));
  }, [selectedMonth]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_selectedYear', JSON.stringify(selectedYear));
  }, [selectedYear]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_customFromDate', JSON.stringify(customFromDate));
  }, [customFromDate]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_customToDate', JSON.stringify(customToDate));
  }, [customToDate]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_partyFilter', JSON.stringify(partyFilter));
  }, [partyFilter]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_productFilter', JSON.stringify(productFilter));
  }, [productFilter]);
  
  useEffect(() => {
    localStorage.setItem('recordsPage_vehicleTypeFilter', JSON.stringify(vehicleTypeFilter));
  }, [vehicleTypeFilter]);

  const recordsPerPage = 12;

  // Fetch records and expenses when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Always fetch records to ensure we have the latest data from the database
        await dispatch(fetchRecords());
        await dispatch(fetchExpenses());
        // Also fetch settings to ensure we have the latest vehicle types
        dispatch(fetchSettings());
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch]);

  // Get unique values for filter dropdowns
  const uniqueParties = [...new Set(records.map(r => r.party_name).filter(Boolean))];
  const uniqueProducts = [...new Set(records.map(r => r.product).filter(Boolean))];
  
  // Get unique vehicle types from both records and settings
  const uniqueVehicleTypes = [...new Set([
    ...records.map(r => r.vehicle_type).filter(Boolean),
    ...Object.keys(settings.vehiclePrices || {})
  ])];

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch("");
    setPartyFilter([]);
    setProductFilter([]);
    setVehicleTypeFilter([]);
    setReportType("overall");
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setCustomFromDate("");
    setCustomToDate("");
    setCurrentPage(1);
  };

  // Filter records based on search and filters
  const filteredRecords = records.filter((r) => {
    try {
      // ✅ Search filter - handle empty or undefined values safely
      const matchesSearch = search
        ? (r.vehicle_number && r.vehicle_number.toLowerCase().includes(search.toLowerCase())) ||
          (r.vehicle_type && r.vehicle_type.toLowerCase().includes(search.toLowerCase())) ||
          (r.product && r.product.toLowerCase().includes(search.toLowerCase())) ||
          (r.party_name && r.party_name.toLowerCase().includes(search.toLowerCase())) ||
          r.id.toString().includes(search)
        : true;

      // ✅ Party filter - updated for multiple selection
      const matchesParty = partyFilter.length > 0 ? partyFilter.includes(r.party_name) : true;

      // ✅ Product filter - updated for multiple selection
      const matchesProduct = productFilter.length > 0 ? productFilter.includes(r.product) : true;

      // ✅ Vehicle type filter - updated for multiple selection
      const matchesVehicleType = vehicleTypeFilter.length > 0 ? vehicleTypeFilter.includes(r.vehicle_type) : true;

      // ✅ Report type filter
      const matchesReportType = (() => {
        // Handle different date formats properly
        let recordDate;
        
        // Try to parse the date string properly
        if (r.date) {
          recordDate = new Date(r.date);
        } else if (r.first_weight_time) {
          // Handle the format "2025-11-05 16:29:22"
          if (typeof r.first_weight_time === 'string' && r.first_weight_time.includes(' ')) {
            const [datePart, timePart] = r.first_weight_time.split(' ');
            const [year, month, day] = datePart.split('-');
            const [hour, minute, second] = timePart.split(':');
            recordDate = new Date(year, month - 1, day, hour, minute, second);
          } else {
            recordDate = new Date(r.first_weight_time);
          }
        }
        
        // If we can't parse a valid date, and we're not in overall mode, filter out the record
        if (!recordDate || isNaN(recordDate.getTime())) {
          // For overall report type, we still want to show records without valid dates
          return reportType === 'overall';
        }

        switch (reportType) {
          case 'daily':
            const todayStr = new Date().toISOString().split('T')[0];
            const dailyRecordDateStr = recordDate.toISOString().split('T')[0];
            return dailyRecordDateStr === todayStr;
            
          case 'monthly':
            return recordDate.getMonth() + 1 === selectedMonth && recordDate.getFullYear() === selectedYear;
            
          case 'yearly':
            return recordDate.getFullYear() === selectedYear;
            
          case 'overall':
            return true;
            
          case 'custom':
            if (!customFromDate || !customToDate) return true;
            const customRecordDateStr = recordDate.toISOString().split('T')[0];
            return customRecordDateStr >= customFromDate && customRecordDateStr <= customToDate;
            
          default:
            return true;
        }
      })();

      return matchesSearch && matchesParty && matchesProduct && matchesVehicleType && matchesReportType;
    } catch (error) {
      console.error('Error filtering record:', error, r);
      // If there's an error in filtering, show the record to avoid hiding it
      return true;
    }
  });
  
  const grandTotal = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);

  // Financial calculations for stats cards
  // Helper function to get expense date (handles both 'date' and 'expense_date' properties)
  const getExpenseDate = (expense) => {
    const dateValue = expense.date || expense.expense_date;
    if (!dateValue) return null;
    return new Date(dateValue).toISOString().split('T')[0];
  };

  const calculateFinancialStats = () => {
    // Total revenue from all records (not just filtered)
    const totalRevenue = records.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    
    // Regular business expenses (excluding deposits to owner)
    const regularExpenses = expenses.reduce((sum, exp) => {
      if (exp.category !== 'Deposit to Owner') {
        return sum + (parseFloat(exp.amount) || 0);
      }
      return sum;
    }, 0);
    
    // Total expenses (for display purposes)
    const totalExpensesAmount = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Bank Deposits (expenses with category "Deposit to Owner")
    const bankDeposits = expenses.reduce((sum, exp) => {
      if (exp.category === 'Deposit to Owner') {
        return sum + (parseFloat(exp.amount) || 0);
      }
      return sum;
    }, 0);
    
    // Net profit (revenue minus regular business expenses only)
    const netProfit = totalRevenue - regularExpenses;
    
    // Available cash (what's left for the owner after bank deposits)
    const availableCash = netProfit - bankDeposits;
    
    // Today's calculations
    const today = new Date().toISOString().split('T')[0];
    const todayRevenue = records.reduce((sum, r) => {
      const recordDate = r.first_weight_time ? new Date(r.first_weight_time).toISOString().split('T')[0] : null;
      if (recordDate === today) {
        return sum + (parseFloat(r.total_price) || 0);
      }
      return sum;
    }, 0);
    
    const todayExpenses = expenses.reduce((sum, exp) => {
      const expenseDate = getExpenseDate(exp);
      if (expenseDate === today) {
        return sum + (parseFloat(exp.amount) || 0);
      }
      return sum;
    }, 0);
    
    // Today's regular expenses (excluding deposits to owner)
    const todayRegularExpenses = expenses.reduce((sum, exp) => {
      const expenseDate = getExpenseDate(exp);
      if (expenseDate === today && exp.category !== 'Deposit to Owner') {
        return sum + (parseFloat(exp.amount) || 0);
      }
      return sum;
    }, 0);
    
    const todayProfit = todayRevenue - todayRegularExpenses;

    // Define todayString for use in multiple places
    const todayString = new Date().toISOString().split('T')[0];

    // Filtered stats based on report type (for header display)
    const getFilteredExpenses = () => {
      switch (reportType) {
        case 'daily':
          return expenses.filter(e => {
            const expenseDate = getExpenseDate(e);
            return expenseDate === todayString;
          });
        case 'monthly':
          return expenses.filter(e => {
            const dateValue = e.date || e.expense_date;
            if (!dateValue) return false;
            const expenseDate = new Date(dateValue);
            return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear;
          });
        case 'yearly':
          return expenses.filter(e => {
            const dateValue = e.date || e.expense_date;
            if (!dateValue) return false;
            return new Date(dateValue).getFullYear() === selectedYear;
          });
        case 'overall':
          return expenses;
        default:
          return expenses;
      }
    };

    const filteredExpenses = getFilteredExpenses();

  
    
    // Use today's values for daily reports, otherwise use filtered calculations
    const filteredRevenue = reportType === 'daily' ? todayRevenue : filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    const filteredExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    
    // Filtered regular expenses (excluding deposits to owner)
    const filteredRegularExpenses = reportType === 'daily' ? todayRegularExpenses : filteredExpenses.reduce((sum, exp) => {
      if (exp.category !== 'Deposit to Owner') {
        return sum + (parseFloat(exp.amount) || 0);
      }
      return sum;
    }, 0);
    
    // Use todayProfit for daily reports, otherwise use calculated filteredProfit
    const filteredProfit = reportType === 'daily' ? todayProfit : filteredRevenue - filteredRegularExpenses;
    
    // Filtered deposits to owner - use today's deposits for daily reports
    const filteredDeposits = reportType === 'daily' ? 
      expenses.reduce((sum, exp) => {
        const expenseDate = getExpenseDate(exp);
        if (expenseDate === todayString && exp.category === 'Deposit to Owner') {
          return sum + (parseFloat(exp.amount) || 0);
        }
        return sum;
      }, 0) :
      filteredExpenses.reduce((sum, exp) => {
        if (exp.category === 'Deposit to Owner') {
          return sum + (parseFloat(exp.amount) || 0);
        }
        return sum;
      }, 0);
    
    // Calculate previous period for comparison
    const getPreviousPeriodData = () => {
      let previousRecords = [];
      let previousExpenses = [];
      
      switch (reportType) {
        case 'daily':
          // For daily reports, we need cumulative data up to yesterday
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          // Get all records and expenses up to and including yesterday
          previousRecords = records.filter(r => {
            const recordDate = new Date(r.date || r.first_weight_time);
            return recordDate.toISOString().split('T')[0] <= yesterdayStr;
          });
          
          previousExpenses = expenses.filter(e => {
            const expenseDate = getExpenseDate(e);
            return expenseDate <= yesterdayStr;
          });
          break;
          
        case 'monthly':
          // Previous month
          const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
          const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
          
          previousRecords = records.filter(r => {
            const recordDate = new Date(r.date || r.first_weight_time);
            return recordDate.getMonth() + 1 === prevMonth && recordDate.getFullYear() === prevYear;
          });
          
          previousExpenses = expenses.filter(e => {
            const dateValue = e.date || e.expense_date;
            if (!dateValue) return false;
            const expenseDate = new Date(dateValue);
            return expenseDate.getMonth() + 1 === prevMonth && expenseDate.getFullYear() === prevYear;
          });
          break;
          
        case 'yearly':
          // Previous year
          const prevYearValue = selectedYear - 1;
          
          previousRecords = records.filter(r => {
            const recordDate = new Date(r.date || r.first_weight_time);
            return recordDate.getFullYear() === prevYearValue;
          });
          
          previousExpenses = expenses.filter(e => {
            const dateValue = e.date || e.expense_date;
            if (!dateValue) return false;
            return new Date(dateValue).getFullYear() === prevYearValue;
          });
          break;
          
        case 'overall':
          // For overall, we can't really have a "previous" period, so return empty
          return { revenue: 0, regularExpenses: 0, deposits: 0, availableCash: 0 };
          
        default:
          return { revenue: 0, regularExpenses: 0, deposits: 0, availableCash: 0 };
      }
      
      // Calculate previous period values
      const prevRevenue = previousRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
      
      const prevRegularExpenses = previousExpenses.reduce((sum, exp) => {
        if (exp.category !== 'Deposit to Owner') {
          return sum + (parseFloat(exp.amount) || 0);
        }
        return sum;
      }, 0);
      
      const prevDeposits = previousExpenses.reduce((sum, exp) => {
        if (exp.category === 'Deposit to Owner') {
          return sum + (parseFloat(exp.amount) || 0);
        }
        return sum;
      }, 0);
      
      const prevProfit = prevRevenue - prevRegularExpenses;
      const prevAvailableCash = prevProfit - prevDeposits;
      
      return {
        revenue: prevRevenue,
        regularExpenses: prevRegularExpenses,
        deposits: prevDeposits,
        profit: prevProfit,
        availableCash: prevAvailableCash
      };
    };
    
    const previousPeriod = getPreviousPeriodData();
    
    // Calculate filtered available cash (cumulative for daily reports)
    let filteredAvailableCash;
    if (reportType === 'daily') {
      // For daily reports: previous remaining cash + today's profit - today's deposits
      filteredAvailableCash = previousPeriod.availableCash + filteredProfit - filteredDeposits;
    } else {
      // For other reports: profit minus deposits for the period
      filteredAvailableCash = filteredProfit - filteredDeposits;
    }
    
    return {
      totalRevenue,
      totalExpensesAmount,
      regularExpenses,
      netProfit,
      bankDeposits,
      availableCash,
      todayRevenue,
      todayExpenses,
      todayProfit,
      filteredRevenue,
      filteredExpensesAmount,
      filteredRegularExpenses,
      filteredProfit,
      filteredDeposits,
      filteredAvailableCash,
      previousPeriod,
      filteredRecordsLength: filteredRecords.length
    };
  };

  const financialStats = calculateFinancialStats();

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const openPrintModal = (record, type) => {
    // Create a new object with vehicle_id
    const updatedRecord = { ...record, vehicle_id: record.id };

    dispatch(setSelectedRecord(updatedRecord));
    setSlipType(type);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    dispatch(setSelectedRecord(null));
  };

  const openEditModal = (record) => {
    setEditModalShow(true);
    dispatch(setSelectedRecord(record));
  };

  // Function to generate customer report (print version instead of PDF)
  const generateCustomerReport = () => {
    // Calculate total net weight and records count from filtered records
    // Use absolute values to handle negative net weights correctly
    const totalNetWeight = filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
    const totalMunds = totalNetWeight / 40; // 1 Mund = 40 kg
    const totalRecords = filteredRecords.length;

    // Create HTML content for customer report (no financial info)
    const printWindow = window.open("", "", "width=800,height=600");
    if (!printWindow) {
      alert("Popup blocked! Please allow popups for report generation.");
      return;
    }

    // Build filter information string
    const filterInfo = [];
    if (partyFilter.length > 0) filterInfo.push(`Party: ${partyFilter.join(', ')}`);
    if (productFilter.length > 0) filterInfo.push(`Product: ${productFilter.join(', ')}`);
    if (vehicleTypeFilter.length > 0) filterInfo.push(`Vehicle Type: ${vehicleTypeFilter.join(', ')}`);
    if (search) filterInfo.push(`Search Term: ${search}`);
    
    // Add report type information
    let dateRange = '';
    switch (reportType) {
      case 'daily':
        const today = new Date();
        dateRange = `Daily Report - ${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        break;
      case 'monthly':
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        dateRange = `Monthly Report - ${monthName} ${selectedYear}`;
        break;
      case 'yearly':
        dateRange = `Yearly Report - ${selectedYear}`;
        break;
      case 'overall':
        dateRange = 'Overall Report - All Time';
        break;
      case 'custom':
        if (customFromDate && customToDate) {
          dateRange = `Custom Report - ${new Date(customFromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(customToDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        } else {
          dateRange = 'Custom Report';
        }
        break;
      default:
        dateRange = 'Report';
    }
    
    const filterString = filterInfo.length > 0 ? filterInfo.join(', ') : 'No additional filters applied';

    // Function to format weight without .00 decimals when not needed
    const formatWeight = (weight) => {
      if (!weight) return "-";
      const num = parseFloat(weight);
      if (isNaN(num)) return "-";
      
      // If it's a whole number, don't show decimals
      if (num % 1 === 0) {
        return num.toString();
      } else {
        // Otherwise, show one decimal place
        return num.toFixed(1);
      }
    };

    // Function to format date as "22/10/25 @ 8:34 pm"
    const formatDateTimeForDisplay = (dateString) => {
      if (!dateString) return "-";
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      
      // Format as "22/10/25 @ 8:34 pm"
      const day = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit" });
      const month = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", month: "2-digit" });
      const year = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", year: "2-digit" });
      let hour = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", hour: "numeric", hour12: false });
      const minute = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", minute: "2-digit" });
      
      // Convert to 12-hour format
      let ampm = "am";
      if (hour >= 12) {
        ampm = "pm";
        if (hour > 12) {
          hour = hour - 12;
        }
      }
      if (hour === 0) {
        hour = 12;
      }
      
      return `${day}/${month}/${year} @ ${hour}:${minute} ${ampm}`;
    };

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Report - ${dateRange}</title>
  <style>
    @media print {
      @page { margin: 15mm; size: A4; }
    }
    
    html, body { 
      margin: 0; 
      padding: 0; 
      font-family: 'Courier New', monospace !important;
      font-size: 10px; /* Smaller font size */
      color: #000;
      line-height: 1.3;
    }

    .report-container {
      max-width: 210mm;
      margin: 0 auto;
      padding: 15mm;
      background: #fff;
      box-sizing: border-box;
    }

    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .company-name {
      font-size: 20px;
      font-weight: bold;
      color: #2c3e50;
    }

    .company-details {
      font-size: 12px;
      margin: 4px 0;
      color: #34495e;
    }

    .report-title {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin: 12px 0;
      color: #1a5276;
    }

    .report-date {
      text-align: center;
      font-size: 11px;
      margin-bottom: 12px;
      color: #7f8c8d;
    }

    .content-section {
      margin: 12px 0;
      page-break-inside: avoid;
    }

    .section-title {
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
      margin-bottom: 8px;
      color: #2c3e50;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 6px 0;
      border-bottom: 1px dotted #999;
      font-size: 11px;
      align-items: center;
    }

    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 120px;
      white-space: normal;
    }

    .info-value {
      font-size: 12px;
      font-weight: bold;
      display: inline-block;
      white-space: normal;
      word-break: break-word;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9px; /* Smaller font size for table */
      page-break-inside: auto;
    }

    thead { 
      display: table-header-group; 
    }
    
    tfoot { 
      display: table-footer-group; 
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    th, td {
      text-align: left;
      padding: 4px 3px;
      border: 1px solid #000;
    }

    th {
      font-weight: bold;
      font-size: 10px;
      background-color: #ecf0f1;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .footer {
      padding-top: 12px;
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
      border-top: 2px solid #000;
      page-break-inside: avoid;
    }

    .signature-line {
      margin: 12px 0;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
      <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
    </div>

    <div class="report-title">${dateRange}</div>
    <div class="report-date">
      Report Generated: ${new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: '2-digit', 
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>

    <!-- Filter Information -->
    <div class="content-section">
      <div class="section-title">FILTERS APPLIED</div>
      <div style="font-size: 11px; padding: 6px 0;">
        ${filterString}
      </div>
    </div>

    <!-- Financial Summary -->
    <div class="content-section">
      <div class="section-title">SUMMARY</div>
      <div class="info-row">
        <span class="info-label">Total Records:</span>
        <span class="info-value">${totalRecords}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Munds:</span>
        <span class="info-value">${(() => {
      const mundsInteger = Math.floor(totalMunds);
      const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
      return `${mundsInteger}-${remainingKgs}`;
    })()} Munds</span>
      </div>
      <div class="info-row">
        <span class="info-label">Total Net Weight:</span>
        <span class="info-value">${totalNetWeight.toFixed(2)} kg</span>
      </div>
    </div>

    <!-- Records Table -->
    <div class="content-section">
      <div class="section-title">RECORDS</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Date</th>
            <th>Vehicle</th>
            <th>Party</th>
            <th>Product</th>
            <th>F.Weight</th>
            <th>S.Weight</th>
            <th>Net Weight</th>
            <th>Net Munds</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRecords.map(record => {
            const netWeight = parseFloat(record.net_weight) || 0;
            // Use Math.trunc() to handle negative numbers correctly
            const netMunds = Math.trunc(netWeight / 40);
            const firstWeight = parseFloat(record.first_weight) || 0;
            const secondWeight = parseFloat(record.second_weight) || 0;
            const recordDate = record.date || record.first_weight_time || '';
            return `
            <tr>
              <td>${record.id}</td>
              <td>${recordDate ? formatDateTimeForDisplay(recordDate) : '-'}</td>
              <td>${record.vehicle_number || '-'}</td>
              <td>${record.party_name || '-'}</td>
              <td>${record.product || '-'}</td>
              <td>${formatWeight(firstWeight)}</td>
              <td>${formatWeight(secondWeight)}</td>
              <td>${formatWeight(netWeight)} kg</td>
              <td>${netMunds.toFixed(2)} Munds</td>
              <td>Rs ${(parseFloat(record.total_price) || 0).toLocaleString()}</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="signature-line">Operator: _____________</div>
      <div class="signature-line">Customer: _____________</div>
      <div style="margin-top: 12px; font-size: 9px;">
        Software by <span style="display:inline-block;padding:3px 8px;font-weight:bold;border:1px solid #000;border-radius:6px;background:#f0f0f0">AKS Solutions</span> - Business Solution by Kaleem Mahesar
      </div>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="container-fluid py-4">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading records and expenses...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="weight-form-card mb-4">
          <div className="weight-form-header" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <div className="weight-form-header-content d-flex align-items-center justify-content-between">
              <h4 className="text-white mb-0">Records Management System</h4>
              <b className="text-white-50">{filteredRecords.length} records | Total: PKR {grandTotal.toLocaleString()}</b>
            </div>
          </div>
          <div className="weight-form-body">
            {/* Search and Report Generation Section */}
            <div className="row g-3">
              <RecordsFilters
                search={search}
                setSearch={setSearch}
                reportType={reportType}
                setReportType={setReportType}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                customFromDate={customFromDate}
                setCustomFromDate={setCustomFromDate}
                customToDate={customToDate}
                setCustomToDate={setCustomToDate}
                setCurrentPage={setCurrentPage}
                partyFilter={partyFilter}
                setPartyFilter={setPartyFilter}
                productFilter={productFilter}
                setProductFilter={setProductFilter}
                vehicleTypeFilter={vehicleTypeFilter}
                setVehicleTypeFilter={setVehicleTypeFilter}
                uniqueParties={uniqueParties}
                uniqueProducts={uniqueProducts}
                uniqueVehicleTypes={uniqueVehicleTypes}
                onClearFilters={clearAllFilters}
              />
              <div className="col-md-3">
                <label className="form-label text-muted fw-semibold">&nbsp;</label>
                <div className="d-grid gap-2">
                  <ReportGenerator
                    records={records}
                    expenses={expenses}
                    reportType={reportType}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    customFromDate={customFromDate}
                    customToDate={customToDate}
                    filteredRecords={filteredRecords} // Pass filtered records
                    partyFilter={partyFilter}
                    productFilter={productFilter}
                    vehicleTypeFilter={vehicleTypeFilter}
                    search={search}
                  />
                  <button className="btn btn-primary w-100 d-block" onClick={generateCustomerReport}>
                    <FaFileInvoice className="me-2" />
                    Print Customer Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Records Table - Replacing RecordsGrid */}
        <div className="mt-4">
          <RecordsTable 
            records={filteredRecords} 
            expenses={expenses}
            openPrintModal={openPrintModal} 
            onUpdateRecord={() => dispatch(fetchRecords())}
            vehiclePrices={[]} // Pass empty array for now
            slipType="first" // Default slip type
          />
        </div>

        {/* Removing the old Pagination component since RecordsTable has its own pagination */}
        {/* Pagination & Grand Total - This section is now handled by RecordsTable */}
        
        {reduxSelectedRecord && <PrintModal show={showPrintModal} slipType={slipType} onClose={closePrintModal} />}
        {editModalShow && editRecord && <EditRecordModal show={editModalShow} onClose={() => setEditModalShow(false)} record={editRecord} slipType={editSlipType} />}
      </div>
    </div>
  );
}
