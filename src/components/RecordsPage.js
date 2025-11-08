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
        if (key === 'vehicleTypeFilter' || key === 'partyFilter' || key === 'productFilter' || key === 'businessNameFilter') {
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
  const [businessNameFilter, setBusinessNameFilter] = useState(() => getInitialState('businessNameFilter', []));
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
  
  useEffect(() => {
    localStorage.setItem('recordsPage_businessNameFilter', JSON.stringify(businessNameFilter));
  }, [businessNameFilter]);

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

  // Get unique values for filter dropdowns (case-insensitive to avoid duplicates while preserving original case)
  const getUniqueCaseInsensitive = (items) => {
    const seen = new Map(); // Use Map to store the canonical form
    const uniqueItems = [];
    
    items.forEach(item => {
      const upperItem = item.toUpperCase();
      if (!seen.has(upperItem)) {
        seen.set(upperItem, item); // Store the first occurrence as canonical
        uniqueItems.push(item);
      }
    });
    
    return uniqueItems;
  };
  
  const uniqueParties = getUniqueCaseInsensitive(records.map(r => r.party_name).filter(Boolean));
  const uniqueProducts = getUniqueCaseInsensitive(records.map(r => r.product).filter(Boolean));
  const uniqueBusinessNames = getUniqueCaseInsensitive(records.map(r => r.business_name).filter(Boolean));
  
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
    setBusinessNameFilter([]);
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
          (r.business_name && r.business_name.toLowerCase().includes(search.toLowerCase())) ||
          r.id.toString().includes(search)
        : true;

      // ✅ Party filter - updated for multiple selection with case-insensitive matching
      const matchesParty = partyFilter.length > 0 
        ? partyFilter.some(filterValue => 
            r.party_name && r.party_name.toLowerCase() === filterValue.toLowerCase())
        : true;

      // ✅ Product filter - updated for multiple selection with case-insensitive matching
      const matchesProduct = productFilter.length > 0 
        ? productFilter.some(filterValue => 
            r.product && r.product.toLowerCase() === filterValue.toLowerCase())
        : true;

      // ✅ Vehicle type filter - updated for multiple selection
      const matchesVehicleType = vehicleTypeFilter.length > 0 ? vehicleTypeFilter.includes(r.vehicle_type) : true;

      // ✅ Business name filter - updated for multiple selection with case-insensitive matching
      const matchesBusinessName = businessNameFilter.length > 0 
        ? businessNameFilter.some(filterValue => 
            r.business_name && r.business_name.toLowerCase() === filterValue.toLowerCase())
        : true;

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

      return matchesSearch && matchesParty && matchesProduct && matchesVehicleType && matchesBusinessName && matchesReportType;
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
          
        default:
          // For overall and custom reports, use all previous data
          previousRecords = records;
          previousExpenses = expenses;
      }
      
      const previousRevenue = previousRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
      const previousRegularExpenses = previousExpenses.reduce((sum, exp) => {
        if (exp.category !== 'Deposit to Owner') {
          return sum + (parseFloat(exp.amount) || 0);
        }
        return sum;
      }, 0);
      const previousProfit = previousRevenue - previousRegularExpenses;
      
      return {
        revenue: previousRevenue,
        profit: previousProfit,
        records: previousRecords.length
      };
    };
    
    const previousData = getPreviousPeriodData();
    
    return {
      revenue: filteredRevenue,
      expenses: filteredExpensesAmount,
      profit: filteredProfit,
      deposits: filteredDeposits,
      availableCash,
      previous: previousData
    };
  };

  const financialStats = calculateFinancialStats();

  // Pagination
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  // Print modal functions
  const openPrintModal = (record, type) => {
    dispatch(setSelectedRecord(record));
    setSlipType(type);
    setShowPrintModal(true);
  };

  const closePrintModal = () => {
    setShowPrintModal(false);
    dispatch(setSelectedRecord(null));
  };

  // Customer report generation
  const generateCustomerReport = () => {
    // Create a new window for the report
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Generate HTML content for the report
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Customer Report</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 15mm;
          }
          
          .report-container {
            max-width: 100%;
          }
          
          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 12px;
            margin-bottom: 16px;
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
            font-size: 18px;
            font-weight: bold;
            margin: 16px 0;
            color: #1a5276;
          }
          
          .report-date {
            text-align: center;
            font-size: 12px;
            margin-bottom: 16px;
            color: #7f8c8d;
          }
          
          .content-section {
            margin: 16px 0;
            page-break-inside: avoid;
          }
          
          .section-title {
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
            font-size: 12px;
            align-items: center;
          }
          
          .info-label {
            font-weight: bold;
            display: inline-block;
            min-width: 140px;
            white-space: normal;
          }
          
          .info-value {
            font-size: 13px;
            font-weight: bold;
            display: inline-block;
            white-space: normal;
            word-break: break-word;
          }
          
          .customer-item {
            margin: 4px 0;
            padding: 2px 0;
          }
          
          .customer-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 11px;
            align-items: center;
          }
          
          .customer-label {
            font-weight: normal;
            display: inline-block;
            min-width: 120px;
            white-space: normal;
            font-size: 9px;
          }

          .customer-value {
            font-size: 10px;
            font-weight: bold;
            display: inline-block;
            white-space: normal;
            word-break: break-word;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
            font-size: 9px;
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

          <div class="report-title">CUSTOMER SUMMARY REPORT</div>
          <div class="report-date">
            Report Generated: ${new Date().toLocaleString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          <!-- Customer Summary -->
          <div class="content-section">
            <div class="section-title">CUSTOMER SUMMARY</div>
            ${(() => {
              // Group records by party name
              const partyGroups = {};
              filteredRecords.forEach(record => {
                const party = record.party_name || 'Unknown';
                if (!partyGroups[party]) {
                  partyGroups[party] = [];
                }
                partyGroups[party].push(record);
              });
              
              // Calculate totals for each party
              const partyTotals = Object.entries(partyGroups).map(([party, records]) => {
                const totalWeight = records.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
                const totalPrice = records.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
                const munds = totalWeight / 40;
                return {
                  party,
                  records: records.length,
                  weight: totalWeight,
                  munds,
                  price: totalPrice
                };
              });
              
              return partyTotals.map(partyTotal => `
                <div class="customer-item">
                  <div class="customer-row">
                    <span class="customer-label">${partyTotal.party} (${partyTotal.records} records):</span>
                    <span class="customer-value">${partyTotal.weight.toFixed(2)} kg | ${partyTotal.munds.toFixed(2)} Munds | Rs ${partyTotal.price.toLocaleString()}</span>
                  </div>
                </div>
              `).join('');
            })()}
          </div>

          <!-- Overall Summary -->
          <div class="content-section">
            <div class="section-title">OVERALL SUMMARY</div>
            <div class="info-row">
              <span class="info-label">Total Customers:</span>
              <span class="info-value">${(() => {
                const uniqueCustomers = [...new Set(filteredRecords.map(r => r.party_name).filter(Boolean))];
                return uniqueCustomers.length;
              })()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Records:</span>
              <span class="info-value">${filteredRecords.length}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Net Weight:</span>
              <span class="info-value">${filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0).toFixed(2)} kg</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Munds:</span>
              <span class="info-value">${(() => {
                const totalNetWeight = filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
                const totalMunds = totalNetWeight / 40;
                const mundsInteger = Math.floor(totalMunds);
                const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
                return `${mundsInteger}-${remainingKgs}`;
              })()} Munds</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Sales:</span>
              <span class="info-value">Rs ${filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0).toLocaleString()}</span>
            </div>
          </div>

          <div class="footer">
            <div>Report generated by Weight Scale Management System</div>
            <div class="signature-line">
              <div>___________________________</div>
              <div>Authorized Signature</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait a bit for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };

  // Thermal Owner report generation (79mm width for dot matrix printers)
  const generateThermalOwnerReport = () => {
    // Create a new window for the report
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Group records by date
    const recordsByDate = {};
    filteredRecords.forEach(record => {
      if (record.first_weight_time) {
        const date = new Date(record.first_weight_time);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = [];
        }
        recordsByDate[dateKey].push(record);
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(recordsByDate).sort();
    
    // Generate filter information for display
    const filterInfo = [];
    if (search) {
      filterInfo.push(`• Search: "${search.toUpperCase()}"`);
    }
    if (partyFilter && partyFilter.length > 0) {
      filterInfo.push(`• Party Names: ${partyFilter.map(name => name.toUpperCase()).join(', ')}`);
    }
    if (productFilter && productFilter.length > 0) {
      filterInfo.push(`• Products: ${productFilter.map(product => product.toUpperCase()).join(', ')}`);
    }
    if (vehicleTypeFilter && vehicleTypeFilter.length > 0) {
      filterInfo.push(`• Vehicle Types: ${vehicleTypeFilter.map(type => type.toUpperCase()).join(', ')}`);
    }
    if (businessNameFilter && businessNameFilter.length > 0) {
      filterInfo.push(`• Business Names: ${businessNameFilter.map(name => name.toUpperCase()).join(', ')}`);
    }
    if (reportType && reportType !== 'overall') {
      let reportTypeInfo = `• Report Type: ${reportType}`;
      if (reportType === 'monthly' && selectedMonth && selectedYear) {
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        reportTypeInfo += ` (${monthName} ${selectedYear})`;
      } else if (reportType === 'yearly' && selectedYear) {
        reportTypeInfo += ` (${selectedYear})`;
      } else if (reportType === 'custom' && customFromDate && customToDate) {
        reportTypeInfo += ` (${customFromDate} to ${customToDate})`;
      }
      filterInfo.push(reportTypeInfo);
    }
    
    // If no specific filters, show a message
    if (filterInfo.length === 0) {
      filterInfo.push("• No specific filters applied");
    }
    
    // Calculate financial data for the report
    const totalWeight = filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
    const totalMunds = totalWeight / 40;
    const totalSales = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalSales - totalExpenses;
    
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
    
    // Generate HTML content for the thermal owner report (79mm width)
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Owner Report - Thermal</title>
        <style>
          @media print {
            @page {
              size: 79mm auto;
              margin: 2mm;
            }
          }
          
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 10px;
            font-weight: bold;
            line-height: 1.3;
            color: #000;
            margin: 0;
            padding: 2mm;
            width: 79mm;
          }
          
          .header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          
          .company-name {
            font-size: 12px;
            font-weight: bold;
          }
          
          .company-details {
            font-size: 9px;
            margin: 1mm 0;
          }
          
          .report-title {
            text-align: center;
            font-size: 11px;
            font-weight: bold;
            margin: 2mm 0;
          }
          
          .report-date {
            text-align: center;
            font-size: 9px;
            margin-bottom: 2mm;
          }
          
          .financial-section {
            text-align: left;
            font-size: 9px;
            margin-bottom: 2mm;
            padding: 1mm;
            border: 1px solid #000;
          }
          
          .financial-item {
            margin: 1px 0;
          }
          
          .filters-section {
            text-align: left;
            font-size: 9px;
            margin-bottom: 2mm;
            padding: 1mm;
            border: 1px solid #000;
          }
          
          .filter-item {
            margin: 1px 0;
          }
          
          .date-section {
            margin: 3mm 0;
          }
          
          .date-header {
            font-size: 10px;
            font-weight: bold;
            margin: 2mm 0 1mm 0;
            padding: 1mm 0;
            border-bottom: 1px solid #000;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 2mm 0;
            font-size: 9px;
            font-weight: bold;
          }
          
          th {
            background-color: #f0f0f0;
            border-bottom: 1px solid #000;
            padding: 1mm;
            text-align: left;
            font-weight: bold;
          }
          
          td {
            border-bottom: 1px solid #000;
            padding: 0.5mm;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-right {
            text-align: right;
          }
          
          .summary-row {
            font-weight: bold;
            background-color: #e0e0e0;
          }
          
          .grand-total {
            font-weight: bold;
            background-color: #d0d0d0;
            border: 1px solid #000 !important;
          }
          
          .text-success {
            color: #28a745;
          }
          
          .text-danger {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
          <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
          <div class="report-date">Generated on: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</div>
        </div>
        
        <!-- Financial Summary -->
        <div class="financial-section">
          <div class="financial-item">Records: ${filteredRecords.length}</div>
          <div class="financial-item">Net Weight: ${totalWeight.toFixed(2)} kg</div>
          <div class="financial-item">Munds: ${(() => {
            const mundsInteger = Math.floor(totalMunds);
            const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
            return `${mundsInteger}-${remainingKgs}`;
          })()}</div>
          <div class="financial-item">Sales: Rs ${totalSales.toLocaleString()}</div>
          <div class="financial-item">Expenses: Rs ${totalExpenses.toLocaleString()}</div>
          <div class="financial-item">Profit: Rs ${netProfit.toLocaleString()} ${netProfit >= 0 ? '(Profit)' : '(Loss)'}</div>
        </div>
        
        <!-- Filters Section -->
        <div class="filters-section">
          ${filterInfo.map(info => `<div class="filter-item">${info}</div>`).join('')}
        </div>
        
        ${sortedDates.map(dateKey => {
          const dateRecords = recordsByDate[dateKey];
          const dateObj = new Date(dateKey);
          const formattedDate = dateObj.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          });
          
          // Calculate totals for this date
          const dateTotalFirstWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0);
          const dateTotalSecondWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0);
          const dateTotalNetWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0);
          const dateTotalPrice = dateRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
          
          return `
          <div class="date-section">
            <div class="date-header">${formattedDate}</div>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Party</th>
                  <th>Product</th>
                  <th>F.Wt</th>
                  <th>S.Wt</th>
                  <th>Net</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${dateRecords.map((r, index) => `
                  <tr>
                    <td>${r.id}</td>
                    <td>${r.party_name || '-'}</td>
                    <td>${r.product || '-'}</td>
                    <td>${formatWeight(r.first_weight)}</td>
                    <td>${formatWeight(r.second_weight)}</td>
                    <td>${formatWeight(r.net_weight)}</td>
                    <td>${r.total_price ? `${Number(r.total_price).toLocaleString()}` : "-"}</td>
                  </tr>
                `).join('')}
                <tr class="summary-row">
                  <td colspan="3">Total:</td>
                  <td>${formatWeight(dateTotalFirstWeight)}</td>
                  <td>${formatWeight(dateTotalSecondWeight)}</td>
                  <td>${formatWeight(dateTotalNetWeight)}</td>
                  <td>${dateTotalPrice.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
          `;
        }).join('')}
        
        <!-- Grand Total -->
        <div style="margin-top: 3mm; border-top: 1px solid #000; padding-top: 2mm;">
          <table>
            <thead>
              <tr>
                <th colspan="2">Grand Total:</th>
                <th class="text-right">F.Wt</th>
                <th class="text-right">S.Wt</th>
                <th class="text-right">Net</th>
                <th class="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              <tr class="grand-total">
                <td colspan="2">(${filteredRecords.length} records):</td>
                <td class="text-right">${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0))}</td>
                <td class="text-right">${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0))}</td>
                <td class="text-right">${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0))}</td>
                <td class="text-right">${filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait a bit for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };
  
  // Owner report generation
  const generateOwnerReport = () => {
    // Create a new window for the report
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Group records by date
    const recordsByDate = {};
    filteredRecords.forEach(record => {
      if (record.first_weight_time) {
        const date = new Date(record.first_weight_time);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (!recordsByDate[dateKey]) {
          recordsByDate[dateKey] = [];
        }
        recordsByDate[dateKey].push(record);
      }
    });
    
    // Sort dates
    const sortedDates = Object.keys(recordsByDate).sort();
    
    // Generate filter information for display
    const filterInfo = [];
    if (search) {
      filterInfo.push(`• Search: "${search.toUpperCase()}"`);
    }
    if (partyFilter && partyFilter.length > 0) {
      filterInfo.push(`• Party Names: ${partyFilter.map(name => name.toUpperCase()).join(', ')}`);
    }
    if (productFilter && productFilter.length > 0) {
      filterInfo.push(`• Products: ${productFilter.map(product => product.toUpperCase()).join(', ')}`);
    }
    if (vehicleTypeFilter && vehicleTypeFilter.length > 0) {
      filterInfo.push(`• Vehicle Types: ${vehicleTypeFilter.map(type => type.toUpperCase()).join(', ')}`);
    }
    if (businessNameFilter && businessNameFilter.length > 0) {
      filterInfo.push(`• Business Names: ${businessNameFilter.map(name => name.toUpperCase()).join(', ')}`);
    }
    if (reportType && reportType !== 'overall') {
      let reportTypeInfo = `• Report Type: ${reportType}`;
      if (reportType === 'monthly' && selectedMonth && selectedYear) {
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        reportTypeInfo += ` (${monthName} ${selectedYear})`;
      } else if (reportType === 'yearly' && selectedYear) {
        reportTypeInfo += ` (${selectedYear})`;
      } else if (reportType === 'custom' && customFromDate && customToDate) {
        reportTypeInfo += ` (${customFromDate} to ${customToDate})`;
      }
      filterInfo.push(reportTypeInfo);
    }
    
    // If no specific filters, show a message
    if (filterInfo.length === 0) {
      filterInfo.push("• No specific filters applied");
    }
    
    // Calculate financial data for the report
    const totalWeight = filteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
    const totalMunds = totalWeight / 40;
    const totalSales = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalSales - totalExpenses;
    
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
    
    // Generate HTML content for the owner report
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Owner Report</title>
        <style>
          @media print {
            @page {
              size: A4;
              margin: 15mm;
            }
          }
          
          body {
            font-family: 'Arial Black', 'Arial Bold', Arial, sans-serif;
            font-weight: bold;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 15mm;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          
          .company-details {
            font-size: 14px;
            margin: 5px 0;
            color: #000;
          }
          
          .report-title {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin: 15px 0;
            color: #000;
          }
          
          .report-date {
            text-align: center;
            font-size: 12px;
            margin-bottom: 15px;
            color: #000;
          }
          
          .financial-section {
            text-align: left;
            font-size: 12px;
            margin-bottom: 15px;
            padding: 12px;
            border: 2px solid #000;
            font-weight: bold;
          }
          
          .financial-item {
            margin: 3px 0;
          }
          
          .filters-section {
            text-align: left;
            font-size: 12px;
            margin-bottom: 15px;
            padding: 12px;
            border: 2px solid #000;
            font-weight: bold;
          }
          
          .filter-item {
            margin: 3px 0;
          }
          
          .date-section {
            margin: 25px 0;
          }
          
          .date-header {
            font-size: 16px;
            font-weight: bold;
            margin: 18px 0 12px 0;
            padding: 6px 0;
            border-bottom: 2px solid #000;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 12px;
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
          }
          
          th {
            background-color: #f0f0f0;
            border-bottom: 1px solid #000;
            padding: 8px 5px;
            text-align: left;
            font-weight: bold;
            color: #000;
            font-size: 12px;
          }
          
          td {
            border-bottom: 1px solid #000;
            padding: 6px;
            font-size: 12px;
            vertical-align: top;
          }
          
          .text-center {
            text-align: center;
          }
          
          .text-right {
            text-align: right;
          }
          
          .fw-bold {
            font-weight: bold;
          }
          
          .summary-row {
            font-weight: bold;
            background-color: #e0e0e0;
          }
          
          .grand-total {
            font-weight: bold;
            background-color: #d0d0d0;
            border: 3px solid #000 !important;
          }
          
          .text-success {
            color: #28a745;
          }
          
          .text-danger {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
          <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
          <div class="report-date">Generated on: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</div>
        </div>
        
        <!-- Financial Summary -->
        <div class="financial-section">
          <div class="financial-item">Total Records: ${filteredRecords.length}</div>
          <div class="financial-item">Total Net Weight: ${totalWeight.toFixed(2)} kg</div>
          <div class="financial-item">Total Munds: ${(() => {
            const mundsInteger = Math.floor(totalMunds);
            const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
            return `${mundsInteger}-${remainingKgs}`;
          })()} Munds</div>
          <div class="financial-item">Total Sales: Rs ${totalSales.toLocaleString()}</div>
          <div class="financial-item">Total Expenses: Rs ${totalExpenses.toLocaleString()}</div>
          <div class="financial-item">Net Profit: Rs ${netProfit.toLocaleString()} ${netProfit >= 0 ? '(Profit)' : '(Loss)'}</div>
        </div>
        
        <!-- Filters Section -->
        <div class="filters-section">
          ${filterInfo.map(info => `<div class="filter-item">${info}</div>`).join('')}
        </div>
        
        ${sortedDates.map(dateKey => {
          const dateRecords = recordsByDate[dateKey];
          const dateObj = new Date(dateKey);
          const formattedDate = dateObj.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          });
          
          // Calculate totals for this date
          const dateTotalFirstWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0);
          const dateTotalSecondWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0);
          const dateTotalNetWeight = dateRecords.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0);
          const dateTotalPrice = dateRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
          
          return `
          <div class="date-section">
            <div class="date-header">${formattedDate}</div>
            <table>
              <thead>
                <tr>
                  <th>Sr No:</th>
                  <th>Party Name</th>
                  <th>Product Name</th>
                  <th>F. Weight</th>
                  <th>S. Weight</th>
                  <th>Net Weight</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                ${dateRecords.map((r, index) => `
                  <tr>
                    <td>${r.id}</td>
                    <td>${r.party_name || '-'}</td>
                    <td>${r.product || '-'}</td>
                    <td>${formatWeight(r.first_weight)}</td>
                    <td>${formatWeight(r.second_weight)}</td>
                    <td>${formatWeight(r.net_weight)}</td>
                    <td>${r.total_price ? `${Number(r.total_price).toLocaleString()}` : "-"}</td>
                  </tr>
                `).join('')}
                <tr class="summary-row">
                  <td colspan="3"><strong>Total for ${formattedDate}:</strong></td>
                  <td><strong>${formatWeight(dateTotalFirstWeight)}</strong></td>
                  <td><strong>${formatWeight(dateTotalSecondWeight)}</strong></td>
                  <td><strong>${formatWeight(dateTotalNetWeight)}</strong></td>
                  <td><strong>${dateTotalPrice.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          `;
        }).join('')}
        
        <!-- Grand Total -->
        <div style="margin-top: 35px; border-top: 4px solid #000; padding-top: 20px;">
          <table>
            <thead>
              <tr>
                <th colspan="3">Grand Total:</th>
                <th class="text-right">F. Weight</th>
                <th class="text-right">S. Weight</th>
                <th class="text-right">Net Weight</th>
                <th class="text-right">Total Price</th>
              </tr>
            </thead>
            <tbody>
              <tr class="grand-total">
                <td colspan="3"><strong>All Dates (${filteredRecords.length} records):</strong></td>
                <td class="text-right"><strong>${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0))}</strong></td>
                <td class="text-right"><strong>${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0))}</strong></td>
                <td class="text-right"><strong>${formatWeight(filteredRecords.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0))}</strong></td>
                <td class="text-right"><strong>${filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0).toLocaleString()}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait a bit for content to load before printing
    setTimeout(() => {
      printWindow.print();
      // printWindow.close();
    }, 500);
  };

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
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
                businessNameFilter={businessNameFilter}
                setBusinessNameFilter={setBusinessNameFilter}
                uniqueParties={uniqueParties}
                uniqueProducts={uniqueProducts}
                uniqueVehicleTypes={uniqueVehicleTypes}
                uniqueBusinessNames={uniqueBusinessNames}
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
                    businessNameFilter={businessNameFilter}
                    search={search}
                  />
                  <div className="d-grid gap-2">
                    <button className="btn btn-primary w-100 d-block" onClick={generateOwnerReport}>
                      <FaFileInvoice className="me-2" />
                      A4 Owner Report
                    </button>
                    {/* <button className="btn btn-secondary w-100 d-block" onClick={generateThermalOwnerReport}>
                      <FaFileInvoice className="me-2" />
                      Thermal Owner Report
                    </button> */}
                  </div>
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
            vehiclePrices={settings.vehiclePrices || {}} // Pass vehicle prices from settings
            slipType="first" // Default slip type
            // Pass filter information for print report
            filters={{
              search,
              partyFilter,
              productFilter,
              vehicleTypeFilter,
              businessNameFilter,
              reportType,
              selectedMonth,
              selectedYear,
              customFromDate,
              customToDate
            }}
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