import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PrintModal from "../components/PrintModal";
import { BiEdit } from "react-icons/bi";
import EditRecordModal from "./EditModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { formatToPST } from '../utils/dateUtils';
import { 
  FaTruck, FaFileInvoice, FaMoneyBill, FaClock, FaUserTie, FaCheck, 
  FaUser,
  FaHashtag,
  FaMoneyBillWave,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaUniversity
} from "react-icons/fa";
import { setSelectedRecord, fetchRecords } from "../redux/slices/recordsSlice";
import { fetchExpenses } from "../redux/slices/expenseSlice";

export default function RecordsPage() {
  const dispatch = useDispatch();
  const { records = [], selectedRecord: reduxSelectedRecord } = useSelector(state => state.records || {});
  const { expenses = [] } = useSelector(state => state.expenses || {});
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("first");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editModalShow, setEditModalShow] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editSlipType, setEditSlipType] = useState("first");
  const [reportType, setReportType] = useState("daily");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");

  const recordsPerPage = 12;

  // Fetch records and expenses when component mounts
  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchRecords());
    }
    if (expenses.length === 0) {
      dispatch(fetchExpenses());
    }
  }, [dispatch, records.length, expenses.length]);



  const filteredRecords = records.filter((r) => {
  // ✅ Search filter
  const matchesSearch = search
    ? r.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle_type.toLowerCase().includes(search.toLowerCase()) ||
      r.product?.toLowerCase().includes(search.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toString().includes(search)
    : true;

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

  return matchesSearch && matchesReportType;
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
      previousPeriod
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

const generatePDF = () => {
  // Get filtered data based on report type
  const getFilteredData = () => {
    const today = new Date();
    let filteredRecords = records;
    let filteredExpenses = expenses;
    let dateRange = '';

    switch (reportType) {
      case 'daily':
        const todayStr = today.toISOString().split('T')[0];
        filteredRecords = records.filter(r => {
          const recordDate = new Date(r.date || r.first_weight_time);
          if (isNaN(recordDate)) return false;
          const dailyDateStr = recordDate.toISOString().split('T')[0];
          return dailyDateStr === todayStr;
        });
        filteredExpenses = expenses.filter(e => getExpenseDate(e) === todayStr);
        dateRange = `Daily Report - ${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        break;
        
      case 'monthly':
        filteredRecords = records.filter(r => {
          const recordDate = new Date(r.date || r.first_weight_time);
          if (isNaN(recordDate)) return false;
          return recordDate.getMonth() + 1 === selectedMonth && recordDate.getFullYear() === selectedYear;
        });
        filteredExpenses = expenses.filter(e => {
          const dateValue = e.date || e.expense_date;
          if (!dateValue) return false;
          const expenseDate = new Date(dateValue);
          return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear;
        });
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        dateRange = `Monthly Report - ${monthName} ${selectedYear}`;
        break;
        
      case 'yearly':
        filteredRecords = records.filter(r => {
          const recordDate = new Date(r.date || r.first_weight_time);
          if (isNaN(recordDate)) return false;
          return recordDate.getFullYear() === selectedYear;
        });
        filteredExpenses = expenses.filter(e => {
          const dateValue = e.date || e.expense_date;
          if (!dateValue) return false;
          return new Date(dateValue).getFullYear() === selectedYear;
        });
        dateRange = `Yearly Report - ${selectedYear}`;
        break;
        
      case 'overall':
        filteredRecords = records;
        filteredExpenses = expenses;
        dateRange = 'Overall Report - All Time';
        break;
        
      case 'custom':
        if (!customFromDate || !customToDate) {
          alert('Please select both from and to dates for custom range');
          return;
        }
        filteredRecords = records.filter(r => {
          const recordDate = new Date(r.date || r.first_weight_time);
          if (isNaN(recordDate)) return false;
          const customDateStr = recordDate.toISOString().split('T')[0];
          return customDateStr >= customFromDate && customDateStr <= customToDate;
        });
        filteredExpenses = expenses.filter(e => {
          const expenseDate = getExpenseDate(e);
          return expenseDate && expenseDate >= customFromDate && expenseDate <= customToDate;
        });
        dateRange = `Custom Report - ${new Date(customFromDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(customToDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
        break;
        
      default:
        filteredRecords = records;
        filteredExpenses = expenses;
        dateRange = 'Report';
    }

    return { filteredRecords, filteredExpenses, dateRange };
  };

  const { filteredRecords, filteredExpenses, dateRange } = getFilteredData();

  // Calculate financial metrics
  const reportRevenue = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
  
  // Separate regular expenses from deposits to owner
  const reportRegularExpenses = filteredExpenses.filter(e => e.category !== "Deposit to Owner");
  const reportDepositsToOwner = filteredExpenses.filter(e => e.category === "Deposit to Owner");
  
  const reportExpensesAmount = reportRegularExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const reportDepositsAmount = reportDepositsToOwner.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const reportNetProfit = reportRevenue - reportExpensesAmount;
  const reportFinalBalance = reportNetProfit - reportDepositsAmount;
  
  // Calculate cumulative totals (all time)
  const totalRevenue = records.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
  const totalRegularExpenses = expenses.filter(e => e.category !== "Deposit to Owner");
  const totalDepositsToOwner = expenses.filter(e => e.category === "Deposit to Owner");
  
  const totalExpensesAmount = totalRegularExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalDepositsAmount = totalDepositsToOwner.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const totalNetProfit = totalRevenue - totalExpensesAmount;
  const totalFinalBalance = totalNetProfit - totalDepositsAmount;

  // Create HTML content similar to PrintModal.js
  const win = window.open("", "", "width=800,height=600");
  if (!win) {
    alert("Popup blocked! Please allow popups for PDF generation.");
    return;
  }

  const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${dateRange}</title>
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

        .expense-item, .revenue-item {
          border-bottom: 1px dotted #ccc;
          padding: 2px 0;
          margin: 1px 0;
        }

        .expense-item:last-child, .revenue-item:last-child {
          border-bottom: none;
        }

        .expense-row {
          display: flex;
          justify-content: space-between;
          gap: 4px;
          margin: 2px 0;
          font-size: 9px;
          align-items: center;
          line-height: 1.2;
        }

        .expense-label {
          font-weight: normal;
          display: inline-block;
          min-width: 60px;
          white-space: normal;
          font-size: 9px;
        }

        .expense-value {
          font-size: 10px;
          font-weight: bold;
          display: inline-block;
          white-space: normal;
          word-break: break-word;
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

        <!-- Financial Summary -->
        <div class="content-section">
          <div class="section-title">FINANCIAL SUMMARY</div>
          ${reportType === 'daily' ? `
            <div class="info-row">
              <span class="info-label">Today Revenue:</span>
              <span class="info-value">Rs ${reportRevenue.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Today Expenses:</span>
              <span class="info-value">Rs ${reportExpensesAmount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Today Net Profit:</span>
              <span class="info-value">Rs ${reportNetProfit.toLocaleString()}</span>
            </div>
            ${reportDepositsAmount > 0 ? `
              <div class="info-row">
                <span class="info-label">Paid to Boss:</span>
                <span class="info-value">Rs ${reportDepositsAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Remaining Cash:</span>
                <span class="info-value">Rs ${reportFinalBalance.toLocaleString()}</span>
              </div>
            ` : ''}
          ` : reportType === 'overall' ? `
            <div class="info-row">
              <span class="info-label">Total Revenue:</span>
              <span class="info-value">Rs ${totalRevenue.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Expenses:</span>
              <span class="info-value">Rs ${totalExpensesAmount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Net Profit:</span>
              <span class="info-value">Rs ${totalNetProfit.toLocaleString()}</span>
            </div>
            ${totalDepositsAmount > 0 ? `
              <div class="info-row">
                <span class="info-label">Paid to Boss:</span>
                <span class="info-value">Rs ${totalDepositsAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Remaining Cash:</span>
                <span class="info-value">Rs ${totalFinalBalance.toLocaleString()}</span>
              </div>
            ` : ''}
          ` : `
            <div class="info-row">
              <span class="info-label">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Revenue:</span>
              <span class="info-value">Rs ${reportRevenue.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Expenses:</span>
              <span class="info-value">Rs ${reportExpensesAmount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Net Profit:</span>
              <span class="info-value">Rs ${reportNetProfit.toLocaleString()}</span>
            </div>
            ${reportDepositsAmount > 0 ? `
              <div class="info-row">
                <span class="info-label">Paid to Boss:</span>
                <span class="info-value">Rs ${reportDepositsAmount.toLocaleString()}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Remaining Cash:</span>
                <span class="info-value">Rs ${reportFinalBalance.toLocaleString()}</span>
              </div>
            ` : ''}
          `}
        </div>

        <!-- Expense Details -->
        ${reportRegularExpenses.length > 0 ? `
          <div class="content-section">
            <div class="section-title">EXPENSE DETAILS</div>
            ${reportRegularExpenses.map(expense => `
              <div class="expense-item">
                <div class="expense-row">
                  <span class="expense-label">${expense.date ? expense.date.substring(5) : '-'} - ${expense.category || '-'}</span>
                  <span class="expense-value">Rs ${(parseFloat(expense.amount) || 0).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Owner Deposits Details -->
        ${reportDepositsToOwner.length > 0 ? `
          <div class="content-section">
            <div class="section-title">OWNER DEPOSITS</div>
            ${reportDepositsToOwner.map(deposit => `
              <div class="expense-item">
                <div class="expense-row">
                  <span class="expense-label">${deposit.date ? deposit.date.substring(5) : '-'} - Deposited</span>
                  <span class="expense-value">Rs ${(parseFloat(deposit.amount) || 0).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Revenue Details (Only for Overall reports) -->
        ${reportType === 'overall' && filteredRecords.length > 0 ? `
          <div class="content-section">
            <div class="section-title">REVENUE DETAILS</div>
            ${filteredRecords.map(record => `
              <div class="revenue-item">
                <div class="expense-row">
                  <span class="expense-label">${record.date ? record.date.substring(5) : '-'} - ${record.vehicle_number || '-'}</span>
                  <span class="expense-value">Rs ${(parseFloat(record.total_price) || 0).toLocaleString()}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Cash Management (Only for Overall reports) -->
        ${reportType === 'overall' ? `
          <div class="content-section">
            <div class="section-title">CASH MANAGEMENT</div>
            <div class="info-row">
              <span class="info-label">Opening Balance:</span>
              <span class="info-value">Rs 0</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Revenue:</span>
              <span class="info-value">Rs ${totalRevenue.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Total Expenses:</span>
              <span class="info-value">Rs ${totalExpensesAmount.toLocaleString()}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Remaining Cash:</span>
              <span class="info-value">Rs ${totalFinalBalance.toLocaleString()}</span>
            </div>
          </div>
        ` : ''}

        <div class="footer">
          <div class="signature-line">Operator: _____________</div>
          <div class="signature-line">Owner: _____________</div>
          <div style="margin-top: 8px; font-size: 8px;">
            Software by <span style="display:inline-block;padding:2px 8px;font-weight:bold;border:1px solid #000;border-radius:6px;background:#f0f0f0">AKS</span> Solutions
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

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



  const handlePrev = () => setCurrentPage(p => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage(p => Math.min(p + 1, totalPages));

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
            <div className="col-md-9">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label text-muted fw-semibold">Search Records</label>
                  <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
                </div>
                <div className="col-md-3">
                  <label className="form-label text-muted fw-semibold">Report Type</label>
                  <select 
                    className="form-select" 
                    value={reportType} 
                    onChange={e => setReportType(e.target.value)}
                  >
                    <option value="daily">Daily Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="yearly">Yearly Report</option>
                    <option value="overall">Overall Report</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
                
                {reportType === 'monthly' && (
                  <div className="col-md-2">
                    <label className="form-label text-muted fw-semibold">Month</label>
                    <select 
                      className="form-select" 
                      value={selectedMonth} 
                      onChange={e => setSelectedMonth(parseInt(e.target.value))}
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {(reportType === 'monthly' || reportType === 'yearly') && (
                  <div className="col-md-3">
                    <label className="form-label text-muted fw-semibold">Year</label>
                    <select 
                      className="form-select" 
                      value={selectedYear} 
                      onChange={e => setSelectedYear(parseInt(e.target.value))}
                    >
                      {Array.from({length: 5}, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                  </div>
                )}
                
                {reportType === 'custom' && (
                  <>
                    <div className="col-md-2">
                      <label className="form-label text-muted fw-semibold">From Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={customFromDate} 
                        onChange={e => setCustomFromDate(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-muted fw-semibold">To Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={customToDate} 
                        onChange={e => setCustomToDate(e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="col-md-3">
              <label className="form-label text-muted fw-semibold">&nbsp;</label>
              <button className="btn btn-success w-100 d-block" onClick={generatePDF}>
                <FaFileInvoice className="me-2" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Section */}
      <div className="mb-5">
        {/* Financial Summary Cards - Clear Layout */}
        <div className="row g-3 mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-lg">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0 d-flex align-items-center">
                  <FaChartLine className="me-2" />
                  Financial Summary - {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-4">
                  
                  {/* Total Sale */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-light">
                      <FaMoneyBillWave className="text-success fs-2 mb-2" />
                      <h6 className="text-muted mb-1">Total Sale</h6>
                      <h4 className="text-success fw-bold mb-0">
                        {formatCurrency(financialStats.filteredRevenue)}
                      </h4>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-light">
                      <FaArrowDown className="text-danger fs-2 mb-2" />
                      <h6 className="text-muted mb-1">Regular Expenses</h6>
                      <h4 className="text-danger fw-bold mb-0">
                        {formatCurrency(financialStats.filteredRegularExpenses)}
                      </h4>
                    </div>
                  </div>

                  {/* Profit */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-light">
                      <FaChartLine className={`${financialStats.filteredProfit >= 0 ? 'text-success' : 'text-danger'} fs-2 mb-2`} />
                      <h6 className="text-muted mb-1">Profit</h6>
                      <h4 className={`${financialStats.filteredProfit >= 0 ? 'text-success' : 'text-danger'} fw-bold mb-0`}>
                        {formatCurrency(financialStats.filteredProfit)}
                      </h4>
                    </div>
                  </div>

                  {/* Paid to Boss */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-light">
                      <FaUniversity className="text-info fs-2 mb-2" />
                      <h6 className="text-muted mb-1">Paid to Boss</h6>
                      <h4 className="text-info fw-bold mb-0">
                        {formatCurrency(financialStats.filteredDeposits)}
                      </h4>
                    </div>
                  </div>

                  {/* Remaining Cash */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-light">
                      <FaMoneyBill className={`${financialStats.filteredAvailableCash >= 0 ? 'text-primary' : 'text-warning'} fs-2 mb-2`} />
                      <h6 className="text-muted mb-1">Remaining Cash</h6>
                      <h4 className={`${financialStats.filteredAvailableCash >= 0 ? 'text-primary' : 'text-warning'} fw-bold mb-1`}>
                        {formatCurrency(financialStats.filteredAvailableCash)}
                      </h4>
                      {reportType !== 'overall' && (
                        <div className="d-flex align-items-center justify-content-center">
                          {financialStats.filteredAvailableCash !== financialStats.previousPeriod.availableCash && (
                            <span className={`badge ${
                              financialStats.filteredAvailableCash > financialStats.previousPeriod.availableCash 
                                ? 'bg-success' 
                                : 'bg-danger'
                            } ms-1`}>
                              {financialStats.filteredAvailableCash > financialStats.previousPeriod.availableCash ? '↗' : '↘'}
                              {Math.abs(financialStats.filteredAvailableCash - financialStats.previousPeriod.availableCash).toLocaleString('en-PK', {
                                style: 'currency',
                                currency: 'PKR',
                                minimumFractionDigits: 0
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Text */}
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="text-center p-3 border rounded bg-primary text-white">
                      <FaUser className="fs-2 mb-2" />
                      <h6 className="text-white-50 mb-1">Records</h6>
                      <h4 className="text-white fw-bold mb-0">
                        {filteredRecords.length}
                      </h4>
                    </div>
                  </div>

                </div>

                {/* Calculation Breakdown */}
                <div className="mt-4 pt-3 border-top">
                  <div className="row text-center">
                    <div className="col-12">
                      <small className="text-muted">
                         <strong>Calculation:</strong> 
                         Sale ({formatCurrency(financialStats.filteredRevenue)}) 
                         - Regular Expenses ({formatCurrency(financialStats.regularExpenses)}) 
                         = Profit ({formatCurrency(financialStats.filteredProfit)}) 
                         - Paid to Boss ({formatCurrency(financialStats.bankDeposits)}) 
                         = Remaining Cash ({formatCurrency(financialStats.availableCash)})
                       </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Records Grid */}
      {paginatedRecords.length === 0 ? (
        <div className="text-center py-5">
          <h4 className="text-muted mb-2">No Records Found</h4>
        </div>
      ) : (
        <div className="row g-3">
          {paginatedRecords.map(record => (
            <div key={record.id} className="col-xl-3 col-lg-4 col-md-6 col-sm-12">
              <div className="card border-0 shadow-sm hover-shadow" style={{ minHeight: '320px' }}>
                <div className="card-header bg-light d-flex justify-content-between align-items-center">
                  <div><h6 className="mb-0 text-primary"><FaTruck className="me-2" />{record.vehicle_number}</h6></div>
                  <div className="d-flex gap-1">
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openEditModal(record)}><BiEdit size={16} /></button>
                    {record.final_weight === "Yes" ? (
                      <button className="btn btn-sm btn-success" onClick={() => openPrintModal(record, "final")}>Final <FaFileInvoice className="ms-1" /></button>
                    ) : (
                      <>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openPrintModal(record, "first")}>First <FaFileInvoice className="ms-1" /></button>
                        {record.second_weight && <button className="btn btn-sm btn-outline-info" onClick={() => openPrintModal(record, "second")}>Second <FaFileInvoice className="ms-1" /></button>}
                      </>
                    )}
                  </div>
                </div>

                <div className="card-body">
  <div className="row g-2 small">

    {/* Record ID */}
    <div className="col-6">
      <div>
        <FaHashtag className="me-1 text-secondary" />
        <span className="fw-semibold">{record.id}</span>
        <small className="d-block text-muted">ID</small>
      </div>
    </div>

    {/* Party Name */}
    <div className="col-6">
      <div>
        <FaUser className="me-1 text-secondary" />
        <span className="fw-semibold">{record.party_name || '-'}</span>
        <small className="d-block text-muted">Party</small>
      </div>
    </div>

    {/* Vehicle Type */}
    <div className="col-6 mt-3">
      <div>
        <div className="fw-semibold">{record.vehicle_type}</div>
        <small className="text-muted">Type</small>
      </div>
    </div>

    {/* Product */}
    <div className="col-6 mt-3">
      <div>
        <div className="fw-semibold">{record.product}</div>
        <small className="text-muted">Product</small>
      </div>
    </div>

    {/* First Weight */}
    <div className="col-6 mt-3">
      <div>
        <div className="fw-semibold">{Number(record.first_weight).toFixed(1)} kg</div>
        <small className="text-muted">First Weight</small>
      </div>
    </div>

    {/* Second Weight */}
    <div className="col-6 mt-3">
      <div>
        <div className="fw-semibold">{record.second_weight ? Number(record.second_weight).toFixed(1) + ' kg' : '-'}</div>
        <small className="text-muted">Second Weight</small>
      </div>
    </div>

    {/* Net Weight */}
    <div className="col-6 mt-3">
      <div>
        <div className="fw-semibold">{record.net_weight ? Number(record.net_weight).toFixed(1) + ' kg' : '-'}</div>
        <small className="text-muted">Net Weight</small>
      </div>
    </div>

    {/* Total Price */}
    <div className="col-6 mt-3">
      <div>
        <strong className="text-success">PKR {record.total_price ? Number(record.total_price).toLocaleString() : '0'}</strong>
        <small className="text-muted d-block">Total Price</small>
      </div>
    </div>

    {/* First Weight Time */}
    <div className="col-6 mt-3">
      <div>
        <FaClock className="me-1" />
        <span>{formatToPST(record.first_weight_time)}</span>
        <small className="d-block text-muted">First Weight Time</small>
      </div>
    </div>

    {/* Second Weight Time */}
    {record.second_weight_time && (
      <div className="col-6 mt-3">
        <div>
          <FaClock className="me-1" />
          <span>{formatToPST(record.second_weight_time)}</span>
          <small className="d-block text-muted">Second Weight Time</small>
        </div>
      </div>
    )}

  </div>
</div>




                <div className="card-footer bg-light small text-muted">
  <div className="row g-1">
    <div className="col-12 d-flex flex-wrap justify-content-start justify-content-md-end">
      <span className={`badge ${record.driver_name ? 'bg-info' : 'bg-secondary'} me-1 mb-1`}>
        <FaUserTie className="me-1" />
        {record.driver_name ? 'With Driver' : 'No Driver'}
      </span>
      {record.final_weight === "Yes" && (
        <span className="badge bg-success mb-1">
          <FaCheck className="me-1" />
          Final
        </span>
      )}
    </div>
  </div>
</div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination & Grand Total */}
      {filteredRecords.length > 0 && (
        <div className="row mt-4 align-items-center">
          <div className="col-md-4 mb-3 mb-md-0">
            <div className="text-center p-3 bg-success text-white rounded shadow">
              Grand Total: PKR {grandTotal.toLocaleString()} | {filteredRecords.length} records
            </div>
          </div>
          <div className="col-md-8 d-flex justify-content-center justify-content-md-end">
            <nav>
              <ul className="pagination mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={handlePrev}>Previous</button>
                </li>
                <li className="page-item active">
                  <span className="page-link bg-primary border-primary text-white">Page {currentPage} of {totalPages}</span>
                </li>
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={handleNext}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      )}

      {reduxSelectedRecord && <PrintModal show={showPrintModal} slipType={slipType} onClose={closePrintModal} />}
       {editModalShow && editRecord && <EditRecordModal show={editModalShow} onClose={() => setEditModalShow(false)} record={editRecord} slipType={editSlipType} />}
    </div>
    </div>
  );
}
