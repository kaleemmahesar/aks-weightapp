import React from "react";
import { FaFileInvoice } from "react-icons/fa";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
  search
}) => {
  // Helper function to get expense date (handles both 'date' and 'expense_date' properties)
  const getExpenseDate = (expense) => {
    const dateValue = expense.date || expense.expense_date;
    if (!dateValue) return null;
    return new Date(dateValue).toISOString().split('T')[0];
  };

  const generatePDF = () => {
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
        if (customFromDate && customToDate) {
          finalFilteredExpenses = expenses.filter(e => {
            const expenseDate = getExpenseDate(e);
            return expenseDate && expenseDate >= customFromDate && expenseDate <= customToDate;
          });
        }
        break;
      default:
        finalFilteredExpenses = expenses;
    }

    // Calculate financial metrics
    const reportRevenue = finalFilteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);
    
    // Separate regular expenses from deposits to owner
    const reportRegularExpenses = finalFilteredExpenses.filter(e => e.category !== "Deposit to Owner");
    const reportDepositsToOwner = finalFilteredExpenses.filter(e => e.category === "Deposit to Owner");
    
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

    // Calculate vehicle type counts
    const vehicleTypeCounts = {};
    finalFilteredRecords.forEach(record => {
      const vehicleType = record.vehicle_type || 'Unknown';
      vehicleTypeCounts[vehicleType] = (vehicleTypeCounts[vehicleType] || 0) + 1;
    });

    // Create HTML content similar to PrintModal.js
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
    
    const filterString = filterInfo.length > 0 ? filterInfo.join(', ') : 'No additional filters applied';

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

          .expense-item, .revenue-item, .vehicle-item {
            border-bottom: 1px dotted #ccc;
            padding: 2px 0;
            margin: 1px 0;
          }

          .expense-item:last-child, .revenue-item:last-child, .vehicle-item:last-child {
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

          <!-- Vehicle Type Counts -->
          ${Object.keys(vehicleTypeCounts).length > 0 ? `
            <div class="content-section">
              <div class="section-title">VEHICLE TYPE COUNTS</div>
              ${Object.entries(vehicleTypeCounts).map(([vehicleType, count]) => `
                <div class="vehicle-item">
                  <div class="expense-row">
                    <span class="expense-label">${vehicleType}:</span>
                    <span class="expense-value">${count} vehicles</span>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Records Table -->
          ${finalFilteredRecords.length > 0 ? `
            <div class="content-section">
              <div class="section-title">RECORDS DETAIL</div>
              <table>
                <thead>
                  <tr>
                    <th>Party</th>
                    <th>Net Weight</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${finalFilteredRecords.map(record => `
                    <tr>
                      <td>${record.party_name || '-'}</td>
                      <td>${parseFloat(record.net_weight || 0).toFixed(2)} kg</td>
                      <td>Rs ${(parseFloat(record.total_price) || 0).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

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
          ${reportType === 'overall' && finalFilteredRecords.length > 0 ? `
            <div class="content-section">
              <div class="section-title">REVENUE DETAILS</div>
              ${finalFilteredRecords.map(record => `
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

  return (
    <button className="btn btn-success w-100 d-block" onClick={generatePDF}>
      <FaFileInvoice className="me-2" />
      Generate Owner Report
    </button>
  );
};

export default ReportGenerator;