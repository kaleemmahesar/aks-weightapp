import React, { useEffect } from "react";
import Select from "react-select";

const RecordsFilters = ({
  search,
  setSearch,
  reportType,
  setReportType,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  customFromDate,
  setCustomFromDate,
  customToDate,
  setCustomToDate,
  setCurrentPage,
  partyFilter,
  setPartyFilter,
  productFilter,
  setProductFilter,
  vehicleTypeFilter,
  setVehicleTypeFilter,
  uniqueParties,
  uniqueProducts,
  uniqueVehicleTypes,
  onClearFilters
}) => {
  // Convert unique values to react-select options
  const partyOptions = uniqueParties.map(party => ({ value: party, label: party }));
  const productOptions = uniqueProducts.map(product => ({ value: product, label: product }));
  const vehicleTypeOptions = uniqueVehicleTypes.map(vehicleType => ({ value: vehicleType, label: vehicleType }));

  // Custom styles for react-select to match bootstrap and fix z-index
  const customStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '38px',
      fontSize: '14px',
      borderColor: '#ced4da',
      borderRadius: '0.375rem',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#ced4da'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: 'absolute'
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d'
    })
  };

  return (
    <div className="col-md-9">
      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold">Search Records</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Search..." 
            value={search} 
            onChange={e => { 
              setSearch(e.target.value); 
              setCurrentPage(1); 
            }} 
          />
        </div>
        
        {/* Party Name Filter */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold">Party Name</label>
          <Select
            options={partyOptions}
            value={partyOptions.find(option => option.value === partyFilter) || null}
            onChange={(selectedOption) => {
              setPartyFilter(selectedOption ? selectedOption.value : "");
              setCurrentPage(1);
            }}
            placeholder="Select party..."
            isClearable
            styles={customStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        {/* Product Filter */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold">Product</label>
          <Select
            options={productOptions}
            value={productOptions.find(option => option.value === productFilter) || null}
            onChange={(selectedOption) => {
              setProductFilter(selectedOption ? selectedOption.value : "");
              setCurrentPage(1);
            }}
            placeholder="Select product..."
            isClearable
            styles={customStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        {/* Vehicle Type Filter */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold">Vehicle Type</label>
          <Select
            options={vehicleTypeOptions}
            value={vehicleTypeOptions.find(option => option.value === vehicleTypeFilter) || null}
            onChange={(selectedOption) => {
              setVehicleTypeFilter(selectedOption ? selectedOption.value : "");
              setCurrentPage(1);
            }}
            placeholder="Select vehicle type..."
            isClearable
            styles={customStyles}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold">Report Type</label>
          <select 
            className="form-select" 
            value={reportType} 
            onChange={e => setReportType(e.target.value)}
          >
            <option value="daily">Daily Report</option>
            <option value="monthly">Monthly Report</option>
            <option value="yearly">Yearly Report</option>
            <option value="overall">Overall Report</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
        
        {reportType === 'monthly' && (
          <div className="col-md-2">
            <label className="form-label text-muted fw-semibold">Month</label>
            <select 
              className="form-select" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1}>
                  {new Date(0, i).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {(reportType === 'monthly' || reportType === 'yearly') && (
          <div className="col-md-3">
            <label className="form-label text-muted fw-semibold">Year</label>
            <select 
              className="form-select" 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>
              })}
            </select>
          </div>
        )}
        
        {reportType === 'custom' && (
          <>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">From Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={customFromDate} 
                onChange={e => setCustomFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label text-muted fw-semibold">To Date</label>
              <input 
                type="date" 
                className="form-control" 
                value={customToDate} 
                onChange={e => setCustomToDate(e.target.value)}
              />
            </div>
          </>
        )}
        
        {/* Clear Filters Button */}
        <div className="col-md-12 mt-2">
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={onClearFilters}
            style={{ fontSize: '12px' }}
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordsFilters;