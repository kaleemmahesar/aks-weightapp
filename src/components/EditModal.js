import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Formik, Form, Field, ErrorMessage, useFormik } from "formik";
import * as Yup from "yup";
import { updateRecordData } from "../redux/slices/recordsSlice";

export default function EditRecordModal({ show, onClose, record, slipType, onUpdate, vehiclePrices }) {
  const dispatch = useDispatch();
  
  // Get business names from settings
  const { settings = {} } = useSelector(state => state.settings || {});
  const businessNames = settings.businessNames || [];

  // Define vehicle types that require vehicle number
  const vehicleTypesWithVehicleNumber = ['Truck', 'SixWheeler', 'DahWheeler', 'Rocket Double', 'Container', 'Shahzore', 'Datson', 'Mazda'];

  // Always call useFormik
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      business_name: record?.business_name || "",
      party_name: record?.party_name || "",
      vehicle_number: record?.vehicle_number || "",
      vehicle_type: record?.vehicle_type || "Truck",
      product: record?.product || "",
      first_weight: record?.first_weight || "",
      second_weight: record?.second_weight || "",
    },
    validationSchema: Yup.object({
      business_name: Yup.string(),
      vehicle_number: Yup.string().when('vehicle_type', {
        is: (vehicleType) => vehicleTypesWithVehicleNumber.includes(vehicleType),
        then: (schema) => schema.required("Required"),
        otherwise: (schema) => schema
      }),
      vehicle_type: Yup.string().required("Required"),
      party_name: Yup.string().required("Required"),
      product: Yup.string().required("Required"),
      
      first_weight: Yup.number()
        .typeError("Must be a number")
        .test("first-weight-required", "Required", function(value) {
          return slipType === "first" || slipType === "final" ? value !== undefined && value !== "" : true;
        }),

      second_weight: Yup.number()
        .typeError("Must be a number")
        .test("second-weight-required", "Required", function(value) {
          return slipType === "second" || slipType === "final" ? value !== undefined && value !== "" : true;
        }),
    }),

    onSubmit: async (values) => {
      console.log(values)
      // ✅ Calculate derived fields only if both weights are provided
      const net_weight = values.second_weight !== "" && values.first_weight !== "" ?
        parseFloat(values.first_weight || 0) - parseFloat(values.second_weight || 0) : null;
      
      const total_price = vehiclePrices[values.vehicle_type] || 0;

      try {
        // Prepare update data - only include fields that should be updated
        const updateData = {
          id: record.id,
          business_name: values.business_name,
          party_name: values.party_name,
          vehicleNumber: values.vehicle_number,
          vehicleType: values.vehicle_type,
          product: values.product,
          first_weight: values.first_weight !== "" ? parseFloat(values.first_weight) : null,
        };

        // Only update second_weight and related fields if we're editing a second or final weight record
        // For first weight records, we should not modify second_weight related fields to preserve NULL values
        if (slipType === "second" || slipType === "final") {
          updateData.second_weight = values.second_weight !== "" ? parseFloat(values.second_weight) : null;
          updateData.net_weight = net_weight;
          updateData.total_price = total_price;
        }

        // Dispatch the Redux action to update the record
        const resultAction = await dispatch(updateRecordData(updateData));

        console.log(resultAction)

        if (updateRecordData.fulfilled.match(resultAction)) {
          alert("✅ Record updated successfully!");

          // ✅ Close modal
          onClose();
        } else {
          alert("❌ " + (resultAction.error?.message || "Unknown error"));
        }
      } catch (err) {
        console.error("Error updating record:", err);
        alert("Error updating record. Check console.");
      }
    }
  });

  if (!show) return null;

  const netWeight =
    formik.values.first_weight && formik.values.second_weight
      ? (parseFloat(formik.values.first_weight) - parseFloat(formik.values.second_weight)).toFixed(2)
      : "N/A";

  const price = vehiclePrices[formik.values.vehicle_type] || 0;

  const formatWeightValue = (value) => {
    if (value === "" || value === null || value === undefined) return "";
    const num = parseFloat(value);
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  };

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal d-block fade show" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <div>
                <h5 className="modal-title text-uppercase">Edit Record ({slipType?.toUpperCase()})</h5>
              </div>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={formik.handleSubmit}>
                {/* Business Name */}
                <div className="mb-3">
                  <label className="text-uppercase">Business Name</label>
                  <select
                    name="business_name"
                    className="form-select text-uppercase"
                    value={formik.values.business_name}
                    onChange={formik.handleChange}
                  >
                    {businessNames.map((name, index) => (
                      <option key={index} value={name} className="text-uppercase">
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Vehicle Number */}
                <div className="mb-3">
                  <label className="text-uppercase">Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    className={`form-control text-uppercase ${
                      formik.touched.vehicle_number && formik.errors.vehicle_number ? "is-invalid" : ""
                    }`}
                    value={formik.values.vehicle_number}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.vehicle_number && formik.errors.vehicle_number && (
                    <div className="invalid-feedback text-uppercase">{formik.errors.vehicle_number}</div>
                  )}
                </div>

                {/* Party Name */}
                <div className="mb-3">
                  <label className="text-uppercase">Party Name</label>
                  <input
                    type="text"
                    name="party_name"
                    className={`form-control text-uppercase ${
                      formik.touched.party_name && formik.errors.party_name ? "is-invalid" : ""
                    }`}
                    value={formik.values.party_name}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.party_name && formik.errors.party_name && (
                    <div className="invalid-feedback text-uppercase">{formik.errors.party_name}</div>
                  )}
                </div>

                {/* Vehicle Type */}
                <div className="mb-3">
                  <label className="text-uppercase">Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    className={`form-select text-uppercase ${
                      formik.touched.vehicle_type && formik.errors.vehicle_type ? "is-invalid" : ""
                    }`}
                    value={formik.values.vehicle_type}
                    onChange={formik.handleChange}
                  >
                    {Object.keys(vehiclePrices).map((type) => (
                      <option key={type} value={type} className="text-uppercase">
                        {type.toUpperCase()} - {vehiclePrices[type]}
                      </option>
                    ))}
                  </select>
                  {formik.touched.vehicle_type && formik.errors.vehicle_type && (
                    <div className="invalid-feedback text-uppercase">{formik.errors.vehicle_type}</div>
                  )}
                </div>

                {/* Product */}
                <div className="mb-3">
                  <label className="text-uppercase">Product</label>
                  <input
                    type="text"
                    name="product"
                    className={`form-control text-uppercase ${
                      formik.touched.product && formik.errors.product ? "is-invalid" : ""
                    }`}
                    value={formik.values.product}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.product && formik.errors.product && (
                    <div className="invalid-feedback text-uppercase">{formik.errors.product}</div>
                  )}
                </div>

                {/* Conditional weights */}
                {(slipType === "first" || slipType === "final") && (
                  <div className="mb-3">
                    <label className="text-uppercase">{slipType === "final" ? "Current Weight:" : "First Weight:"}</label>
                    <input
                      type="number"
                      name="first_weight"
                      className={`form-control text-uppercase ${formik.touched.first_weight && formik.errors.first_weight ? "is-invalid" : ""}`}
                      value={formatWeightValue(formik.values.first_weight)}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.first_weight && formik.errors.first_weight && (
                      <div className="invalid-feedback text-uppercase">{formik.errors.first_weight}</div>
                    )}
                  </div>
                )}

                {/* Show first weight for second and final weight records as editable */}
                {(slipType === "second" || slipType === "final") && (
                  <div className="mb-3">
                    <label className="text-uppercase">First Weight:</label>
                    <input
                      type="number"
                      name="first_weight"
                      className={`form-control text-uppercase ${formik.touched.first_weight && formik.errors.first_weight ? "is-invalid" : ""}`}
                      value={formatWeightValue(formik.values.first_weight)}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.first_weight && formik.errors.first_weight && (
                      <div className="invalid-feedback text-uppercase">{formik.errors.first_weight}</div>
                    )}
                  </div>
                )}

                {(slipType === "second" || slipType === "final") && (
                    <div className="mb-3">
                      <label className="text-uppercase">Second Weight:</label>
                      <input
                        type="number"
                        name="second_weight"
                        className={`form-control text-uppercase ${formik.touched.second_weight && formik.errors.second_weight ? "is-invalid" : ""}`}
                        value={formatWeightValue(formik.values.second_weight)}
                        onChange={formik.handleChange}
                      />
                      {formik.touched.second_weight && formik.errors.second_weight && (
                        <div className="invalid-feedback text-uppercase">{formik.errors.second_weight}</div>
                      )}
                    </div>
                  )}

                  {/* Net Weight Display (only for second/final weight) */}
                  {(slipType === "second" || slipType === "final") && (
                    <div className="mb-3">
                      <label className="text-uppercase">Net Weight: {netWeight} KG</label>
                    </div>
                  )}

                  {/* Price Display */}
                  <div className="mb-3">
                    <label className="text-uppercase">Price: PKR {price}</label>
                  </div>

                  <div className="d-flex justify-content-end gap-2">
                    <button type="button" className="btn btn-secondary text-uppercase" onClick={onClose}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary text-uppercase" disabled={formik.isSubmitting}>
                      {formik.isSubmitting ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </>
    );

}
