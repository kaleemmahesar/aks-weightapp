import React from "react";
import LiveWeightDisplay from "./LiveWeightDisplay";

export default function LiveWeightCard({ onWeightChange }) {
  return (
    <div className="card shadow text-center mb-4">
      <div className="card-body">
        <LiveWeightDisplay simulation={true} onWeightChange={onWeightChange} />
      </div>
    </div>
  );
}
