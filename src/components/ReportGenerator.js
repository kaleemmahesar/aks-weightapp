import React from "react";
import { FaFileInvoice } from "react-icons/fa";

const ReportGenerator = ({ 
  records, 
  expenses, 
  reportType, 
  selectedMonth, 
  selectedYear, 
  customFromDate, 
  customToDate,
  filteredRecords,
  partyFilter,
  productFilter,
  vehicleTypeFilter,
  businessNameFilter,
  search
}) => {
  // Helper function to get expense date (handles both 'date' and 'expense_date' properties)
  const getExpenseDate = (expense) => {
    const dateValue = expense.date || expense.expense_date;
    if (!dateValue) return null;
    return new Date(dateValue).toISOString().split('T')[0];
  };

  // Function to format weight without .00 decimals when not needed
  const formatWeight = (weight) => {
    if (!weight) return "-";
    const num = parseFloat(weight);
    if (isNaN(num)) return "-";
    
    // If it's a whole number, don't show decimals
    if (num % 1 === 0) {
      return num.toString().toUpperCase();
    } else {
      // Otherwise, show one decimal place
      return num.toFixed(1).toUpperCase();
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
    let ampm = "AM";
    if (hour >= 12) {
      ampm = "PM";
      if (hour > 12) {
        hour = hour - 12;
      }
    }
    if (hour === 0) {
      hour = 12;
    }
    
    return `${day}/${month}/${year} @ ${hour}:${minute} ${ampm}`.toUpperCase();
  };

  const generateReport = () => {
    // Get filtered data based on report type
    const getFilteredData = () => {
      const today = new Date();
      let filteredRecordsByDate = records;
      let filteredExpenses = expenses;
      let dateRange = '';

      switch (reportType) {
        case 'daily':
          const todayStr = today.toISOString().split('T')[0];
          filteredRecordsByDate = records.filter(r => {
            const recordDate = new Date(r.date || r.first_weight_time);
            if (isNaN(recordDate)) return false;
            const dailyDateStr = recordDate.toISOString().split('T')[0];
            return dailyDateStr === todayStr;
          });
          filteredExpenses = expenses.filter(e => getExpenseDate(e) === todayStr);
          dateRange = `Daily Report - ${today.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
          break;
          
        case 'monthly':
          filteredRecordsByDate = records.filter(r => {
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
          filteredRecordsByDate = records.filter(r => {
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
          filteredRecordsByDate = records;
          filteredExpenses = expenses;
          dateRange = 'Overall Report - All Time';
          break;
          
        case 'custom':
          if (!customFromDate || !customToDate) {
            alert('Please select both from and to dates for custom range');
            return;
          }
          filteredRecordsByDate = records.filter(r => {
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
          filteredRecordsByDate = records;
          filteredExpenses = expenses;
          dateRange = 'Report';
      }

      return { filteredRecords: filteredRecordsByDate, filteredExpenses, dateRange };
    };

    // Use the filtered records passed from parent if available, otherwise filter by date
    let finalFilteredRecords = filteredRecords || records;
    let dateRange = '';

    // If we don't have pre-filtered records, apply date filtering
    if (!filteredRecords) {
      const filteredData = getFilteredData();
      finalFilteredRecords = filteredData.filteredRecords;
      dateRange = filteredData.dateRange;
    } else {
      // If we have pre-filtered records, just determine the date range
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
    }

    // Apply additional filtering for expenses (they don't have party/product filters)
    let finalFilteredExpenses = expenses;
    switch (reportType) {
      case 'daily':
        const todayStr = new Date().toISOString().split('T')[0];
        finalFilteredExpenses = expenses.filter(e => getExpenseDate(e) === todayStr);
        break;
      case 'monthly':
        finalFilteredExpenses = expenses.filter(e => {
          const dateValue = e.date || e.expense_date;
          if (!dateValue) return false;
          const expenseDate = new Date(dateValue);
          return expenseDate.getMonth() + 1 === selectedMonth && expenseDate.getFullYear() === selectedYear;
        });
        break;
      case 'yearly':
        finalFilteredExpenses = expenses.filter(e => {
          const dateValue = e.date || e.expense_date;
          if (!dateValue) return false;
          return new Date(dateValue).getFullYear() === selectedYear;
        });
        break;
      case 'custom':
        finalFilteredExpenses = expenses.filter(e => {
          const expenseDate = getExpenseDate(e);
          return expenseDate && expenseDate >= customFromDate && expenseDate <= customToDate;
        });
        break;
      default:
        finalFilteredExpenses = expenses;
    }

    // Calculate totals for filtered records
    const totalWeight = finalFilteredRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
    const totalMunds = totalWeight / 40;
    const totalSales = finalFilteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    const totalExpenses = finalFilteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalSales - totalExpenses;

    // Generate printable HTML report
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Weight Scale Management Report</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            text-transform: uppercase; /* Make all text uppercase */
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .report-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            text-transform: uppercase;
          }
          .summary-section {
            margin: 20px 0;
            text-transform: uppercase;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            text-transform: uppercase;
          }
          .summary-card {
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
            background-color: #f9f9f9;
            text-transform: uppercase;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            text-transform: uppercase;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
            text-transform: uppercase;
          }
          th {
            background-color: #f2f2f2;
            text-transform: uppercase;
          }
          .text-right {
            text-align: right;
            text-transform: uppercase;
          }
          .fw-bold {
            font-weight: bold;
            text-transform: uppercase;
          }
          .text-success {
            color: #28a745;
            text-transform: uppercase;
          }
          .text-danger {
            color: #dc3545;
            text-transform: uppercase;
          }
          .text-info {
            color: #17a2b8;
            text-transform: uppercase;
          }
          .text-muted {
            color: #6c757d;
            text-transform: uppercase;
          }
          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Weight Scale Management System</h1>
          <h2>${dateRange.toUpperCase()}</h2>
        </div>
        
        <div class="report-info">
          <div>Generated on: ${new Date().toLocaleString('en-GB', { timeZone: 'Asia/Karachi' }).toUpperCase()}</div>
          <div>Total Records: ${finalFilteredRecords.length}</div>
        </div>
        
        <div class="summary-section">
          <h3>Summary</h3>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="fw-bold">Total Weight</div>
              <div>${totalWeight.toLocaleString().toUpperCase()} KG</div>
            </div>
            <div class="summary-card">
              <div class="fw-bold">Total Munds</div>
              <div>${totalMunds.toFixed(2).toUpperCase()} MUNDS</div>
            </div>
            <div class="summary-card">
              <div class="fw-bold">Total Sales</div>
              <div>PKR ${totalSales.toLocaleString().toUpperCase()}</div>
            </div>
            <div class="summary-card">
              <div class="fw-bold">Total Expenses</div>
              <div>PKR ${totalExpenses.toLocaleString().toUpperCase()}</div>
            </div>
            <div class="summary-card">
              <div class="fw-bold">Net Profit</div>
              <div class="${netProfit >= 0 ? 'text-success' : 'text-danger'}">PKR ${netProfit.toLocaleString().toUpperCase()}</div>
            </div>
          </div>
        </div>
        
        <h3>Records</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Business</th>
              <th>Party</th>
              <th>Vehicle</th>
              <th>Type</th>
              <th>Product</th>
              <th>F.Weight</th>
              <th>S.Weight</th>
              <th>Net Weight</th>
              <th>Total Price</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${finalFilteredRecords.map(r => `
              <tr>
                <td>${r.id || '-'}</td>
                <td>${r.business_name || '-'}</td>
                <td>${r.party_name || '-'}</td>
                <td>${r.vehicle_number || '-'}</td>
                <td>${r.vehicle_type || '-'}</td>
                <td>${r.product || '-'}</td>
                <td class="text-right">${formatWeight(r.first_weight)}</td>
                <td class="text-right">${formatWeight(r.second_weight)}</td>
                <td class="text-right">${formatWeight(r.net_weight)}</td>
                <td class="text-right">PKR ${Number(r.total_price || 0).toLocaleString()}</td>
                <td>${r.first_weight_time ? formatDateTimeForDisplay(r.first_weight_time) : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <h3>Expenses</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            ${finalFilteredExpenses.map(e => `
              <tr>
                <td>${e.description || '-'}</td>
                <td>${e.category || '-'}</td>
                <td class="text-right">PKR ${Number(e.amount || 0).toLocaleString()}</td>
                <td>${getExpenseDate(e) ? new Date(getExpenseDate(e)).toLocaleDateString('en-GB') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();

  };

  return (
    <></>
    // <button className="btn btn-primary w-100 d-block" onClick={generateReport}>
    //   <FaFileInvoice className="me-2" />
    //   Print Customer Report
    // </button>
  );
};

export default ReportGenerator;