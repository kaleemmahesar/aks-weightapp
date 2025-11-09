
import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import "../styles/WeightForms.css";
import "../styles/EnhancedForms.css";
import { FaBalanceScale } from "react-icons/fa";
import { saveSecondWeightRecord } from "../redux/slices/recordsSlice";
import { getCurrentPSTDateTime } from '../utils/dateUtils';

export default function SecondWeightForm({ liveWeight, onSuccess }) {
  const dispatch = useDispatch();
  const { records = [] } = useSelector(state => state.records || {});
  const { settings = {} } = useSelector(state => state.settings || {});
  const vehiclePrices = settings.vehiclePrices || {};
  
  // State for search input
  const [searchInput, setSearchInput] = useState("");
  
  // Filter records based on search input
  const filteredRecords = records.filter((r) => 
    r && (r.second_weight === null || r.second_weight === undefined || r.second_weight === 0 || r.second_weight === "0" || r.second_weight === "0.00")
  );
  
  // Further filter by exact ID match only
  const searchFilteredRecords = filteredRecords.filter((r) => {
    if (!searchInput) return false; // Don't show any records when no search input (require search first)
    // Only match if the search input exactly matches the record ID
    return r.id && r.id.toString() === searchInput;
  });
  
  const options = [
    { value: "Select", label: "Select Vehicle".toUpperCase() },
    ...searchFilteredRecords.map((r) => ({
      value: r.id,
      label: `${(r.party_name || 'Unknown').toUpperCase()} | Serial No: ${(r.id || 'N/A')}`,
      record: r
    }))
  ];
  
  // Add "No records found" option when search returns no results
  if (searchInput && searchFilteredRecords.length === 0) {
    options.push({
      value: "no-results",
      label: `No records found for "${searchInput}"`.toUpperCase(),
      isDisabled: true
    });
  }

  // Custom styles for react-select (matching updated styling with z-index fix)
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.375rem',
      border: '2px solid #000000', // Black border
      fontSize: '1rem',
      minHeight: '58px',
      height: '58px',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(0, 0, 0, 0.25)' : 'none',
      borderColor: state.isFocused ? '#000000' : '#000000', // Black border
      backgroundColor: 'white',
      color: '#000000', // Black text
      fontWeight: '700', // Bold text
      '&:hover': {
        borderColor: '#000000' // Black border on hover
      },
      display: 'flex',
      alignItems: 'center'
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      border: '1px solid #000000', // Black border
      borderRadius: '0.375rem'
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: '56px',
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
      color: '#000000', // Black text
      fontWeight: '700' // Bold text
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: '0',
      color: '#000000', // Black text
      fontWeight: '700' // Bold text
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0',
      color: '#000000', // Black text
      fontWeight: '700' // Bold text
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '56px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#000000', // Black placeholder
      fontSize: '1rem',
      margin: '0',
      fontWeight: '700', // Bold placeholder
      display: 'flex',
      alignItems: 'center'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#000000' : state.isFocused ? '#f0f0f0' : 'white', // Black background when selected
      color: state.isSelected ? 'white' : '#000000', // White text when selected, black otherwise
      fontWeight: '700' // Bold text
    })
  };

  const formik = useFormik({
    initialValues: {
      selectedVehicle: null,
      secondWeight: liveWeight || "",
    },
    validationSchema: Yup.object({
      selectedVehicle: Yup.object().nullable().test('not-select', 'Please select a vehicle', (value) => value && value.value !== 'Select'),
      secondWeight: Yup.number()
        .typeError("Weight must be a number")
        .required("Second weight is required")
        .positive("Weight must be positive"),
    }),
    onSubmit: async (values, { resetForm }) => {
      if (!values.selectedVehicle || values.selectedVehicle.value === 'Select') {
        return alert("Please select a vehicle");
      }
      
      const recordId = values.selectedVehicle.value;
      const record = records.find((r) => r.id === recordId);
      if (!record) return alert("Record not found");

      const firstWeight = parseFloat(record.first_weight);
      const secondWeight = parseFloat(values.secondWeight);
      const netWeight = firstWeight - secondWeight;

      const totalPrice =
        parseFloat(record.total_price) || vehiclePrices[record.vehicle_type] || 0;

      try {
        const updatedRecord = {
          ...record,
          second_weight: secondWeight,
          net_weight: netWeight,
          total_price: totalPrice,
          second_weight_time: getCurrentPSTDateTime(),
        };

        // Dispatch the Redux action to save second weight
        const resultAction = await dispatch(saveSecondWeightRecord({
          id: recordId,
          secondWeight,
          netWeight,
          totalPrice
        }));

        if (saveSecondWeightRecord.fulfilled.match(resultAction)) {
          console.log("✅ Second weight saved:", resultAction.payload);
          
          if (onSuccess) {
            onSuccess(updatedRecord, "second");
          }

          resetForm();
        } else {
          alert("❌ " + (resultAction.error?.message || "Failed to save second weight"));
        }
      } catch (error) {
        console.error("Error saving second weight:", error);
        alert("Error saving second weight. Check console for details.");
      }
    },
  });

  useEffect(() => {
    formik.setFieldValue("secondWeight", liveWeight || "");
  }, [liveWeight]);

  return (
    <div className="modern-weight-card second-weight-card">
      {/* Enhanced Header */}
      <div className="modern-card-header">
        <div className="header-gradient"></div>
        <div className="header-content">
          <div className="icon-container">
            <FaBalanceScale size={32} className="header-icon" />
          </div>
          <div className="header-text">
            <h3 className="form-title gradient-text text-uppercase">Second Weight Entry</h3>
            <p className="form-subtitle text-uppercase">Complete the weighing process by recording final vehicle weight</p>
          </div>
        </div>
      </div>

      {/* Enhanced Form Body */}
      <div className="modern-card-body">
        <form onSubmit={formik.handleSubmit}>
          <div className="enhanced-form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {/* Vehicle Selection */}
            <div className="input-group-enhanced">
              <Select
                options={options}
                value={formik.values.selectedVehicle}
                onChange={(option) =>
                  formik.setFieldValue("selectedVehicle", option)
                }
                onInputChange={(inputValue) => {
                  setSearchInput(inputValue);
                }}
                isSearchable
                openMenuOnClick={true}
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...customSelectStyles.control(provided, state),
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.selectedVehicle && formik.errors.selectedVehicle ? '#dc3545' : '#000000'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 0, 0, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#000000' : (formik.touched.selectedVehicle && formik.errors.selectedVehicle ? '#dc3545' : '#000000'),
                    height: '58px',
                    minHeight: '58px',
                    textTransform: 'uppercase',
                  }),
                  option: (provided, state) => ({
                    ...customSelectStyles.option(provided, state),
                    backgroundColor: state.isSelected ? '#000000' : state.isFocused ? '#f0f0f0' : 'white',
                    color: state.isSelected ? 'white' : '#000000',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  }),
                  singleValue: (provided) => ({
                    ...customSelectStyles.singleValue(provided),
                    margin: '0',
                    color: '#000000',
                    fontWeight: '700',
                    textTransform: 'uppercase',
                  })
                }}
                placeholder={"Select Vehicle *".toUpperCase()}
                className="enhanced-select"
                noOptionsMessage={() => searchInput ? `No records found for "${searchInput}"` : "Start typing to search..."}
              />
              {formik.touched.selectedVehicle && formik.errors.selectedVehicle && (
                <div className="error-message-enhanced text-uppercase">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.selectedVehicle}
                </div>
              )}
            </div>

            {/* Second Weight Input */}
            <div className="input-group-enhanced weight-input-group">
              <div className={`weight-input-container ${
                formik.touched.secondWeight && formik.errors.secondWeight
                  ? "error"
                  : ""
              }`}>
                <input
                  type="number"
                  name="secondWeight"
                  id="secondWeight"
                  className="weight-input-enhanced"
                  value={formik.values.secondWeight}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={"Second Weight *".toUpperCase()}
                />
                <div className="weight-unit text-uppercase">KG</div>
                <div className="live-badge">
                  <span className="live-dot"></span>
                  <span className="text-uppercase">LIVE</span>
                </div>
              </div>
              {formik.touched.secondWeight && formik.errors.secondWeight && (
                <div className="error-message-enhanced text-uppercase">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.secondWeight}
                </div>
              )}
            </div>

            

            {/* Record Summary Display - Always show when a record is selected */}
            {formik.values.selectedVehicle && formik.values.selectedVehicle.value !== "Select" && (
              <div className="input-group-enhanced" style={{ gridColumn: 'span 2' }}>
                <div className="record-summary-container" style={{ padding: '20px', backgroundColor: '#e9f7ef', borderRadius: '12px', border: '2px solid #28a745' }}>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '15px', color: '#155724' }}>Record Summary:</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>Business Name:</strong> 
                      <span style={{ marginLeft: '8px', fontSize: '1.3rem', fontWeight: '600', color: '#0c5460', textTransform: 'uppercase' }}>{formik.values.selectedVehicle.record.business_name || 'N/A'}</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>Party Name:</strong> 
                      <span style={{ marginLeft: '8px', fontSize: '1.3rem', fontWeight: '600', color: '#0c5460', textTransform: 'uppercase' }}>{formik.values.selectedVehicle.record.party_name || 'N/A'}</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>Vehicle Number:</strong> 
                      <span style={{ marginLeft: '8px', fontSize: '1.3rem', fontWeight: '600', color: '#0c5460', textTransform: 'uppercase' }}>{formik.values.selectedVehicle.record.vehicle_number || 'N/A'}</span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>First Weight:</strong> 
                      <span style={{ marginLeft: '8px', fontWeight: 'bold', color: '#007bff', fontSize: '1.5rem', textTransform: 'uppercase' }}>
                        {formik.values.selectedVehicle.record.first_weight ? `${parseFloat(formik.values.selectedVehicle.record.first_weight).toFixed(2)} KG` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <strong style={{ fontSize: '1.2rem' }}>Product:</strong> 
                      <span style={{ marginLeft: '8px', fontSize: '1.3rem', fontWeight: '600', color: '#0c5460', textTransform: 'uppercase' }}>{formik.values.selectedVehicle.record.product || 'N/A'}</span>
                    </div>
                    <div>
                      {/* Net Weight Display */}
            {formik.values.selectedVehicle && formik.values.selectedVehicle.value !== "Select" && formik.values.secondWeight && (
              <div className="input-group-enhanced" style={{ gridColumn: 'span 3' }}>
                <div className="weight-summary-container">
        
                  
                  {/* Display Net Weight in KG, Munds, and Tons */}
                  <div className="summary-item net-weight d-flex align-items-center">
                    <strong style={{ fontSize: '1.2rem' }}>Net Weight:</strong>
                    <span className="summary-value" style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#007bff' }}>
                      {(() => {
                        const record = formik.values.selectedVehicle.record;
                        if (record) {
                          const firstWeight = parseFloat(record.first_weight);
                          const secondWeight = parseFloat(formik.values.secondWeight);
                          const netWeight = firstWeight - secondWeight;
                          const munds = netWeight / 40;
                          // Use trunc() instead of floor() to handle negative numbers correctly
                          const mundsInteger = Math.trunc(munds);
                          // Calculate remaining kg properly for negative values
                          const kgRemaining = netWeight - (mundsInteger * 40);
                          const tons = netWeight / 1000;
                          return `${netWeight.toFixed(2)} KG | ${mundsInteger}-${Math.abs(kgRemaining).toFixed(0)} Munds | ${tons.toFixed(2)} Tons`;
                        }
                        return "N/A";
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}
                      
                    </div>
                  </div>
                </div>
              </div>
            )}

            

            {/* Submit Button */}
            <div className="input-group-enhanced submit-section" style={{ gridColumn: 'span 3' }}>
              <button 
                type="submit" 
                className="submit-button-enhanced second-weight-submit text-uppercase"
                disabled={formik.isSubmitting}
              >
                <div className="button-content">
                  <div className="button-icon">
                    <FaBalanceScale size={18} />
                  </div>
                  <span className="button-text text-uppercase">
                    {formik.isSubmitting ? 'Processing...' : 'Save Second Weight'}
                  </span>
                  <div className="button-arrow">
                    <i className="fas fa-arrow-right"></i>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
