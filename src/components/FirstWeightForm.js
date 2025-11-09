import React, { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import Select from "react-select";
import { useDispatch, useSelector } from "react-redux";
import "../styles/WeightForms.css";
import "../styles/EnhancedForms.css";
import { FaBalanceScale  } from "react-icons/fa";
import notify from "./notification";
import { saveFirstWeightRecord } from "../redux/slices/recordsSlice";
import { getCurrentPSTDateTime } from '../utils/dateUtils';
import { STANDARD_PRODUCTS, DEFAULT_VEHICLE_TYPE, getVehiclePrices } from "../config/vehicleConfig";

const FirstWeightForm = ({ liveWeight, onSuccess }) => {
  const dispatch = useDispatch();
  const { settings = {} } = useSelector(state => state.settings || {});
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);
  const businessNames = settings.businessNames || [];
  const [totalPrice, setTotalPrice] = React.useState(vehiclePrices[DEFAULT_VEHICLE_TYPE]);

  // Define vehicle types that should have vehicle number set to "000"
  const zeroVehicleTypes = ["Tractor", "Chingchi", "Daalo", "GadahGano"];

  // Custom styles for react-select (matching original form height and styling)
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
      }
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
      fontWeight: '700' // Bold placeholder
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#000000' : state.isFocused ? '#f0f0f0' : 'white', // Black background when selected
      color: state.isSelected ? 'white' : '#000000', // White text when selected, black otherwise
      fontWeight: '700' // Bold text
    })
  };

  // Business name options for react-select
  const businessNameOptions = [
    { value: "", label: "Select Business Name (Optional)".toUpperCase() },
    ...businessNames.map(name => ({
      value: name,
      label: name.toUpperCase()  // Make label uppercase
    }))
  ];

  // Vehicle options for react-select
  const vehicleOptions = [
    { value: "Select", label: "Select Vehicle Type".toUpperCase() },
    ...Object.entries(vehiclePrices).map(([type, price]) => ({
      value: type,
      label: `${type.toUpperCase()} — ${price.toLocaleString()}`  // Make vehicle type uppercase
    }))
  ];

  // Product options for react-select
  const productOptions = STANDARD_PRODUCTS.map(product => ({
    value: product.value,
    label: product.label
  }));

  // Handle business name change
  const handleBusinessNameChange = (selectedOption) => {
    formik.setFieldValue('businessName', selectedOption ? selectedOption.value : '');
  };

  // ✅ When vehicleType changes, update price dynamically and set vehicle number for specific types
  const handleVehicleTypeChange = (selectedOption) => {
    const vehicleType = selectedOption ? selectedOption.value : 'Select';
    formik.setFieldValue('vehicleType', vehicleType);
    
    if (selectedOption && selectedOption.value !== 'Select') {
      setTotalPrice(vehiclePrices[selectedOption.value]);
      
      // Set vehicle number to the vehicle type name for specific vehicle types
      // If vehicle type is NOT Truck, Dahwheeler, SixWheeler, or Container, fill vehicle number with vehicle type name
      const specialVehicleTypes = ["Truck", "Dahwheeler", "SixWheeler", "Container"];
      if (!specialVehicleTypes.includes(selectedOption.value)) {
        formik.setFieldValue('vehicleNumber', selectedOption.value);
      } else {
        // For special vehicle types, clear the vehicle number to allow manual input
        formik.setFieldValue('vehicleNumber', '');
      }
    } else {
      setTotalPrice(0);
      // Reset vehicle number to empty when no vehicle type is selected
      formik.setFieldValue('vehicleNumber', '');
    }
  };

  // Handle product change for react-select
  const handleProductChange = (selectedOption) => {
    formik.setFieldValue('product', selectedOption ? selectedOption.value : 'Select');
  };

  const validationSchema = Yup.object({
    businessName: Yup.string(),
    vehicleNumber: Yup.string().required("Vehicle number is required"),
    party: Yup.string().required("Party Name is required"),
    vehicleType: Yup.string().notOneOf(["Select"], "Please select a vehicle type"),
    product: Yup.string().required("Product name is required"),
    currentWeight: Yup.number()
  .required("Weight is required")
  .min(0, "Weight cannot be negative"),
      withDriver: Yup.boolean()
  });

  const formik = useFormik({
    initialValues: {
      businessName: "",
      vehicleNumber: "",
      party: "",
      vehicleType: "Select",
      product: "",
      currentWeight: 0,
      withDriver: false
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      const updatedValues = {
        ...values,
        price: totalPrice
      };

      // ✅ Prepare API payload
      const newRecord = {
        vehicle: updatedValues.vehicleNumber,
        party: updatedValues.party, 
        type: updatedValues.vehicleType,
        product: updatedValues.product,
        weight: parseFloat(updatedValues.currentWeight),
        price: updatedValues.price,
        driver: updatedValues.withDriver ? "Yes" : "No",
        business_name: updatedValues.businessName || null
      };

      console.log("New Record to save:", newRecord);

      try {

        const resultAction = await dispatch(saveFirstWeightRecord(newRecord));
        
        if (!resultAction.error) {
          const response = resultAction.payload;
          console.log("✅ First weight saved:", response);
          
          // Handle both direct response and nested record structure
          const record = response.record || response;

          const savedRecord = {
            id: record.id,
            vehicle_number: record.vehicle,
            party_name: record.party,
            vehicle_type: record.type,
            product: record.product,
            first_weight: record.weight,
            first_weight_time: getCurrentPSTDateTime(),
            driver_name: record.driver,
            second_weight: null,
            net_weight: null,
            total_price: record.price,
            second_weight_time: null,
            business_name: record.business_name || null
          };

          console.log("saved Records", savedRecord);

          // ✅ If parent needs to update state or show modal
          if (onSuccess) {
            onSuccess(savedRecord, "first");
          }

          resetForm();
        } else {
          notify.error(resultAction.error.message || "Failed to save record");
        }
      } catch (error) {
        console.error(error);
        notify.error("Error saving record");
      }
    }
  });

  // ✅ Update weight when liveWeight changes
  useEffect(() => {
  if (liveWeight !== undefined && liveWeight !== null) {
    formik.setFieldValue("currentWeight", liveWeight);
  }
}, [liveWeight]);

  return (
    <div className="modern-weight-card first-weight-card">
      {/* Enhanced Header */}
      <div className="modern-card-header">
        <div className="header-gradient"></div>
        <div className="header-content">
          <div className="icon-container">
            <FaBalanceScale size={32} className="header-icon" />
          </div>
          <div className="header-text">
            <h3 className="form-title gradient-text">First Weight Entry</h3>
            <p className="form-subtitle">Record initial vehicle weight measurement</p>
          </div>
        </div>
      </div>

      {/* Enhanced Form Body */}
      <div className="modern-card-body">
        <form onSubmit={formik.handleSubmit}>
          <div className="enhanced-form-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>

            {/* Business Name */}
            <div className="input-group-enhanced">
              <Select
                options={businessNameOptions}
                value={businessNameOptions.find(option => option.value === formik.values.businessName) || businessNameOptions[0]}
                onChange={handleBusinessNameChange}
                onBlur={() => formik.setFieldTouched('businessName', true)}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...customSelectStyles.control(provided, state),
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.businessName && formik.errors.businessName ? '#dc3545' : '#000000'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 0, 0, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#000000' : (formik.touched.businessName && formik.errors.businessName ? '#dc3545' : '#000000'),
                    height: '58px',
                    minHeight: '58px',
                    textTransform: 'uppercase'
                  }),
                  option: (provided, state) => ({
                    ...customSelectStyles.option(provided, state),
                    backgroundColor: state.isSelected ? '#000000' : state.isFocused ? '#f0f0f0' : 'white',
                    color: state.isSelected ? 'white' : '#000000',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  }),
                  singleValue: (provided) => ({
                    ...customSelectStyles.singleValue(provided),
                    margin: '0',
                    color: '#000000',
                    fontWeight: '700',
                    textTransform: 'uppercase'
                  })
                }}
                placeholder="Select Business Name"
                className="enhanced-select"
              />
              {formik.touched.businessName && formik.errors.businessName && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.businessName}
                </div>
              )}
            </div>

            {/* Vehicle Type */}
            <div className="input-group-enhanced">
              <Select
                options={vehicleOptions}
                value={vehicleOptions.find(option => option.value === formik.values.vehicleType)}
                onChange={handleVehicleTypeChange}
                onBlur={() => formik.setFieldTouched('vehicleType', true)}
                isSearchable
                menuPortalTarget={document.body}
                menuPosition="absolute"
                menuPlacement="auto"
                styles={{
                  ...customSelectStyles,
                  control: (provided, state) => ({
                    ...customSelectStyles.control(provided, state),
                    borderRadius: '4px',
                    border: `1px solid ${formik.touched.vehicleType && formik.errors.vehicleType ? '#dc3545' : '#000000'}`,
                    boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(0, 0, 0, 0.25)' : 'none',
                    borderColor: state.isFocused ? '#000000' : (formik.touched.vehicleType && formik.errors.vehicleType ? '#dc3545' : '#000000'),
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
                placeholder="Select Vehicle Type *"
                className="enhanced-select"
              />
              {formik.touched.vehicleType && formik.errors.vehicleType && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.vehicleType}
                </div>
              )}
            </div>

            {/* Vehicle Number */}
            <div className="input-group-enhanced">
              <input
                type="text"
                name="vehicleNumber"
                id="vehicleNumber"
                className={`weight-input-enhanced ${
                  formik.touched.vehicleNumber && formik.errors.vehicleNumber
                    ? "error"
                    : ""
                }`}
                value={formik.values.vehicleNumber}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Vehicle Number *"
              />
              {formik.touched.vehicleNumber && formik.errors.vehicleNumber && (
                <div className="error-message-enhanced">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.vehicleNumber}
                </div>
              )}
            </div>

            {/* Party Name */}
            <div className="input-group-enhanced">
              <input
                type="text"
                name="party"
                id="party"
                className={`weight-input-enhanced text-uppercase ${
                  formik.touched.party && formik.errors.party
                    ? "error"
                    : ""
                }`}
                value={formik.values.party}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={"Party Name *".toUpperCase()}
              />
              {formik.touched.party && formik.errors.party && (
                <div className="error-message-enhanced text-uppercase">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.party}
                </div>
              )}
            </div>

            {/* Product */}
            <div className="input-group-enhanced">
              <input
                type="text"
                name="product"
                id="product"
                className={`weight-input-enhanced text-uppercase ${
                  formik.touched.product && formik.errors.product
                    ? "error"
                    : ""
                }`}
                value={formik.values.product}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder={"Product Name *".toUpperCase()}
              />
              {formik.touched.product && formik.errors.product && (
                <div className="error-message-enhanced text-uppercase">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.product}
                </div>
              )}
            </div>

            {/* Live Weight */}
            <div className="input-group-enhanced weight-input-group">
              <div className={`weight-input-container text-uppercase ${
                formik.touched.currentWeight && formik.errors.currentWeight
                  ? "error"
                  : ""
              }`}>
                <input
                  type="number"
                  name="currentWeight"
                  id="currentWeight"
                  className="weight-input-enhanced text-uppercase"
                  value={formik.values.currentWeight}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder={"Live Weight *".toUpperCase()}
                />
                <div className="weight-unit text-uppercase">KG</div>
                <div className="live-badge">
                  <span className="live-dot"></span>
                  <span className="text-uppercase">LIVE</span>
                </div>
              </div>
              {formik.touched.currentWeight && formik.errors.currentWeight && (
                <div className="error-message-enhanced text-uppercase">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {formik.errors.currentWeight}
                </div>
              )}
            </div>

            {/* Driver Checkbox */}
            {/* <div className="input-group-enhanced">
              <div className="checkbox-container mt-0">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="withDriver"
                    id="withDriver"
                    className="form-check-input"
                    checked={formik.values.withDriver}
                    onChange={formik.handleChange}
                  />
                  <label className="form-check-label ms-2" htmlFor="withDriver">
                    Include Driver in Weight
                  </label>
                </div>
              </div>
            </div> */}
          </div>

          {/* Enhanced Submit Button */}
          <div className="submit-section">
            <button 
              type="submit" 
              className="submit-button-enhanced first-weight-submit text-uppercase"
              disabled={formik.isSubmitting}
            >
              <div className="button-content">
                <div className="button-icon">
                  <FaBalanceScale size={18} />
                </div>
                <span className="button-text text-uppercase">
                  {formik.isSubmitting ? 'Saving...' : 'Save First Weight'}
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
};

export default FirstWeightForm;