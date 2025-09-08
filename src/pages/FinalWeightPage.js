import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import FinalWeightForm from "../components/FinalWeightForm";
import PrintModal from "../components/PrintModal";
import notify from "../components/notification";
import { setSelectedRecord } from "../redux/slices/recordsSlice";
import { getVehiclePrices } from "../config/vehicleConfig";
import "../styles/Dashboard.css";

export default function FinalWeightPage() {
  const dispatch = useDispatch();
  const { records = [] } = useSelector(state => state.records || {});
  const { settings = {} } = useSelector(state => state.settings || {});
  
  // ✅ State variables for print modal
  const [currentWeight, setCurrentWeight] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("final");
  const weight = useSelector((state) => state.weight.value);

  // Vehicle prices from settings with standardized fallback
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);

  const totalThird = (records || []).filter(r => r && r.final_weight === "Yes").length;

  // Helper function to format date to 12-hour format
  const formatTo12Hour = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  // ✅ Live Weight Callback
  const handleWeightUpdate = (weight) => {
    console.log("Live weight updated:", weight);
    setCurrentWeight(weight);
  };

  // ✅ Dashboard Stats
  const totalVehicles = records.length;
  const completedTransactions = records.filter((r) => r && r.second_weight).length;

  // ✅ Save Final Weight Success Handler
  const finalWeightSuccess = async (data) => {
    console.log(data)
    // ✅ Use `data` (not API response) for modal
    const formattedRecord = {
      vehicle_id : data.id,
      vehicle_number: data.vehicle_number,
      party_name: data.party_name,
      vehicle_type: data.vehicle_type,
      product: data.product,
      first_weight: data.first_weight,
      second_weight: data.second_weight,
      net_weight: data.net_weight,
      total_price: data.total_price,
      first_weight_time: formatTo12Hour(data.first_weight_time),
      second_weight_time: formatTo12Hour(data.second_weight_time),
      driver_name: data.driver_name,
    };
    dispatch(setSelectedRecord(formattedRecord));

    setSlipType("final");
    notify.success("Final weight saved successfully!");
    setShowPrintModal(true);
  };

  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">
        {/* Header */}
        {/* <div className="text-center mb-4">
          <h1 className="fw-bold text-success mb-2">
            <i className="fas fa-check-circle me-3"></i>
            Final Weight Entry
          </h1>
          <p className="text-muted">Complete transaction with full weight calculation in one step</p>
        </div> */}

        {/* Stats Cards - Show current status */}
        <div className="row mb-3 text-center">
          <div className="col-md-4">
            <div className="card px-2 py-2 bg-info-subtle text-black shadow-sm border-0 rounded">
              <small>Live Weight</small>
              <h5 className="m-0"><b>{weight} KG</b></h5>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card px-2 py-2 bg-danger-subtle text-black shadow-sm border-0 rounded">
              <small>Total Vehicles</small>
              <h5 className="m-0"><b>{totalVehicles}</b></h5>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card px-2 py-2 bg-success-subtle text-black shadow-sm border-0 rounded">
              <small>Final Vehicles</small>
              <h5 className="m-0"><b>{totalThird}</b></h5>
            </div>
          </div>
        </div>

        {/* Final Weight Form */}
        <FinalWeightForm
          liveWeight={weight}
          onSuccess={finalWeightSuccess}
          vehiclePrices={vehiclePrices}
        />

        {/* ✅ Print Modal for Final Weight */}
        <PrintModal
          show={showPrintModal}
          slipType={slipType}
          onClose={() => setShowPrintModal(false)}
        />
      </div>
    </div>
  );
}
