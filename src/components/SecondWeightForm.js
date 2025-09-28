
import React, { useEffect } from "react";
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
  // const options = [
  //   { value: "Select", label: "Select Vehicle" },
  //   ...records
  //     .filter((r) => r && (r.second_weight === null || r.second_weight === undefined || !r.second_weight))
  //     .map((r) => ({
  //       value: r.id,
  //       label: `${r.party_name || 'Unknown'} | Serial No: ${r.id || 'N/A'}`,
  //     }))
  // ];

  const options = [
  { value: "Select", label: "Select Vehicle" },
  ...records
    .filter((r) => r && (r.second_weight === null || r.second_weight === undefined || !r.second_weight))
    .map((r) => ({
      value: r.id,
      label: `${r.party_name || 'Unknown'} | Serial No: ${r.id || 'N/A'}`,
      record: r   // ✅ keep the full record here
    }))
];


  // Custom styles for react-select (matching updated styling with z-index fix)
  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderRadius: '0.375rem',
      border: '1px solid #ced4da',
      fontSize: '1rem',
      minHeight: '58px',
      height: '58px',
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      boxShadow: state.isFocused ? '0 0 0 0.25rem rgba(13, 110, 253, 0.25)' : 'none',
      borderColor: state.isFocused ? '#86b7fe' : '#ced4da',
      backgroundColor: 'white',
      '&:hover': {
        borderColor: '#86b7fe'
      }
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0
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
      alignItems: 'center'
    }),
    singleValue: (provided) => ({
      ...provided,
      margin: '0',
      color: '#495057'
    }),
    input: (provided) => ({
      ...provided,
      margin: '0',
      padding: '0'
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: '56px'
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#6c757d',
      fontSize: '1rem',
      margin: '0'
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0d6efd' : state.isFocused ? '#f8f9fc' : 'white',
      color: state.isSelected ? 'white' : '#495057'
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
            <h3 className="form-title gradient-text">Second Weight Entry</h3>
            <p className="form-subtitle">Complete the weighing process by recording final vehicle weight</p>
          </div>
        </div>
      </div>

      {/* Enhanced Form Body */}
      <div className="modern-card-body">
        <form onSubmit={formik.handleSubmit}>
          <div className="enhanced-form-grid">
            {/* Vehicle Selection */}
            <div className="input-group-enhanced">
              <Select
                options={options}
                value={formik.values.selectedVehicle}
                onChange={(option) =>
                  formik.setFieldValue("selectedVehicle", option)
                }
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...provided,
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.vehicleType && formik.errors.vehicleType ? '#dc3545' : '#ced4da'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#007bff' : (formik.touched.vehicleType && formik.errors.vehicleType ? '#dc3545' : '#ced4da'),
                    height: '58px',
                    minHeight: '58px'
                  })
                }}
                placeholder="Select Vehicle to Complete Weighing *"
                className="enhanced-select"
              />
              {formik.touched.selectedVehicle && formik.errors.selectedVehicle && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.selectedVehicle}
                </div>
              )}
            </div>

            {/* Live Weight Input */}
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
                  placeholder="Live Weight *"
                />
                <div className="weight-unit">KG</div>
                <div className="live-badge">
                  <span className="live-dot"></span>
                  LIVE
                </div>
              </div>
              {formik.touched.secondWeight && formik.errors.secondWeight && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.secondWeight}
                </div>
              )}
            </div>
          </div>
          
          
          
          {/* ✅ Summary Section */}
{formik.values.selectedVehicle?.record && (
  <div className="row">
            <div className="col-6">
  <div className="weight-summary">
    <h4 className="summary-title">Weight Summary</h4>
    <div className="summary-column">
      <div className="summary-item">
        <span className="summary-label">First Weight:</span>
        <span className="summary-value">
          {formik.values.selectedVehicle.record.first_weight} KG
        </span>
      </div>
      <div className="summary-item">
        <span className="summary-label">Second Weight:</span>
        <span className="summary-value">
          {formik.values.secondWeight || "-"} KG
        </span>
      </div>
      <div className="summary-item net-weight">
        <span className="summary-label">Net Weight:</span>
        <span className="summary-value">
          {formik.values.secondWeight
            ? formik.values.selectedVehicle.record.first_weight -
              formik.values.secondWeight
            : "-"}{" "}
          KG
        </span>
      </div>
    </div>
  </div>
  </div>
  </div>
)}



          {/* Enhanced Submit Button */}
          <div className="submit-section">
            <button 
              type="submit" 
              className="submit-button-enhanced second-weight-submit"
              disabled={formik.isSubmitting}
            >
              <div className="button-content">
                <div className="button-icon">
                  <FaBalanceScale size={18} />
                </div>
                <span className="button-text">
                  {formik.isSubmitting ? 'Processing...' : 'Complete Second Weight'}
                </span>
                <div className="button-arrow">
                  <i className="fas fa-arrow-right"></i>
                </div>
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
