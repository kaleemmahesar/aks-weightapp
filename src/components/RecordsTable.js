import { useState } from "react";
import { FaEdit, FaPrint } from "react-icons/fa";
import { IoPrint } from "react-icons/io5";
import EditRecordModal from "./EditModal";
import PaginationControls from "./PaginationControls";
import "../styles/Dashboard.css";
import { formatToPST } from '../utils/dateUtils';

// New function to format date as "22/10/25 @ 8:34 pm"
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

export default function RecordsTable({ records, expenses = [], openPrintModal, vehiclePrices, slipType, onUpdateRecord }) {
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

    // Function to generate printable report
    const generatePrintReport = () => {
        // Create a new window for printing
        const printWindow = window.open("", "", "width=800,height=600");
        
        // Calculate total munds
        const totalMunds = totalNetWeight / 40;
        
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
                    font-family: Courier New, sans-serif;
                    font-size: 10px; /* Smaller font size */
                    line-height: 1.3;
                    color: #000;
                    margin: 0;
                    padding: 15mm;
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
                
                .summary-section {
                    margin: 12px 0;
                    page-break-inside: avoid;
                }
                
                .summary-title {
                    text-align: center;
                    font-size: 14px;
                    font-weight: bold;
                    border-bottom: 1px solid #000;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                    color: #2c3e50;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    gap: 8px;
                    margin: 6px 0;
                    border-bottom: 1px dotted #999;
                    font-size: 11px;
                    align-items: center;
                }
                
                .summary-label {
                    font-weight: bold;
                    display: inline-block;
                    min-width: 120px;
                    white-space: normal;
                }
                
                .summary-value {
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
            <div class="header">
                <div class="company-name">AL HUSSAINI COMPUTERISED KANTA</div>
                <div class="company-details">Near Bhand Chowk, Taulka Sijawal Junejo | Phone: 0331 4812277</div>
            </div>
            
            <div class="report-title">RECORDS REPORT</div>
            <div class="report-date">
                Report Generated: ${new Date().toLocaleString('en-GB', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            
            <div class="summary-section">
                <div class="summary-title">SUMMARY</div>
                <div class="summary-row">
                    <span class="summary-label">Total Records:</span>
                    <span class="summary-value">${records.length}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Sales:</span>
                    <span class="summary-value">PKR ${grandTotal.toLocaleString()}</span>
                </div>
            </div>
            
            <div class="summary-section">
                <div class="summary-title">RECORDS</div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Vehicle</th>
                            <th>Party</th>
                            <th>Type</th>
                            <th>Product</th>
                            <th>F.Weight</th>
                            <th>S.Weight</th>
                            <th>Net Weight</th>
                            <th>Net Munds</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${records.map(r => {
                            const netWeight = parseFloat(r.net_weight) || 0;
                            // Use Math.trunc() to handle negative numbers correctly
                            const netMunds = Math.trunc(netWeight / 40); // 1 Mund = 40 kg
                            const firstWeight = parseFloat(r.first_weight) || 0;
                            const secondWeight = parseFloat(r.second_weight) || 0;
                            const recordDate = r.date || r.first_weight_time || '';
                            return `
                            <tr>
                                <td>${r.id}</td>
                                <td>${recordDate ? formatDateTimeForDisplay(recordDate) : '-'}</td>
                                <td>${r.vehicle_number || '-'}</td>
                                <td>${r.party_name || '-'}</td>
                                <td>${r.vehicle_type}</td>
                                <td>${r.product}</td>
                                <td>${formatWeight(firstWeight)}</td>
                                <td>${formatWeight(secondWeight)}</td>
                                <td>${formatWeight(netWeight)} kg</td>
                                <td>${netMunds.toFixed(2)} Munds</td>
                                <td>Rs ${(parseFloat(r.total_price) || 0).toLocaleString()}</td>
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
        </body>
        </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        
        // Wait for content to load then print
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
    };

    const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    const handlePageClick = (page) => setCurrentPage(page);
    const handleRecordsPerPageChange = (e) => {
        setRecordsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing records per page
    };

    const openEditModal = (record) => {
        const slipType = record.final_weight === "Yes" ? "final" : "first";
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
                <span className="fw-bold fs-6 mb-0">
                    Records Management
                </span>
                <div className="d-flex align-items-center">
                    <button className="btn btn-sm btn-outline-primary" onClick={generatePrintReport}>
                        Print Report
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                {/* Compact table with consistent font sizes */}
                <table className="table table-hover mb-0">
                    <thead>
                        <tr className="table-header">
                            <th className="py-2 px-2">ID</th>
                            <th className="py-2 px-2">Vehicle</th>
                            <th className="py-2 px-2">Party</th>
                            <th className="py-2 px-2">Type</th>
                            <th className="py-2 px-2">Product</th>
                            <th className="py-2 px-2">F.Weight</th>
                            <th className="py-2 px-2">S.Weight</th>
                            <th className="py-2 px-2">Net Weight</th>
                            <th className="py-2 px-2">Total Price</th>
                            <th className="py-2 px-2">F.Time</th>
                            <th className="py-2 px-2">S.Time</th>
                            <th className="py-2 px-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRecords.length === 0 ? (
                            <tr>
                                <td colSpan="12" className="text-center text-muted py-3">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paginatedRecords.map((r, index) => (
                                <tr key={r.id} className="align-middle">
                                    <td className="py-1 px-2">{r.id}</td>
                                    <td className="py-1 px-2">{r.vehicle_number}</td>
                                    <td className="py-1 px-2">{r.party_name || '-'}</td>
                                    <td className="py-1 px-2">{r.vehicle_type}</td>
                                    <td className="py-1 px-2">{r.product || '-'}</td>
                                    <td className="py-1 px-2">{formatWeight(r.first_weight)}</td>
                                    <td className="py-1 px-2">{formatWeight(r.second_weight)}</td>
                                    <td className="py-1 px-2">{formatWeight(r.net_weight)}</td>
                                    <td className="py-1 px-2">{r.total_price ? `PKR ${Number(r.total_price).toLocaleString()}` : "-"}</td>
                                    {/* Use the new date format function */}
                                    <td className="py-1 px-2">{r.first_weight_time ? formatDateTimeForDisplay(r.first_weight_time) : "-"}</td>
                                    <td className="py-1 px-2">{r.second_weight_time ? formatDateTimeForDisplay(r.second_weight_time) : "-"}</td>
                                    <td className="py-1 px-2">
                                        <div className="d-flex gap-1">
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => openEditModal(r)}
                                                title="Edit Record"
                                            >
                                                <FaEdit />
                                            </button>
                                            {r.final_weight === "Yes" ? (
                                                <button
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => openPrintModal(r, "final")}
                                                    title="Print Final Weight"
                                                >
                                                    <FaPrint />
                                                </button>
                                            ) : (
                                                <>
                                                    <button
                                                        className="btn btn-sm btn-outline-primary"
                                                        onClick={() => openPrintModal(r, "first")}
                                                        title="Print First Weight"
                                                    >
                                                        <IoPrint />
                                                    </button>
                                                    {r.second_weight && (
                                                        <button
                                                            className="btn btn-sm btn-outline-info"
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
                <div className="d-flex justify-content-between align-items-center p-3 border-top">
                    <div>
                        <span className="fw-bold" style={{ fontSize: '1.25rem' }}>Total Records: </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{records.length}</span>
                    </div>
                    
                    <div>
                        <span className="fw-bold" style={{ fontSize: '1.25rem' }}>Total Weight: </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0).toLocaleString()} kg
                        </span>
                        <span className="mx-2">|</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {(() => {
                            const totalNetWeight = paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0);
                            const totalMunds = totalNetWeight / 40;
                            const mundsInteger = Math.floor(totalMunds);
                            const remainingKgs = Math.round((totalMunds - mundsInteger) * 40);
                            return `${mundsInteger}-${remainingKgs} Munds`;
                          })()}
                        </span>
                        <span className="mx-2">|</span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                          {(paginatedRecords.reduce((sum, r) => sum + Math.abs(parseFloat(r.net_weight) || 0), 0) / 1000).toFixed(2)} tons
                        </span>
                    </div>
                    
                    <div>
                        <span className="fw-bold" style={{ fontSize: '1.25rem' }}>Total Sales: </span>
                        <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>PKR {grandTotal.toLocaleString()}</span>
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