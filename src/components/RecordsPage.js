import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PrintModal from "../components/PrintModal";
import { BiEdit } from "react-icons/bi";
import EditRecordModal from "./EditModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { 
  FaTruck, FaWeightHanging, FaBalanceScale, FaFileInvoice, FaCalculator, FaMoneyBill, FaClock, FaUserTie, FaCheck, 
  FaUser,
  FaHashtag
} from "react-icons/fa";
import { updateRecordData as updateRecord, setSelectedRecord, fetchRecords } from "../redux/slices/recordsSlice";
import { getVehiclePrices } from "../config/vehicleConfig";

export default function RecordsPage() {
  const dispatch = useDispatch();
  const { records = [], selectedRecord: reduxSelectedRecord } = useSelector(state => state.records || {});
  const { settings = {} } = useSelector(state => state.settings || {});
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("first");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [editModalShow, setEditModalShow] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editSlipType, setEditSlipType] = useState("first");

  const recordsPerPage = 9;

  // Fetch records when component mounts
  useEffect(() => {
    if (records.length === 0) {
      dispatch(fetchRecords());
    }
  }, [dispatch, records.length]);

  const filteredRecords = records.filter((r) => {
  // ✅ Search filter
  const matchesSearch = search
    ? r.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle_type.toLowerCase().includes(search.toLowerCase()) ||
      r.product?.toLowerCase().includes(search.toLowerCase()) ||
      r.party_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toString().includes(search)
    : true;

  // ✅ Date filter
  const matchesDate = fromDate && toDate
    ? (() => {
        const recordDate = new Date(r.first_weight_time); // record date
        const start = new Date(fromDate);
        const end = new Date(toDate);

        // ✅ Include entire end date by setting time to 23:59:59
        end.setHours(23, 59, 59, 999);

        // ✅ Check if valid date
        if (isNaN(recordDate)) return false;

        return recordDate >= start && recordDate <= end;
      })()
    : true;

  return matchesSearch && matchesDate;
});


  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  const grandTotal = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.total_price) || 0), 0);

  const formatTo12Hour = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      timeZone: "Asia/Karachi",
      month: "2-digit", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", hour12: true
    });
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

  const handleUpdateRecord = (updatedRecord) => {
    dispatch(updateRecord(updatedRecord));
  };

  const openEditModal = (record) => {
    const type = record.final_weight === "Yes" ? "final" : "first";
    setEditRecord(record);
    setEditSlipType(type);
    setEditModalShow(true);
    dispatch(setSelectedRecord(record));
  };

 const generatePDF = () => {
  const rowsCount = filteredRecords.length;
  const baseHeight = 40; // title + date + total
  const rowHeight = 5;   // per row
  const pageHeight = baseHeight + (rowsCount * rowHeight);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, pageHeight] // ✅ Big enough for all rows
  });

  const margin = 5;

  // ✅ Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Awami Computerized Kanta", margin, margin + 5);

  // ✅ Date Range
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`From: ${fromDate || "Start"}  To: ${toDate || "End"}`, margin, margin + 11);

  // ✅ Table
  autoTable(doc, {
    startY: margin + 15,
    head: [["S.No", "Party", "Price"]],
    body: filteredRecords.map((r, index) => [
      index + 1,
      r.party_name || '-',
      r.total_price || "-"
    ]),
    styles: {
      fontSize: 7,
      cellPadding: 1,
      overflow: 'linebreak',
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0]
    },
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' }, // S.No
      1: { cellWidth: 40 },                   // Party
      2: { cellWidth: 20, halign: 'right' }   // Price
    },
    theme: 'grid',
    tableWidth: 'auto',
    pageBreak: 'avoid', // ✅ Prevents internal page breaks
    margin: { left: margin, right: margin }
  });

  // ✅ Total at bottom
  const finalY = doc.lastAutoTable.finalY || margin + 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${grandTotal.toFixed(2)} PKR`, margin, finalY + 6);

  doc.save("weighbridge_report.pdf");
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
          <div className="row g-3">
            <div className="col-md-4">
              <input type="text" className="form-control" placeholder="Search..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success w-100" onClick={generatePDF}>Export PDF</button>
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
        <span>{formatTo12Hour(record.first_weight_time)}</span>
        <small className="d-block text-muted">First Weight Time</small>
      </div>
    </div>

    {/* Second Weight Time */}
    {record.second_weight_time && (
      <div className="col-6 mt-3">
        <div>
          <FaClock className="me-1" />
          <span>{formatTo12Hour(record.second_weight_time)}</span>
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
