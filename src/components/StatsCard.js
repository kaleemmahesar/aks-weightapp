import React from "react";
import LiveWeightDisplay from "./LiveWeightDisplay";

export default function StatsCards({ totalVehiclesToday, pendingSecond, onWeightChange, todaysTotal }) {
  return (
    <div className="row mb-3 stats-cards text-center">
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-info-subtle text-black shadow-sm border-0 rounded">
      <LiveWeightDisplay simulation={false} onWeightChange={onWeightChange} />
    </div>
  </div>
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-danger-subtle text-black shadow-sm border-0 rounded">
      <small>Total Vehicles Today</small>
      <h5 className="m-0"><b>{totalVehiclesToday}</b></h5>
    </div>
  </div>
  <div className="col-md-4">
    <div className="card px-2 py-2 bg-success-subtle text-black shadow-sm border-0 rounded">
      <small>Today's Total</small>
      <h5 className="m-0"><b>{todaysTotal}</b></h5>
    </div>
  </div>
</div>

  );
}
