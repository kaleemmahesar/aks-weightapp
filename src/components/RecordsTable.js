import { useState } from "react";
import { useSelector } from "react-redux"; // Add useSelector import
import { FaEdit, FaPrint } from "react-icons/fa";
import { IoPrint } from "react-icons/io5";
import EditRecordModal from "./EditModal";
import PaginationControls from "./PaginationControls";
import "../styles/Dashboard.css";
import { formatToPST } from '../utils/dateUtils';

// New function to format date as "22/10/25 @ 8:34" (without AM/PM)
const formatDateTimeForDisplay = (dateString) => {
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";
  
  // Format as "22/10/25 @ 8:34" (without AM/PM)
  const day = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", day: "2-digit" });
  const month = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", month: "2-digit" });
  const year = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", year: "2-digit" });
  let hour = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", hour: "numeric", hour12: false });
  const minute = date.toLocaleString("en-GB", { timeZone: "Asia/Karachi", minute: "2-digit" });
  
  // Convert to 12-hour format without AM/PM
  if (hour > 12) {
    hour = hour - 12;
  }
  if (hour === 0) {
    hour = 12;
  }
  
  return `${day}/${month}/${year} @ ${hour}:${minute}`.toUpperCase();
};

// Function to format weight without .00 decimals when not needed and convert to uppercase
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

export default function RecordsTable({ records, expenses = [], openPrintModal, vehiclePrices, slipType, onUpdateRecord, filters = {} }) {
    const { role } = useSelector(state => state.auth || {}); // Get user role from auth state
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(12); // Default to 12 records per page
    const [editModalShow, setEditModalShow] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [editSlipType, setEditSlipType] = useState("first");
    
    const totalPages = Math.ceil(records.length / recordsPerPage);
    const paginatedRecords = records.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    const grandTotal = records.reduce((sum, r) => {
        const price = parseFloat(r.total_price) || 0;
        return sum + price;
    }, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => {
        const amount = parseFloat(expense.amount) || 0;
        return sum + amount;
    }, 0);

    // Calculate total net weight
    const totalNetWeight = records.reduce((sum, r) => {
        const weight = parseFloat(r.net_weight) || 0;
        return sum + weight;
    }, 0);

    // Function to generate thermal printable report (79mm width for dot matrix printers)
    const generateThermalPrintReport = () => {
        // Create a new window for printing
        const printWindow = window.open("", "", "width=800,height=600");
        
        // Group records by date
        const recordsByDate = {};
        records.forEach(record => {
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
        if (filters.search) {
            filterInfo.push(`• Search: "${filters.search.toUpperCase()}"`);
        }
        if (filters.partyFilter && filters.partyFilter.length > 0) {
            filterInfo.push(`• Party Names: ${filters.partyFilter.map(name => name.toUpperCase()).join(', ')}`);
        }
        if (filters.productFilter && filters.productFilter.length > 0) {
            filterInfo.push(`• Products: ${filters.productFilter.map(product => product.toUpperCase()).join(', ')}`);
        }
        if (filters.vehicleTypeFilter && filters.vehicleTypeFilter.length > 0) {
            filterInfo.push(`• Vehicle Types: ${filters.vehicleTypeFilter.map(type => type.toUpperCase()).join(', ')}`);
        }
        if (filters.businessNameFilter && filters.businessNameFilter.length > 0) {
            filterInfo.push(`• Business Names: ${filters.businessNameFilter.map(name => name.toUpperCase()).join(', ')}`);
        }
        if (filters.reportType && filters.reportType !== 'overall') {
            let reportTypeInfo = `• Report Type: ${filters.reportType}`;
            if (filters.reportType === 'monthly' && filters.selectedMonth && filters.selectedYear) {
                const monthName = new Date(filters.selectedYear, filters.selectedMonth - 1).toLocaleString('default', { month: 'long' });
                reportTypeInfo += ` (${monthName} ${filters.selectedYear})`;
            } else if (filters.reportType === 'yearly' && filters.selectedYear) {
                reportTypeInfo += ` (${filters.selectedYear})`;
            } else if (filters.reportType === 'custom' && filters.customFromDate && filters.customToDate) {
                reportTypeInfo += ` (${filters.customFromDate} to ${filters.customToDate})`;
            }
            filterInfo.push(reportTypeInfo);
        }
        
        // If no specific filters, show a message
        if (filterInfo.length === 0) {
            filterInfo.push("• No specific filters applied");
        }
        
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
        
        // Generate HTML content for thermal printing (79mm width)
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Records Report - Thermal</title>
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
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
                <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
                <div class="report-date">Generated on: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</div>
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
                            <td colspan="2">(${records.length} records):</td>
                            <td class="text-right">${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0))}</td>
                            <td class="text-right">${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0))}</td>
                            <td class="text-right">${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0))}</td>
                            <td class="text-right">${records.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0).toLocaleString()}</td>
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
    
    // Function to generate printable report
    const generatePrintReport = () => {
        // Create a new window for printing
        const printWindow = window.open("", "", "width=800,height=600");
        
        // Group records by date
        const recordsByDate = {};
        records.forEach(record => {
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
        if (filters.search) {
            filterInfo.push(`• Search: "${filters.search.toUpperCase()}"`);
        }
        if (filters.partyFilter && filters.partyFilter.length > 0) {
            filterInfo.push(`• Party Names: ${filters.partyFilter.map(name => name.toUpperCase()).join(', ')}`);
        }
        if (filters.productFilter && filters.productFilter.length > 0) {
            filterInfo.push(`• Products: ${filters.productFilter.map(product => product.toUpperCase()).join(', ')}`);
        }
        if (filters.vehicleTypeFilter && filters.vehicleTypeFilter.length > 0) {
            filterInfo.push(`• Vehicle Types: ${filters.vehicleTypeFilter.map(type => type.toUpperCase()).join(', ')}`);
        }
        if (filters.businessNameFilter && filters.businessNameFilter.length > 0) {
            filterInfo.push(`• Business Names: ${filters.businessNameFilter.map(name => name.toUpperCase()).join(', ')}`);
        }
        if (filters.reportType && filters.reportType !== 'overall') {
            let reportTypeInfo = `• Report Type: ${filters.reportType}`;
            if (filters.reportType === 'monthly' && filters.selectedMonth && filters.selectedYear) {
                const monthName = new Date(filters.selectedYear, filters.selectedMonth - 1).toLocaleString('default', { month: 'long' });
                reportTypeInfo += ` (${monthName} ${filters.selectedYear})`;
            } else if (filters.reportType === 'yearly' && filters.selectedYear) {
                reportTypeInfo += ` (${filters.selectedYear})`;
            } else if (filters.reportType === 'custom' && filters.customFromDate && filters.customToDate) {
                reportTypeInfo += ` (${filters.customFromDate} to ${filters.customToDate})`;
            }
            filterInfo.push(reportTypeInfo);
        }
        
        // If no specific filters, show a message
        if (filterInfo.length === 0) {
            filterInfo.push("• No specific filters applied");
        }
        
        // Generate HTML content for printing
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Records Report</title>
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
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
                <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
                <div class="report-date">Generated on: ${new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" })}</div>
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
                            <td colspan="3"><strong>All Dates (${records.length} records):</strong></td>
                            <td class="text-right"><strong>${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.first_weight) || 0), 0))}</strong></td>
                            <td class="text-right"><strong>${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.second_weight) || 0), 0))}</strong></td>
                            <td class="text-right"><strong>${formatWeight(records.reduce((sum, r) => sum + (parseFloat(r.net_weight) || 0), 0))}</strong></td>
                            <td class="text-right"><strong>${records.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0).toLocaleString()}</strong></td>
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

    const openEditModal = (record, slipType) => {
        setEditRecord(record);
        setEditSlipType(slipType);
        setEditModalShow(true);
    };

    const handleRecordUpdate = (updatedRecord) => {
        if (onUpdateRecord) onUpdateRecord(updatedRecord);
    };

    return (
        <div className="data-table mt-4">
            {/* Header with compact styling */}
            <div className="table-header d-flex justify-content-between align-items-center p-2">
                <span className="fw-bold fs-6 mb-0 text-uppercase">
                    Records Management
                </span>
                <div className="d-flex align-items-center gap-2">
                    <button className="btn btn-sm btn-outline-primary text-uppercase" onClick={generatePrintReport}>
                        A4 Report
                    </button>
                    {/* <button className="btn btn-sm btn-outline-secondary text-uppercase" onClick={generateThermalPrintReport}>
                        Thermal Report
                    </button> */}
                </div>
            </div>

            <div className="table-responsive">
                {/* Compact table with consistent font sizes */}
                <table className="table table-hover mb-0">
                    <thead>
                        <tr className="table-header text-uppercase">
                            <th className="py-2 px-2 text-uppercase">ID</th>
                            <th className="py-2 px-2 text-uppercase">Business</th>
                            <th className="py-2 px-2 text-uppercase">Vehicle</th>
                            <th className="py-2 px-2 text-uppercase">Party</th>
                            <th className="py-2 px-2 text-uppercase">Type</th>
                            <th className="py-2 px-2 text-uppercase">Product</th>
                            <th className="py-2 px-2 text-uppercase">F.Weight</th>
                            <th className="py-2 px-2 text-uppercase">S.Weight</th>
                            <th className="py-2 px-2 text-uppercase">Net Weight</th>
                            <th className="py-2 px-2 text-uppercase">Total Price</th>
                            <th className="py-2 px-2 text-uppercase">F.Time</th>
                            <th className="py-2 px-2 text-uppercase">S.Time</th>
                            <th className="py-2 px-2 text-uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRecords.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="text-center text-muted py-3 text-uppercase">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paginatedRecords.map((r, index) => (
                                <tr key={r.id} className="align-middle text-uppercase">
                                    <td className="py-1 px-2 text-uppercase">{r.id}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.business_name || '-'}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.vehicle_number}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.party_name || '-'}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.vehicle_type}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.product || '-'}</td>
                                    <td className="py-1 px-2 text-uppercase">{formatWeight(r.first_weight)}</td>
                                    <td className="py-1 px-2 text-uppercase">{formatWeight(r.second_weight)}</td>
                                    <td className="py-1 px-2 text-uppercase">{formatWeight(r.net_weight)}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.total_price ? `PKR ${Number(r.total_price).toLocaleString()}` : "-"}</td>
                                    {/* Use the new date format function */}
                                    <td className="py-1 px-2 text-uppercase">{r.first_weight_time ? formatDateTimeForDisplay(r.first_weight_time) : "-"}</td>
                                    <td className="py-1 px-2 text-uppercase">{r.second_weight_time ? formatDateTimeForDisplay(r.second_weight_time) : "-"}</td>
                                    <td className="py-1 px-2 text-uppercase">
                                        <div className="d-flex gap-1">
                                            {role === 'admin' && (
                                                <button
                                                    className="btn btn-sm btn-outline-secondary text-uppercase"
                                                    onClick={() => {
                                                      // Determine the appropriate slip type based on record data
                                                      let slipType = "first";
                                                      if (r.second_weight && r.second_weight !== "0" && r.second_weight !== "0.00") {
                                                        if (r.final_weight === "Yes") {
                                                          slipType = "final";
                                                        } else {
                                                          slipType = "second";
                                                        }
                                                      }
                                                      openEditModal(r, slipType);
                                                    }}
                                                    title="Edit Record"
                                                >
                                                    <FaEdit />
                                                </button>
                                            )}
                                            {r.final_weight === "Yes" ? (
                                                <button
                                                    className="btn btn-sm btn-success text-uppercase"
                                                    onClick={() => openPrintModal(r, "final")}
                                                    title="Print Final Weight"
                                                >
                                                    <FaPrint />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary text-uppercase"
                                                        onClick={() => openPrintModal(r, "first")}
                                                        title="Print First Weight"
                                                    >
                                                        <IoPrint />
                                                    </button>
                                                    {r.second_weight && (
                                                        <button
                                                            className="btn btn-sm btn-outline-info text-uppercase"
                                                            onClick={() => openPrintModal(r, "second")}
                                                            title="Print Second Weight"
                                                        >
                                                            <IoPrint />
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Summary row at the bottom */}
                <div className="d-flex justify-content-between align-items-center p-3 border-top text-uppercase">
                    <div className="text-uppercase">
                        <span className="fw-bold text-uppercase" style={{ fontSize: '1rem' }}>Total Records: </span>
                        <span className="text-uppercase" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{records.length}</span>
                    </div>
                    
                    <div className="text-uppercase">
                        <span className="fw-bold text-uppercase" style={{ fontSize: '1rem' }}>Total Weight: </span>
                        <span className="text-uppercase" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0).toLocaleString()} kg
                        </span>
                        <span className="mx-2 text-uppercase">|</span>
                        <span className="text-uppercase" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {(() => {
                            const totalNetWeight = paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
                            const totalMunds = totalNetWeight / 40;
                            const mundsInteger = Math.floor(totalMunds);
                            const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
                            return `${mundsInteger}-${remainingKgs} Munds`;
                          })()}
                        </span>
                        <span className="mx-2 text-uppercase">|</span>
                        <span className="text-uppercase" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {(paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0) / 1000).toFixed(2)} tons
                        </span>
                    </div>
                    
                    <div className="text-uppercase">
                        <span className="fw-bold text-uppercase" style={{ fontSize: '1rem' }}>Total Sales: </span>
                        <span className="text-uppercase" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>PKR {grandTotal.toLocaleString()}</span>
                    </div>
                </div>

                {/* Compact pagination - Always show pagination controls */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={recordsPerPage}
                  totalItems={records.length}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(value) => {
                    setRecordsPerPage(value);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[5, 10, 20, 50]}
                />
            </div>

            {editModalShow && editRecord && (
                <EditRecordModal
                    show={editModalShow}
                    onClose={() => setEditModalShow(false)}
                    record={editRecord}
                    slipType={editSlipType}
                    onUpdate={handleRecordUpdate}
                    vehiclePrices={vehiclePrices}
                />
            )}
        </div>
    );
}