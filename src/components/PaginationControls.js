import React from 'react';

const PaginationControls = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [5, 10, 20, 50]
}) => {
  const handlePrev = () => onPageChange(Math.max(currentPage - 1, 1));
  const handleNext = () => onPageChange(Math.min(currentPage + 1, totalPages));
  const handlePageClick = (page) => onPageChange(page);

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <>
      {totalPages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-3 p-3">
          <div className="d-flex align-items-center gap-3">
            <small className="text-muted">
              Showing {startIndex} to {endIndex} of {totalItems} records
            </small>
            <div className="d-flex align-items-center">
              <label className="me-2 text-muted small">Records per page:</label>
              <select 
                className="form-select form-select-sm" 
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                style={{ width: 'auto' }}
              >
                {itemsPerPageOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="d-flex gap-1">
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handlePrev} 
              disabled={currentPage === 1}
            >
              Prev
            </button>
            
            {/* Page numbers - show maximum 5 pages around current page */}
            {[...Array(totalPages)].map((_, i) => {
              const pageNumber = i + 1;
              // Show first page, last page, current page, and 2 pages around current
              if (pageNumber === 1 || 
                  pageNumber === totalPages || 
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
                return (
                  <button
                    key={i}
                    className={`btn btn-sm ${currentPage === pageNumber ? "btn-primary" : "btn-outline-secondary"}`}
                    onClick={() => handlePageClick(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              }
              // Show ellipsis for skipped pages
              if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                return <span key={i} className="px-1">...</span>;
              }
              return null;
            })}
            
            <button 
              className="btn btn-sm btn-outline-secondary"
              onClick={handleNext} 
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PaginationControls;