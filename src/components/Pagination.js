import React from "react";

const Pagination = ({ 
  currentPage, 
  totalPages, 
  handlePrev, 
  handleNext, 
  grandTotal, 
  filteredRecordsLength 
}) => {
  if (filteredRecordsLength === 0) {
    return null;
  }

  return (
    <div className="row mt-4 align-items-center">
      <div className="col-md-4 mb-3 mb-md-0">
        <div className="text-center p-3 bg-success text-white rounded shadow">
          Grand Total: PKR {grandTotal.toLocaleString()} | {filteredRecordsLength} records
        </div>
      </div>
      <div className="col-md-8 d-flex justify-content-center justify-content-md-end">
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button className="page-link" onClick={handlePrev}>Previous</button>
            </li>
            <li className="page-item active">
              <span className="page-link bg-primary border-primary text-white">
                Page {currentPage} of {totalPages}
              </span>
            </li>
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button className="page-link" onClick={handleNext}>Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Pagination;