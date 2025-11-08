import React from "react";
import { useSelector } from "react-redux";

export default function LiveWeightDisplay() {
  const weight = useSelector((state) => state.weight.value);

  return (
    <>
      <small>Live Weight</small>
      <h2 className="m-0"><b>{weight} KG</b></h2>
    </>
  );
}
