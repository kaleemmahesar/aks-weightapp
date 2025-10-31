import { useState } from "react";
import { FaEdit, FaPrint } from "react-icons/fa";
import { IoPrint } from "react-icons/io5";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import EditRecordModal from "./EditModal";
import "../styles/Dashboard.css";
import { formatToPST } from '../utils/dateUtils';

export default function RecordsTable({ records, openPrintModal, vehiclePrices, slipType, onUpdateRecord }) {
    const [currentPage, setCurrentPage] = useState(1);
    const recordsPerPage = 20;
    const [editModalShow, setEditModalShow] = useState(false);
    const [editRecord, setEditRecord] = useState(null);
    const [editSlipType, setEditSlipType] = useState("first");

    const grandTotal = records.reduce((sum, r) => {
        const price = parseFloat(r.total_price) || 0;
        return sum + price;
    }, 0);

    // Calculate total net weight
    const totalNetWeight = records.reduce((sum, r) => {
        const weight = parseFloat(r.net_weight) || 0;
        return sum + weight;
    }, 0);

    const totalPages = Math.ceil(records.length / recordsPerPage);
    const paginatedRecords = records.slice(
        (currentPage - 1) * recordsPerPage,
        currentPage * recordsPerPage
    );

    const generatePDF = () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Add header
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("AWAMI COMPUTERIZED KANTA", pageWidth / 2, 20, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Miro Khan Road, Larkana", pageWidth / 2, 28, { align: "center" });
        doc.text("Contact: 0333-8722847", pageWidth / 2, 34, { align: "center" });
        
        // Add report info
        const reportDate = new Date().toLocaleDateString('en-GB');
        const reportTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        doc.setFontSize(10);
        doc.text(`Report Generated: ${reportDate} at ${reportTime}`, pageWidth - 20, 45, { align: "right" });
        
        // Add table
        autoTable(doc, {
            startY: 50,
            head: [["ID", "Vehicle", "Party", "Type", "Product", "First Weight", "Second Weight", "Net Weight", "Price"]],
            body: records.map(r => [
                r.id,
                r.vehicle_number,
                r.party_name || '-',
                r.vehicle_type,
                r.product,
                r.first_weight ? Number(r.first_weight).toFixed(2) : "-",
                r.second_weight ? Number(r.second_weight).toFixed(2) : "-",
                r.net_weight ? Number(r.net_weight).toFixed(2) : "-",
                r.total_price ? `PKR ${Number(r.total_price).toLocaleString()}` : "-"
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [102, 126, 234], textColor: [255, 255, 255] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            columnStyles: {
                0: { cellWidth: 15 },
                1: { cellWidth: 25 },
                2: { cellWidth: 30 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 },
                5: { cellWidth: 25 },
                6: { cellWidth: 25 },
                7: { cellWidth: 25 },
                8: { cellWidth: 30 }
            }
        });

        // Add summary
        const finalY = doc.lastAutoTable.finalY || 50;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`Total Records: ${records.length}`, 20, finalY + 10);
        doc.text(`Total Net Weight: ${totalNetWeight.toFixed(2)} kg`, 20, finalY + 18);
        doc.text(`Total Revenue: PKR ${grandTotal.toLocaleString()}`, 20, finalY + 26);
        
        // Add footer
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text("Software by AKS Solutions", pageWidth / 2, pageHeight - 10, { align: "center" });
        
        // Save the PDF
        doc.save(`weighbridge_report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
    const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));
    const handlePageClick = (page) => setCurrentPage(page);

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
        <div className="records-table-card mt-4">
            <div className="records-table-header">
                <span style={{ fontSize: "1.25rem", fontWeight: "600" }}>
                    Records Management
                </span>
            </div>

            <div className="card-body table-responsive">
                <table className="modern-table table table-hover" style={{ marginBottom: '0' }}>
                    <thead>
                        <tr>
                            <th>No:</th>
                            <th>Vehicle</th>
                            <th>Party</th>
                            <th>Type</th>
                            <th>F.Weight</th>
                            <th>S.Weight</th>
                            <th>Net Weight</th>
                            <th>Total Price</th>
                            <th>F.Time</th>
                            <th>S.Time</th>
                            <th>Edit</th>
                            <th>Print Slip</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRecords.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="text-center text-muted">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            paginatedRecords.map((r, index) => (
                                <tr key={r.id}>
                                    <td>{r.id}</td>
                                    <td>{r.vehicle_number}</td>
                                    <td>{r.party_name || '-'}</td>
                                    <td>{r.vehicle_type}</td>
                                    <td>{r.first_weight ? Number(r.first_weight).toFixed(2) : "-"}</td>
                                    <td>{r.second_weight ? Number(r.second_weight).toFixed(2) : "-"}</td>
                                    <td>{r.net_weight ? Number(r.net_weight).toFixed(2) : "-"}</td>
                                    <td>{r.total_price ? `PKR ${Number(r.total_price).toLocaleString()}` : "-"}</td>
                                    <td>{r.first_weight_time ? formatToPST(r.first_weight_time) : "-"}</td>
                                    <td>{r.second_weight_time ? formatToPST(r.second_weight_time) : "-"}</td>
                                    <td>
                                        <button
                                            className="action-button btn btn-sm btn-info"
                                            onClick={() => openEditModal(r)}
                                        >
                                            <FaEdit />
                                        </button>
                                    </td>
                                    <td>
                                        {r.final_weight === "Yes" ? (
                                            <button
                                                className="action-button btn btn-sm btn-success"
                                                onClick={() => openPrintModal(r, "final")}
                                                title="Print Final Weight"
                                            >
                                                <FaPrint />
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-sm btn-secondary me-1"
                                                    onClick={() => openPrintModal(r, "first")}
                                                    title="Print First Weight"
                                                >
                                                    <IoPrint />
                                                </button>
                                                {r.second_weight && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => openPrintModal(r, "second")}
                                                        title="Print Second Weight"
                                                    >
                                                        <IoPrint />
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="grand-total-section mt-3 d-flex justify-content-between align-items-center">
                    <div>
                        <strong>Total Records: {records.length}</strong>
                    </div>
                    <div>
                        <strong>Total Net Weight: {totalNetWeight.toFixed(2)} kg</strong>
                    </div>
                    <div>
                        <strong>Grand Total: PKR {grandTotal.toLocaleString()}</strong>
                    </div>
                </div>

                {/* Pagination */}
                <div className="pagination-container mt-3 d-flex justify-content-between align-items-center">
                    <span>Page {currentPage} of {totalPages}</span>
                    <div>
                        <button className="pagination-button me-2" onClick={handlePrev} disabled={currentPage === 1}>
                            Prev
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                className={`pagination-button ${currentPage === i + 1 ? "active" : ""}`}
                                onClick={() => handlePageClick(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button className="pagination-button" onClick={handleNext} disabled={currentPage === totalPages}>
                            Next
                        </button>
                    </div>
                </div>
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