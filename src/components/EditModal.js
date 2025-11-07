import React from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useDispatch, useSelector } from "react-redux";
import { updateRecordData as updateRecord } from "../redux/slices/recordsSlice";
import { getVehiclePrices } from "../config/vehicleConfig";

export default function EditRecordModal({ show, onClose, record, slipType }) {
  const dispatch = useDispatch();
  const { settings = {} } = useSelector(state => state.settings || {});
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);
  
  // Define vehicle types that require vehicle number
  const vehicleTypesWithVehicleNumber = ['Truck', 'SixWheeler', 'DahWheeler', 'Rocket Double', 'Container', 'Shahzore', 'Datson', 'Mazda'];

  // Always call useFormik
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      party_name: record?.party_name || "",
      vehicle_number: record?.vehicle_number || "",
      vehicle_type: record?.vehicle_type || "Truck",
      product: record?.product || "",
      first_weight: record?.first_weight || "",
      second_weight: record?.second_weight || "",
    },
    validationSchema: Yup.object({
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
          party_name: values.party_name,
          vehicleNumber: values.vehicle_number,  // Changed from vehicle_number to vehicleNumber
          vehicleType: values.vehicle_type,      // Changed from vehicle_type to vehicleType
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
        const resultAction = await dispatch(updateRecord(updateData));

        console.log(resultAction)

        if (updateRecord.fulfilled.match(resultAction)) {
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

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      <div className="modal d-block fade show" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header bg-info text-white">
              <h5 className="modal-title">Edit Record ({slipType?.toUpperCase()})</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <form onSubmit={formik.handleSubmit}>
                {/* Vehicle Number */}
                <div className="mb-3">
                  <label>Vehicle Number</label>
                  <input
                    type="text"
                    name="vehicle_number"
                    className={`form-control ${
                      formik.touched.vehicle_number && formik.errors.vehicle_number ? "is-invalid" : ""
                    }`}
                    value={formik.values.vehicle_number}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.vehicle_number && formik.errors.vehicle_number && (
                    <div className="invalid-feedback">{formik.errors.vehicle_number}</div>
                  )}
                </div>

                {/* Party Name */}
                <div className="mb-3">
                  <label>Party Name</label>
                  <input
                    type="text"
                    name="party_name"
                    className={`form-control ${
                      formik.touched.party_name && formik.errors.party_name ? "is-invalid" : ""
                    }`}
                    value={formik.values.party_name}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.party_name && formik.errors.party_name && (
                    <div className="invalid-feedback">{formik.errors.party_name}</div>
                  )}
                </div>

                {/* Vehicle Type */}
                <div className="mb-3">
                  <label>Vehicle Type</label>
                  <select
                    name="vehicle_type"
                    className={`form-select ${
                      formik.touched.vehicle_type && formik.errors.vehicle_type ? "is-invalid" : ""
                    }`}
                    value={formik.values.vehicle_type}
                    onChange={formik.handleChange}
                  >
                    {Object.keys(vehiclePrices).map((type) => (
                      <option key={type} value={type}>
                        {type} - {vehiclePrices[type]}
                      </option>
                    ))}
                  </select>
                  {formik.touched.vehicle_type && formik.errors.vehicle_type && (
                    <div className="invalid-feedback">{formik.errors.vehicle_type}</div>
                  )}
                </div>

                {/* Product */}
                <div className="mb-3">
                  <label>Product</label>
                  <input
                    type="text"
                    name="product"
                    className={`form-control ${
                      formik.touched.product && formik.errors.product ? "is-invalid" : ""
                    }`}
                    value={formik.values.product}
                    onChange={formik.handleChange}
                  />
                  {formik.touched.product && formik.errors.product && (
                    <div className="invalid-feedback">{formik.errors.product}</div>
                  )}
                </div>

                {/* Conditional weights */}
                {(slipType === "first" || slipType === "final") && (
                  <div className="mb-3">
                    <label>{slipType === "final" ? "Current Weight:" : "First Weight:"}</label>
                    <input
                      type="number"
                      name="first_weight"
                      className={`form-control ${formik.touched.first_weight && formik.errors.first_weight ? "is-invalid" : ""}`}
                      value={formik.values.first_weight}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.first_weight && formik.errors.first_weight && (
                      <div className="invalid-feedback">{formik.errors.first_weight}</div>
                    )}
                  </div>
                )}

                {(slipType === "second" || slipType === "final") && (
                  <div className="mb-3">
                    <label>{slipType === "final" ? "Empty Weight:" : "Second Weight:"}</label>
                    <input
                      type="number"
                      name="second_weight"
                      className={`form-control ${formik.touched.second_weight && formik.errors.second_weight ? "is-invalid" : ""}`}
                      value={formik.values.second_weight}
                      onChange={formik.handleChange}
                    />
                    {formik.touched.second_weight && formik.errors.second_weight && (
                      <div className="invalid-feedback">{formik.errors.second_weight}</div>
                    )}
                  </div>
                )}

                {/* Driver Name */}
                {/* Net Weight and Price */}
                <div className="d-flex justify-content-between mb-3">
                  <p>
                    <strong>Net Weight:</strong> {netWeight}
                  </p>
                  <p>
                    <strong>Price:</strong> {price}
                  </p>
                </div>

                {/* Buttons */}
                <div className="d-flex justify-content-end">
                  <button type="button" className="btn btn-secondary me-2" onClick={onClose}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Changes
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