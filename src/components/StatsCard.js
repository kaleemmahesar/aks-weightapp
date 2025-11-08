import React from "react";
import LiveWeightDisplay from "./LiveWeightDisplay";
import { useSelector } from "react-redux";

export default function StatsCards({ totalVehiclesToday, pendingSecond, onWeightChange, todaysTotal }) {
  // Get records from Redux store
  const { records = [] } = useSelector(state => state.records || {});
  
  // Always show next serial number as total records + 1
  const nextSerialNumber = records.length + 1;

  return (
    <div className="row mb-3 stats-cards text-center">
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-info-subtle text-black shadow-sm border-0 rounded">
      <LiveWeightDisplay simulation={false} onWeightChange={onWeightChange} />
    </div>
  </div>
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-danger-subtle text-black shadow-sm border-0 rounded">
      <small>Next Serial Number</small>
      <h2 className="m-0"><b>{nextSerialNumber}</b></h2>
    </div>
  </div>
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-success-subtle text-black shadow-sm border-0 rounded">
      <small>Today's Total</small>
      <h2 className="m-0"><b>{todaysTotal}</b></h2>
    </div>
  </div>
</div>

  );
}