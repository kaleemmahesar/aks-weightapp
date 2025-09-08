import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import SecondWeightForm from "../components/SecondWeightForm";
import PrintModal from "../components/PrintModal";
import StatsCards from "../components/StatsCard";
import notify from "../components/notification";
import { setSelectedRecord } from "../redux/slices/recordsSlice";
import "../styles/Dashboard.css";

export default function SecondWeightPage() {
  const dispatch = useDispatch();
  const { records = [] } = useSelector(state => state.records || {});
  // ✅ State variables for print modal
  const [currentWeight, setCurrentWeight] = useState(0);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("second");

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
  
  const weight = useSelector((state) => state.weight.value);

  // ✅ Dashboard Stats
  const totalVehicles = records.length;
  const pendingSecond = records.filter((r) => r && !r.second_weight).length;

  // ✅ Save Second Weight Success Handler
  const secondWeightSuccess = async (updatedRecord) => {
    // ✅ Set selected record for the print modal
    const formattedRecord = {
      vehicle_id: updatedRecord.id,
      vehicle_number: updatedRecord.vehicle_number,
      party_name: updatedRecord.party_name,
      vehicle_type: updatedRecord.vehicle_type,
      product: updatedRecord.product,
      first_weight: updatedRecord.first_weight,
      second_weight: updatedRecord.second_weight,
      net_weight: updatedRecord.net_weight,
      total_price: updatedRecord.total_price,
      first_weight_time: formatTo12Hour(updatedRecord.first_weight_time),
      second_weight_time: formatTo12Hour(updatedRecord.second_weight_time),
      driver_name: updatedRecord.driver_name,
    };
    dispatch(setSelectedRecord(formattedRecord));

    // ✅ Set slip type and show modal
    setSlipType("second");
    notify.success("Second weight saved successfully!");
    setShowPrintModal(true);
  };

  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">
        {/* Header */}
        {/* <div className="text-center mb-4">
          <h1 className="fw-bold text-primary mb-2">
            <i className="fas fa-balance-scale me-3"></i>
            Second Weight Entry
          </h1>
          <p className="text-muted">Complete vehicle weighing process by recording final weight</p>
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
      <small>Pending Second Weight</small>
      <h5 className="m-0"><b>{pendingSecond}</b></h5>
    </div>
  </div>
</div>


        {/* Second Weight Form */}
        <SecondWeightForm
          onSuccess={secondWeightSuccess}
          liveWeight={weight}
        />

        {/* ✅ Print Modal for Second Weight */}
        <PrintModal
          show={showPrintModal}
          slipType={slipType}
          onClose={() => setShowPrintModal(false)}
        />
      </div>
    </div>
  );
}
