import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PrintModal from "../components/PrintModal";
import EditRecordModal from "./EditModal";
import { FaFileInvoice } from "react-icons/fa";
import { setSelectedRecord, fetchRecords } from "../redux/slices/recordsSlice";
import { fetchExpenses } from "../redux/slices/expenseSlice";
import RecordsFilters from "./RecordsFilters";
import FinancialSummary from "./FinancialSummary";
import RecordsGrid from "./RecordsGrid";
import Pagination from "./Pagination";
import ReportGenerator from "./ReportGenerator";

export default function RecordsPage() {
  const dispatch = useDispatch();
  const { records = [], selectedRecord: reduxSelectedRecord } = useSelector(state => state.records || {});
  const { expenses = [] } = useSelector(state => state.expenses || {});
  
  // Initialize state with localStorage values or defaults
  const getInitialState = (key, defaultValue) => {
    const saved = localStorage.getItem(`recordsPage_${key}`);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
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
  const [reportType, setReportType] = useState(() => getInitialState('reportType', "daily"));
  const [selectedMonth, setSelectedMonth] = useState(() => getInitialState('selectedMonth', new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(() => getInitialState('selectedYear', new Date().getFullYear()));
  const [customFromDate, setCustomFromDate] = useState(() => getInitialState('customFromDate', ""));
  const [customToDate, setCustomToDate] = useState(() => getInitialState('customToDate', ""));
  const [partyFilter, setPartyFilter] = useState(() => getInitialState('partyFilter', ""));
  const [productFilter, setProductFilter] = useState(() => getInitialState('productFilter', ""));
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState(() => getInitialState('vehicleTypeFilter', ""));
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
        if (records.length === 0) {
          await dispatch(fetchRecords());
        }
        if (expenses.length === 0) {
          await dispatch(fetchExpenses());
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [dispatch, records.length, expenses.length]);

  // Get unique values for filter dropdowns
  const uniqueParties = [...new Set(records.map(r => r.party_name).filter(Boolean))];
  const uniqueProducts = [...new Set(records.map(r => r.product).filter(Boolean))];
  const uniqueVehicleTypes = [...new Set(records.map(r => r.vehicle_type).filter(Boolean))];

  const filteredRecords = records.filter((r) => {
    // ✅ Search filter
    const matchesSearch = search
      ? r.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
        r.vehicle_type.toLowerCase().includes(search.toLowerCase()) ||
        r.product?.toLowerCase().includes(search.toLowerCase()) ||
        r.party_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toString().includes(search)
      : true;

    // ✅ Party filter
    const matchesParty = partyFilter ? r.party_name === partyFilter : true;

    // ✅ Product filter
    const matchesProduct = productFilter ? r.product === productFilter : true;

    // ✅ Vehicle type filter
    const matchesVehicleType = vehicleTypeFilter ? r.vehicle_type === vehicleTypeFilter : true;

    // ✅ Report type filter
    const matchesReportType = (() => {
      const today = new Date();
      const recordDate = new Date(r.date || r.first_weight_time);
      
      if (isNaN(recordDate)) return false;

      switch (reportType) {
        case 'daily':
          const todayStr = today.toISOString().split('T')[0];
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
  });

  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

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
    const type = record.final_weight === "Yes" ? "final" : "first";
    setEditRecord(record);
    setEditSlipType(type);
    setEditModalShow(true);
    dispatch(setSelectedRecord(record));
  };

  const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage(p => Math.min(p + 1, totalPages));

  // Function to clear all filters
  const clearAllFilters = () => {
    setSearch("");
    setPartyFilter("");
    setProductFilter("");
    setVehicleTypeFilter("");
    setReportType("daily");
    setSelectedMonth(new Date().getMonth() + 1);
    setSelectedYear(new Date().getFullYear());
    setCustomFromDate("");
    setCustomToDate("");
    setCurrentPage(1);
  };

  // Function to generate customer PDF (without financial info)
  const generateCustomerPDF = () => {
    // Calculate total net weight and records count from filtered records
    const totalNetWeight = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0);
    const totalMunds = totalNetWeight / 40; // 1 Mund = 40 kg
    const totalRecords = filteredRecords.length;

    // Create HTML content for customer report (no financial info)
    const win = window.open("", "", "width=800,height=600");
    if (!win) {
      alert("Popup blocked! Please allow popups for PDF generation.");
      return;
    }

    // Build filter information string
    const filterInfo = [];
    if (partyFilter) filterInfo.push(`Party: ${partyFilter}`);
    if (productFilter) filterInfo.push(`Product: ${productFilter}`);
    if (vehicleTypeFilter) filterInfo.push(`Vehicle Type: ${vehicleTypeFilter}`);
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

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Customer Report - ${dateRange}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    html, body { 
      margin: 0; 
      padding: 0; 
      font-family: Tahoma, Verdana, Arial, sans-serif;
      font-size: 14px;
      color: #000;
      line-height: 1.4;
      letter-spacing: 0.5px;
    }

    .report-container {
      width: 70mm;
      margin: 0 auto;
      border: 1px solid #000;
      padding: 6px;
      background: #fff;
      box-sizing: border-box;
    }

    .header {
      text-align: center;
      border-bottom: 1px solid #000;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }

    .company-name {
      font-size: 18px;
      font-weight: bold;
    }

    .company-details {
      font-size: 10px;
      margin: 1px 0;
    }

    .report-title {
      text-align: center;
      font-size: 12px;
      font-weight: bold;
      margin-bottom: 6px;
    }

    .content-section {
      margin: 6px 0;
    }

    .section-title {
      text-align: center;
      font-size: 11px;
      font-weight: bold;
      border-bottom: 1px solid #000;
      padding-bottom: 2px;
      margin-bottom: 6px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin: 4px 0;
      border-bottom: 1px dotted #999;
      font-size: 11px;
      align-items: center;
    }

    .info-label {
      font-weight: bold;
      display: inline-block;
      min-width: 70px;
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
      margin: 8px 0;
      font-size: 10px;
    }

    th, td {
      text-align: left;
      padding: 3px 2px;
      border-bottom: 1px solid #000;
    }

    th {
      font-weight: bold;
      font-size: 11px;
    }

    .text-center {
      text-align: center;
    }

    .text-right {
      text-align: right;
    }

    .footer {
      padding-top: 6px;
      margin-top: 8px;
      text-align: center;
      font-size: 10px;
      border-top: 1px solid #000;
    }

    .signature-line {
      margin: 8px 0;
      font-size: 10px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="company-name">AWAMI KANTA</div>
      <div class="company-details">Miro Khan Road, Larkana</div>
    </div>

    <div class="report-title">${dateRange}</div>
    <div style="text-align: center; font-size: 10px; margin-bottom: 8px;">
      ${new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
    </div>

    <!-- Filter Information -->
    <div class="content-section">
      <div class="section-title">FILTERS APPLIED</div>
      <div style="font-size: 10px; padding: 4px 0;">
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
        <span class="info-value">${totalMunds.toFixed(2)} Munds</span>
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
            <th>Vehicle</th>
            <th>Party</th>
            <th>Munds</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRecords.map(record => {
            const netWeight = parseFloat(record.net_weight) || 0;
            const munds = netWeight / 40; // 1 Mund = 40 kg
            return `
            <tr>
              <td>${record.id}</td>
              <td>${record.vehicle_number || '-'}</td>
              <td>${record.party_name || '-'}</td>
              <td>${munds.toFixed(2)} Munds</td>
            </tr>
          `}).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <div class="signature-line">Operator: _____________</div>
      <div class="signature-line">Customer: _____________</div>
      <div style="margin-top: 8px; font-size: 8px;">
        Software by <span style="display:inline-block;padding:2px 8px;font-weight:bold;border:1px solid #000;border-radius:6px;background:#f0f0f0">AKS</span> Solutions
      </div>
    </div>
  </div>
</body>
</html>`;

    win.document.write(html);
    win.document.close();

    // Wait for content to load then print
    const waitForResourcesAndPrint = async () => {
      try {
        // Wait for fonts to load
        if (win.document.fonts && win.document.fonts.ready) {
          await win.document.fonts.ready;
        }
      } catch (e) {
        // ignore font loading errors
      }

      // Small delay to let layout settle
      setTimeout(() => {
        try { 
          win.focus(); 
          win.print(); 
        } catch (e) { 
          console.log('Print error:', e);
        }
        try { 
          win.close(); 
        } catch (e) {}
      }, 100);
    };

    // Start the print process
    if (win.document.readyState === 'complete') {
      waitForResourcesAndPrint();
    } else {
      win.onload = waitForResourcesAndPrint;
      setTimeout(() => {
        if (!win.closed) waitForResourcesAndPrint();
      }, 1000);
    }
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
                  <button className="btn btn-primary w-100 d-block" onClick={generateCustomerPDF}>
                    <FaFileInvoice className="me-2" />
                    Generate Customer Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Overview Section */}
        <FinancialSummary 
          financialStats={financialStats} 
          reportType={reportType} 
          formatCurrency={formatCurrency} 
        />

        {/* Records Grid */}
        <RecordsGrid 
          paginatedRecords={paginatedRecords} 
          openEditModal={openEditModal} 
          openPrintModal={openPrintModal} 
        />

        {/* Pagination & Grand Total */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          handlePrev={handlePrev}
          handleNext={handleNext}
          grandTotal={grandTotal}
          filteredRecordsLength={filteredRecords.length}
        />

        {reduxSelectedRecord && <PrintModal show={showPrintModal} slipType={slipType} onClose={closePrintModal} />}
        {editModalShow && editRecord && <EditRecordModal show={editModalShow} onClose={() => setEditModalShow(false)} record={editRecord} slipType={editSlipType} />}
      </div>
    </div>
  );
}