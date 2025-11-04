
import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
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

    const generatePDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("AL HUSSAINI COMPUTERISED KANTA", pageWidth / 2, 20, { align: "center" });

        // Add date range and total revenue
        doc.setFontSize(12);
        doc.text(`From: ${fromDate || "Start"}  To: ${toDate || "End"}`, 14, 28);
        doc.text(`Total Revenue: ${totalRevenue} PKR`, 14, 36);

        // Add table
        autoTable(doc, {
            startY: 45,
            head: [["ID", "Date", "Vehicle", "Party", "Type", "Product", "F.Weight", "S.Weight", "Net Weight", "Net Munds", "Price"]],
            body: filteredRecords.map(r => {
                const netWeight = parseFloat(r.net_weight) || 0;
                const netMunds = netWeight / 40; // 1 Mund = 40 kg
                const firstWeight = parseFloat(r.first_weight) || 0;
                const secondWeight = parseFloat(r.second_weight) || 0;
                const recordDate = r.date || r.first_weight_time || '';
                return [
                    r.id,
                    recordDate,
                    r.vehicle_number,
                    r.party_name || '-',
                    r.vehicle_type,
                    r.product,
                    firstWeight.toFixed(2),
                    secondWeight.toFixed(2),
                    netWeight.toFixed(2),
                    netMunds.toFixed(2),
                    r.total_price
                ];
            }),
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [102, 126, 234],
                textColor: 255
            },
            columnStyles: {
                0: { cellWidth: 15 },   // ID
                1: { cellWidth: 20 },   // Date
                2: { cellWidth: 25 },   // Vehicle
                3: { cellWidth: 30 },   // Party
                4: { cellWidth: 20 },   // Type
                5: { cellWidth: 25 },   // Product
                6: { cellWidth: 25 },   // F.Weight
                7: { cellWidth: 25 },   // S.Weight
                8: { cellWidth: 25 },   // Net Weight
                9: { cellWidth: 25 },   // Net Munds
                10: { cellWidth: 30 }   // Price
            }
        });

        doc.save("weighbridge_report.pdf");
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
                                    onClick={generatePDF}
                                    onMouseOver={(e) => {
                                        e.target.style.transform = "translateY(-2px)";
                                        e.target.style.boxShadow = "0 8px 20px rgba(231, 76, 60, 0.3)";
                                    }}
                                    onMouseOut={(e) => {
                                        e.target.style.transform = "translateY(0)";
                                        e.target.style.boxShadow = "none";
                                    }}
                                >
                                    <i className="fas fa-file-pdf me-2"></i>
                                    Generate PDF
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
                                            <td>{r.first_weight}</td>
                                            <td>{r.second_weight || "-"}</td>
                                            <td className="fw-bold text-primary">{r.net_weight || "-"}</td>
                                            <td className="fw-bold text-success">PKR {Number(r.total_price).toLocaleString()}</td>
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
