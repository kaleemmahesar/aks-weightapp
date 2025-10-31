import React from "react";
import { BiEdit } from "react-icons/bi";
import { 
  FaTruck, 
  FaFileInvoice, 
  FaHashtag, 
  FaUser, 
  FaClock, 
  FaUserTie, 
  FaCheck 
} from "react-icons/fa";
import { formatToPST } from '../utils/dateUtils';

const RecordsGrid = ({ 
  paginatedRecords, 
  openEditModal, 
  openPrintModal 
}) => {
  if (paginatedRecords.length === 0) {
    return (
      <div className="text-center py-5">
        <h4 className="text-muted mb-2">No Records Found</h4>
      </div>
    );
  }

  return (
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
  );
};

export default RecordsGrid;