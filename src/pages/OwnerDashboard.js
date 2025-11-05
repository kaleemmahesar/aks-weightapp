import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Dashboard.css";

export default function OwnerDashboard() {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [records, setRecords] = useState([]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRecords = async () => {
            try {
                const response = await axios.get("http://localhost/weightscale/index.php?action=getRecords");

                if (isMounted) {
                    // Handle different PHP response formats
                    if (response.data.status === "success" || response.data.success) {
                        const records = response.data.data || response.data.records || [];
                        setRecords(records);
                    } else {
                        console.error("Failed to load records", response.data);
                        setRecords([]);
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error("Error fetching records:", error);
                    setRecords([]);
                }
            }
        };

        fetchRecords();
        
        return () => {
            isMounted = false;
        };
    }, []);

    const filteredRecords = records.filter(r => {
        if (!fromDate || !toDate) return true;
        const recordDate = new Date(r.firstTime);
        return recordDate >= new Date(fromDate) && recordDate <= new Date(toDate);
    });

    const totalRevenue = filteredRecords
        .filter(r => r.second_weight)
        .reduce((sum, r) => sum + Number(r.total_price || 0), 0);

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

    const generateReport = () => {
        // Create HTML content for printing
        const printWindow = window.open("", "", "width=800,height=600");
        if (!printWindow) {
            alert("Popup blocked! Please allow popups for report generation.");
            return;
        }

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Weighbridge Report</title>
            <style>
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                }
                
                body {
                    font-family: Arial, sans-serif;
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
                
                .report-info {
                    font-size: 12px;
                    margin: 6px 0;
                    color: #34495e;
                }
                
                .report-title {
                    text-align: center;
                    font-size: 16px;
                    font-weight: bold;
                    margin: 12px 0;
                    color: #1a5276;
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
                <div class="report-info">Date Range: ${fromDate || "Start"} to ${toDate || "End"}</div>
            </div>
            
            <div class="report-title">WEIGHBRIDGE REPORT</div>
            
            <div class="summary-section">
                <div class="summary-title">FINANCIAL SUMMARY</div>
                <div class="summary-row">
                    <span class="summary-label">Total Revenue:</span>
                    <span class="summary-value">₹${totalRevenue.toLocaleString()}</span>
                </div>
                <div class="summary-row">
                    <span class="summary-label">Total Records:</span>
                    <span class="summary-value">${filteredRecords.length}</span>
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
                        ${filteredRecords.map(r => {
                            const netWeight = parseFloat(r.net_weight) || 0;
                            const netMunds = netWeight / 40; // 1 Mund = 40 kg
                            const firstWeight = parseFloat(r.first_weight) || 0;
                            const secondWeight = parseFloat(r.second_weight) || 0;
                            const recordDate = r.date || r.first_weight_time || '';
                            return `
                            <tr>
                                <td>${r.id}</td>
                                <td>${recordDate ? formatDateTimeForDisplay(recordDate) : '-'}</td>
                                <td>${r.vehicle_number}</td>
                                <td>${r.vehicle_type}</td>
                                <td>${r.product}</td>
                                <td>${formatWeight(firstWeight)}</td>
                                <td>${formatWeight(secondWeight)}</td>
                                <td>${formatWeight(netWeight)} kg</td>
                                <td>${netMunds.toFixed(2)} Munds</td>
                                <td>₹${Number(r.total_price).toLocaleString()}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="footer">
                <div class="signature-line">Owner: _____________</div>
                <div class="signature-line">Manager: _____________</div>
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

    return (
        <div className="dashboard-container">
            <div className="container-fluid py-4">
                {/* Header */}
                <div className="text-center mb-5">
                    <h1 
                        className="fw-bold"
                        style={{
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            fontSize: "3rem"
                        }}
                    >
                        <i className="fas fa-crown me-3"></i>
                        Owner Dashboard
                    </h1>
                    <p className="text-muted fs-5">Comprehensive business analytics and reporting</p>
                </div>

                {/* Revenue Stats Card */}
                <div className="row mb-4">
                    <div className="col-lg-4 col-md-6 mx-auto">
                        <div className="stats-card text-center">
                            <div className="stats-icon todays-total">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div className="stats-number">₹{totalRevenue.toLocaleString()}</div>
                            <div className="stats-label">Total Revenue</div>
                        </div>
                    </div>
                </div>

                {/* Date Filter Card */}
                <div className="weight-form-card mb-4">
                    <div 
                        className="weight-form-header"
                        style={{ background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)" }}
                    >
                        <div className="weight-form-header-content">
                            <div className="weight-form-icon">
                                <i className="fas fa-filter"></i>
                            </div>
                            <div>
                                <h4 className="weight-form-title">Date Range Filter</h4>
                                <p className="weight-form-subtitle">Filter records by date range</p>
                            </div>
                        </div>
                    </div>
                    <div className="weight-form-body">
                        <div className="row g-3 align-items-end">
                            <div className="col-md-3">
                                <div className="form-floating">
                                    <input 
                                        type="date" 
                                        id="fromDate"
                                        className="form-control modern-input" 
                                        value={fromDate} 
                                        onChange={e => setFromDate(e.target.value)} 
                                    />
                                    <label htmlFor="fromDate">
                                        <i className="fas fa-calendar-alt me-2"></i>From Date
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-floating">
                                    <input 
                                        type="date" 
                                        id="toDate"
                                        className="form-control modern-input" 
                                        value={toDate} 
                                        onChange={e => setToDate(e.target.value)} 
                                    />
                                    <label htmlFor="toDate">
                                        <i className="fas fa-calendar-alt me-2"></i>To Date
                                    </label>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <button 
                                    className="btn btn-lg w-100 fw-bold"
                                    style={{
                                        background: "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)",
                                        border: "none",
                                        borderRadius: "12px",
                                        color: "white",
                                        padding: "12px 0",
                                        transition: "all 0.3s ease"
                                    }}
                                    onClick={generateReport}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 8px 20px rgba(231, 76, 60, 0.3)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <i className="fas fa-print me-2"></i>
                                    Print Report
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="records-table-card">
                    <div className="records-table-header">
                        <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                            <i className="fas fa-list me-2"></i>Vehicle Records
                        </span>
                        <span className="badge bg-light text-dark px-3 py-2">
                            {filteredRecords.length} Records
                        </span>
                    </div>
                    <div className="card-body table-responsive">
                        <table className="modern-table table table-hover">
                            <thead>
                                <tr>
                                    <th><i className="fas fa-truck me-2"></i>Vehicle</th>
                                    <th><i className="fas fa-cogs me-2"></i>Type</th>
                                    <th><i className="fas fa-box me-2"></i>Product</th>
                                    <th><i className="fas fa-weight me-2"></i>First Weight</th>
                                    <th><i className="fas fa-balance-scale me-2"></i>Second Weight</th>
                                    <th><i className="fas fa-calculator me-2"></i>Net Weight</th>
                                    <th><i className="fas fa-money-bill me-2"></i>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="text-center text-muted py-5">
                                            <i className="fas fa-inbox fa-3x mb-3 d-block"></i>
                                            No records found for the selected date range
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map((r, idx) => (
                                        <tr key={idx}>
                                            <td className="fw-semibold">{r.vehicle_number}</td>
                                            <td>{r.vehicle_type}</td>
                                            <td>{r.product}</td>
                                            <td>{formatWeight(r.first_weight)}</td>
                                            <td>{r.second_weight ? formatWeight(r.second_weight) : "-"}</td>
                                            <td className="fw-bold text-primary">{r.net_weight ? formatWeight(r.net_weight) : "-"}</td>
                                            <td className="fw-bold text-success">₹{Number(r.total_price).toLocaleString()}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="grand-total-section">
                        <i className="fas fa-chart-bar me-2"></i>
                        <strong>Total Revenue: ₹{totalRevenue.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}