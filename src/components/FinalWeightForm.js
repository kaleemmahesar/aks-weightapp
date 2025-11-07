import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import "../styles/WeightForms.css";
import "../styles/EnhancedForms.css";
import { FaBalanceScale } from "react-icons/fa";
import { saveFinalWeightRecord } from "../redux/slices/recordsSlice";
import { STANDARD_PRODUCTS, DEFAULT_VEHICLE_TYPE, getVehiclePrices } from "../config/vehicleConfig";

export default function FinalWeightForm({
  liveWeight,
  onSuccess,
}) {
  const dispatch = useDispatch();
  const { settings = {} } = useSelector(state => state.settings || {});
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);
  
  // Define vehicle types that should allow manual vehicle number input
  const specialVehicleTypes = ["Truck", "Dahwheeler", "SixWheeler", "Container"];

  // Custom styles for react-select (matching original form height and styling)
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

  // Vehicle options for react-select
  const vehicleOptions = [
    { value: "Select", label: "Select Vehicle Type" },
    ...Object.entries(vehiclePrices).map(([type, price]) => ({
      value: type,
      label: `${type} — ${price.toLocaleString()}`
    }))
  ];

  // Product options for react-select
  const productOptions = STANDARD_PRODUCTS.map(product => ({
    value: product.value,
    label: product.label
  }));

  // Handle vehicle type change for react-select
  const handleVehicleTypeChange = (selectedOption) => {
    const vehicleType = selectedOption ? selectedOption.value : 'Select';
    formik.setFieldValue('finalVehicleType', vehicleType);
    
    if (selectedOption && selectedOption.value !== 'Select') {
      // Set vehicle number to the vehicle type name for specific vehicle types
      // If vehicle type is NOT Truck, Dahwheeler, SixWheeler, or Container, fill vehicle number with vehicle type name
      if (!specialVehicleTypes.includes(selectedOption.value)) {
        formik.setFieldValue('finalVehicle', selectedOption.value);
      } else {
        // For special vehicle types, clear the vehicle number to allow manual input
        formik.setFieldValue('finalVehicle', '');
      }
    } else {
      // Reset vehicle number to empty when no vehicle type is selected
      formik.setFieldValue('finalVehicle', '');
    }
  };

  // Handle product change for react-select
  const handleProductChange = (selectedOption) => {
    formik.setFieldValue('finalProduct', selectedOption ? selectedOption.value : 'Select');
  };

  const getCurrentDateTime = () => {
    const now = new Date();
    const options = {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatted = new Intl.DateTimeFormat("en-CA", options).format(now);
    return formatted.replace(",", "").replace(/\//g, "-");
  };

  const formik = useFormik({
    initialValues: {
      finalVehicle: "",
      party: "",
      finalVehicleType: "Select",
      finalProduct: "",
      emptyWeight: "",
      finalWeight: "",
      finalWithDriver: true,
    },
    validationSchema: Yup.object({
      finalVehicle: Yup.string().required("Required"),
      party: Yup.string().required("Required"),
      finalVehicleType: Yup.string().required("Required"),
      finalProduct: Yup.string().required("Required"),
      emptyWeight: Yup.number()
        .typeError("Must be a number")
        .required("Required"),
      finalWeight: Yup.number()
        .required("Weight is required")
        .min(0, "Weight cannot be negative"),
    }),
    onSubmit: async (values, { resetForm }) => {
      const netWeight =
        parseFloat(values.finalWeight) - parseFloat(values.emptyWeight);
      const totalPrice = vehiclePrices[values.finalVehicleType] || 0;

      const recordData = {
        vehicle_number: values.finalVehicle,
        party_name: values.party, 
        vehicle_type: values.finalVehicleType,
        product: values.finalProduct,
        first_weight: values.finalWeight,
        second_weight: values.emptyWeight,
        net_weight: netWeight,
        total_price: totalPrice,
        driver_name: values.finalWithDriver ? "Yes" : "No",
        first_weight_time: getCurrentDateTime(),
        second_weight_time: getCurrentDateTime(),
        final_weight: "Yes",
      };

      try {
        // Dispatch the Redux action to save final weight
        const resultAction = await dispatch(saveFinalWeightRecord(recordData));

        if (saveFinalWeightRecord.fulfilled.match(resultAction)) {
          console.log("✅ Final weight saved:", resultAction.payload);

          const recordedData = resultAction.payload.record;
          console.log(recordedData);
          if (onSuccess) onSuccess(recordedData, "final");
          resetForm();
        } else {
          alert("❌ " + (resultAction.error?.message || "Failed to save final weight"));
        }
      } catch (error) {
        console.error("Error saving final weight:", error);
        alert("Error saving final weight. Check console.");
      }
    },
  });

// ✅ Update weight when liveWeight changes

  useEffect(() => {
  if (liveWeight !== undefined && liveWeight !== null) {
    formik.setFieldValue("finalWeight", liveWeight);
  }
}, [liveWeight]);

  return (
    <div className="modern-weight-card final-weight-card">
      {/* Enhanced Header */}
      <div className="modern-card-header">
        <div className="header-gradient"></div>
        <div className="header-content">
          <div className="icon-container">
            <FaBalanceScale size={32} className="header-icon" />
          </div>
          <div className="header-text">
            <h3 className="form-title gradient-text">Final Weight Entry</h3>
            <p className="form-subtitle">Complete transaction with full weight calculation</p>
          </div>
        </div>
      </div>

      {/* Enhanced Form Body */}
      <div className="modern-card-body">
        <form onSubmit={formik.handleSubmit}>
          <div className="enhanced-form-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {/* Vehicle Type */}
            <div className="input-group-enhanced">
              <Select
                options={vehicleOptions}
                value={vehicleOptions.find(option => option.value === formik.values.finalVehicleType)}
                onChange={handleVehicleTypeChange}
                onBlur={() => formik.setFieldTouched('finalVehicleType', true)}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...provided,
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.finalVehicleType && formik.errors.finalVehicleType ? '#dc3545' : '#ced4da'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#007bff' : (formik.touched.finalVehicleType && formik.errors.finalVehicleType ? '#dc3545' : '#ced4da'),
                    height: '58px',
                    minHeight: '58px'
                  })
                }}
                placeholder="Select Vehicle Type *"
                className="enhanced-select"
              />
              {formik.touched.finalVehicleType && formik.errors.finalVehicleType && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.finalVehicleType}
                </div>
              )}
            </div>
            {/* Vehicle Number */}
            <div className="input-group-enhanced">
              <input
                type="text"
                name="finalVehicle"
                id="finalVehicle"
                className={`weight-input-enhanced ${
                  formik.touched.finalVehicle && formik.errors.finalVehicle
                    ? "error"
                    : ""
                }`}
                value={formik.values.finalVehicle}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Vehicle Number *"
              />
              {formik.touched.finalVehicle && formik.errors.finalVehicle && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.finalVehicle}
                </div>
              )}
            </div>

            {/* Party Name */}
            <div className="input-group-enhanced">
              <input
                type="text"
                name="party"
                id="party"
                className={`weight-input-enhanced ${
                  formik.touched.party && formik.errors.party
                    ? "error"
                    : ""
                }`}
                value={formik.values.party}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Party Name *"
              />
              {formik.touched.party && formik.errors.party && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.party}
                </div>
              )}
            </div>

            

            {/* Product */}
            {/* <div className="input-group-enhanced">
              <Select
                options={productOptions}
                value={productOptions.find(option => option.value === formik.values.finalProduct)}
                onChange={handleProductChange}
                onBlur={() => formik.setFieldTouched('finalProduct', true)}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...provided,
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.finalProduct && formik.errors.finalProduct ? '#dc3545' : '#ced4da'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 123, 255, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#007bff' : (formik.touched.finalProduct && formik.errors.finalProduct ? '#dc3545' : '#ced4da'),
                    height: '58px',
                    minHeight: '58px'
                  })
                }}
                placeholder="Select Product Type *"
                className="enhanced-select"
              />
              {formik.touched.finalProduct && formik.errors.finalProduct && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.finalProduct}
                </div>
              )}
            </div> */}

            <div className="input-group-enhanced">
              <input
                type="text"
                name="finalProduct"
                id="finalProduct"
                className={`weight-input-enhanced ${
                  formik.touched.party && formik.errors.finalProduct
                    ? "error"
                    : ""
                }`}
                value={formik.values.finalProduct}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Product Type *"
              />
              {formik.touched.finalProduct && formik.errors.finalProduct && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.finalProduct}
                </div>
              )}
            </div>

            {/* Empty Weight */}
            <div className="input-group-enhanced">
              <div className={`weight-input-container ${
                formik.touched.emptyWeight && formik.errors.emptyWeight
                  ? "error"
                  : ""
              }`}>
                <input
                  type="number"
                  name="emptyWeight"
                  id="emptyWeight"
                  className="weight-input-enhanced"
                  value={formik.values.emptyWeight}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Empty Weight *"
                />
                <div className="weight-unit">KG</div>
              </div>
              {formik.touched.emptyWeight && formik.errors.emptyWeight && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.emptyWeight}
                </div>
              )}
            </div>

            {/* Current Weight (Live) */}
            <div className="input-group-enhanced weight-input-group">
              <div className={`weight-input-container ${
                formik.touched.finalWeight && formik.errors.finalWeight
                  ? "error"
                  : ""
              }`}>
                <input
                  type="number"
                  name="finalWeight"
                  id="finalWeight"
                  className="weight-input-enhanced"
                  value={formik.values.finalWeight}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="Final Weight *"
                />
                <div className="weight-unit">KG</div>
                <div className="live-badge">
                  <span className="live-dot"></span>
                  LIVE
                </div>
              </div>
              {formik.touched.finalWeight && formik.errors.finalWeight && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.finalWeight}
                </div>
              )}
            </div>

            {/* Net Weight (Calculated) */}
            <div className="input-group-enhanced" style={{ gridColumn: 'span 2' }}>
              <div className="weight-input-container">
                <input
                  type="number"
                  id="netWeight"
                  className="weight-input-enhanced"
                  value={
                    formik.values.finalWeight && formik.values.emptyWeight
                      ? (
                          formik.values.finalWeight - formik.values.emptyWeight
                        ).toFixed(2)
                      : ""
                  }
                  readOnly
                  style={{ backgroundColor: "#f8f9fa", fontWeight: "600", color: "#007bff" }}
                  placeholder="Net Weight (Auto Calculated)"
                />
                <div className="weight-unit">KG</div>
              </div>
              {/* Display Net Weight in KG, Munds, and Tons like SecondWeightForm */}
              {formik.values.finalWeight && formik.values.emptyWeight && (
                <div className="summary-item net-weight" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                  <span className="summary-value" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
                    {(() => {
                      const netWeight = formik.values.finalWeight - formik.values.emptyWeight;
                      const munds = netWeight / 40;
                      // Use trunc() instead of floor() to handle negative numbers correctly
                      const mundsInteger = Math.trunc(munds);
                      // Calculate remaining kg properly for negative values
                      const kgRemaining = netWeight - (mundsInteger * 40);
                      const tons = netWeight / 1000;
                      return `${netWeight.toFixed(2)} KG | ${mundsInteger} Munds ${kgRemaining.toFixed(0)} kg | ${tons.toFixed(2)} Tons`;
                    })()}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Enhanced Submit Button */}
          <div className="submit-section">
            <button 
              type="submit" 
              className="submit-button-enhanced final-weight-submit"
              disabled={formik.isSubmitting}
            >
              <div className="button-content">
                <div className="button-icon">
                  <FaBalanceScale size={18} />
                </div>
                <span className="button-text">
                  {formik.isSubmitting ? 'Processing...' : 'Save Final Weight'}
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
