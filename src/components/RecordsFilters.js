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
  businessNameFilter,
  setBusinessNameFilter,
  uniqueParties,
  uniqueProducts,
  uniqueVehicleTypes,
  uniqueBusinessNames,
  onClearFilters
}) => {
  // Convert unique values to react-select options with deduplication
  const deduplicateOptions = (items) => {
    const seen = new Map(); // Use Map to store the canonical form
    const uniqueItems = [];
    
    items.forEach(item => {
      const upperItem = item.toUpperCase();
      if (!seen.has(upperItem)) {
        seen.set(upperItem, item); // Store the first occurrence as canonical
        uniqueItems.push(item);
      }
    });
    
    // Return options with uppercase for display, but keep original value for matching
    return uniqueItems.map(item => ({ 
      value: item, 
      label: item.toUpperCase() // Show uppercase for display
    }));
  };
  
  const partyOptions = deduplicateOptions(uniqueParties);
  const productOptions = deduplicateOptions(uniqueProducts);
  const vehicleTypeOptions = uniqueVehicleTypes.map(vehicleType => ({ value: vehicleType, label: vehicleType.toUpperCase() }));
  const businessNameOptions = deduplicateOptions(uniqueBusinessNames);

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
          <label className="form-label text-muted fw-semibold text-uppercase">Search Records</label>
          <input 
            type="text" 
            className="form-control text-uppercase" 
            placeholder={"Search...".toUpperCase()} 
            value={search} 
            onChange={e => { 
              setSearch(e.target.value); 
              setCurrentPage(1); 
            }} 
          />
        </div>
        
        {/* Business Name Filter - Modified for multiple selection */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold text-uppercase">Business Name</label>
          <Select
            options={businessNameOptions}
            value={businessNameOptions.filter(option => businessNameFilter.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
              setBusinessNameFilter(selectedValues);
              setCurrentPage(1);
            }}
            placeholder={"Select business name(s)...".toUpperCase()}
            isClearable
            isMulti
            styles={{
              ...customStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                fontSize: '14px',
                borderColor: '#ced4da',
                borderRadius: '0.375rem',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#ced4da'
                },
                textTransform: 'uppercase'
              }),
              option: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              singleValue: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#6c757d',
                textTransform: 'uppercase'
              })
            }}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        {/* Party Name Filter - Modified for multiple selection */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold text-uppercase">Party Name</label>
          <Select
            options={partyOptions}
            value={partyOptions.filter(option => partyFilter.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
              setPartyFilter(selectedValues);
              setCurrentPage(1);
            }}
            placeholder={"Select party name(s)...".toUpperCase()}
            isClearable
            isMulti
            styles={{
              ...customStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                fontSize: '14px',
                borderColor: '#ced4da',
                borderRadius: '0.375rem',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#ced4da'
                },
                textTransform: 'uppercase'
              }),
              option: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              singleValue: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#6c757d',
                textTransform: 'uppercase'
              })
            }}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        {/* Product Filter - Modified for multiple selection */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold text-uppercase">Product</label>
          <Select
            options={productOptions}
            value={productOptions.filter(option => productFilter.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
              setProductFilter(selectedValues);
              setCurrentPage(1);
            }}
            placeholder={"Select product(s)...".toUpperCase()}
            isClearable
            isMulti
            styles={{
              ...customStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                fontSize: '14px',
                borderColor: '#ced4da',
                borderRadius: '0.375rem',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#ced4da'
                },
                textTransform: 'uppercase'
              }),
              option: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              singleValue: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#6c757d',
                textTransform: 'uppercase'
              })
            }}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        {/* Vehicle Type Filter - Modified for multiple selection */}
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold text-uppercase">Vehicle Type</label>
          <Select
            options={vehicleTypeOptions}
            value={vehicleTypeOptions.filter(option => vehicleTypeFilter.includes(option.value))}
            onChange={(selectedOptions) => {
              const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
              setVehicleTypeFilter(selectedValues);
              setCurrentPage(1);
            }}
            placeholder={"Select vehicle type(s)...".toUpperCase()}
            isClearable
            isMulti
            styles={{
              ...customStyles,
              control: (provided) => ({
                ...provided,
                minHeight: '38px',
                fontSize: '14px',
                borderColor: '#ced4da',
                borderRadius: '0.375rem',
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#ced4da'
                },
                textTransform: 'uppercase'
              }),
              option: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              singleValue: (provided) => ({
                ...provided,
                textTransform: 'uppercase'
              }),
              placeholder: (provided) => ({
                ...provided,
                color: '#6c757d',
                textTransform: 'uppercase'
              })
            }}
            menuPortalTarget={document.body}
            menuPosition={'fixed'}
          />
        </div>
        
        <div className="col-md-4">
          <label className="form-label text-muted fw-semibold text-uppercase">Report Type</label>
          <select 
            className="form-select text-uppercase" 
            value={reportType} 
            onChange={e => setReportType(e.target.value)}
          >
            <option value="daily" className="text-uppercase">Daily Report</option>
            <option value="monthly" className="text-uppercase">Monthly Report</option>
            <option value="yearly" className="text-uppercase">Yearly Report</option>
            <option value="overall" className="text-uppercase">Overall Report</option>
            <option value="custom" className="text-uppercase">Custom Range</option>
          </select>
        </div>
        
        {reportType === 'monthly' && (
          <div className="col-md-2">
            <label className="form-label text-muted fw-semibold text-uppercase">Month</label>
            <select 
              className="form-select text-uppercase" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i+1} value={i+1} className="text-uppercase">
                  {new Date(0, i).toLocaleString('default', { month: 'long' }).toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {(reportType === 'monthly' || reportType === 'yearly') && (
          <div className="col-md-3">
            <label className="form-label text-muted fw-semibold text-uppercase">Year</label>
            <select 
              className="form-select text-uppercase" 
              value={selectedYear} 
              onChange={e => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({length: 5}, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return (
                  <option key={year} value={year} className="text-uppercase">
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        )}
        
        {reportType === 'custom' && (
          <>
            <div className="col-md-3">
              <label className="form-label text-muted fw-semibold text-uppercase">From Date</label>
              <input 
                type="date" 
                className="form-control text-uppercase" 
                value={customFromDate} 
                onChange={e => setCustomFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label text-muted fw-semibold text-uppercase">To Date</label>
              <input 
                type="date" 
                className="form-control text-uppercase" 
                value={customToDate} 
                onChange={e => setCustomToDate(e.target.value)}
              />
            </div>
          </>
        )}
        
        <div className="col-md-2 d-flex align-items-end">
          <button 
            className="btn btn-outline-secondary w-100 text-uppercase" 
            onClick={onClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordsFilters;