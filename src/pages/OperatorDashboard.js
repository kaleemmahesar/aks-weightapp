import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import LiveWeightCard from "../components/LiveWeightCard";
import StatsCards from "../components/StatsCard";
import FirstWeightForm from "../components/FirstWeightForm";
import RecordsTable from "../components/RecordsTable";
import PrintModal from "../components/PrintModal";
import notify from "../components/notification";
import "../styles/Dashboard.css";
import { fetchRecords, calculateTodayTotal, setSelectedRecord, calculateTodaysVehicles } from "../redux/slices/recordsSlice";
import { getVehiclePrices } from "../config/vehicleConfig";


export default function OperatorDashboard() {
  const dispatch = useDispatch();
  const { records = [], selectedRecord, todayTotal = 0, totalVehiclesToday = 0 } = useSelector(state => state.records || {});
  const { settings = {} } = useSelector(state => state.settings || {});
  
  // ✅ State variables
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [slipType, setSlipType] = useState("first");

  // Vehicle prices from settings with standardized fallback
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);

  const weight = useSelector((state) => state.weight.value);
  
  

  // ✅ Dashboard Stats
  const totalVehicles = records.length;
  const todaysVehicles = records.length;
  const pendingSecond = records.filter((r) => r && !r.second_weight).length;

  // ✅ Fetch Records from Backend
  useEffect(() => {
    dispatch(fetchRecords());
  }, [dispatch]);

  // Calculate today's total when records change
  useEffect(() => {
    if (records.length > 0) {
      dispatch(calculateTodayTotal());
      dispatch(calculateTodaysVehicles());
    }
  }, [records.length, dispatch]);


  // ✅ Update records state and open print modal after first weight save
  const firstWeightSuccess = async (savedRecord) => {
    console.log('FirstWeightSuccess received savedRecord:', savedRecord);
    
    // Records are already updated in Redux store via the saveFirstWeightRecord action

    // ✅ Open Print Modal after save
    const recordForPrint = {
      vehicle_id: savedRecord.id || '',
      vehicle_number: savedRecord.vehicle_number || '',
      party_name: savedRecord.party_name || '',
      vehicle_type: savedRecord.vehicle_type || '',
      product: savedRecord.product || '',
      first_weight: savedRecord.first_weight || 0,
      total_price: savedRecord.total_price || 0,
      first_weight_time: savedRecord.first_weight_time,
      driver_name: savedRecord.driver_name || 'No',
    };
    
    console.log('Record being sent to print modal:', recordForPrint);
    
    dispatch(setSelectedRecord(recordForPrint));
    setSlipType("first"); // store whether it's first or second weight
    notify.success("First weight saved successfully!");
    setShowPrintModal(true);
  };



  


  return (
    <div className="dashboard-container">
      <div className="container-fluid py-4">
        {/* Header */}
        {/* <div className="text-center mb-4">
          <h1 className="fw-bold text-primary mb-2">
            <i className="fas fa-tachometer-alt me-3"></i>
            Operator Dashboard
          </h1>
          <p className="text-muted">Monitor operations and record initial vehicle weights</p>
        </div> */}

        {/* Stats Cards */}
        <StatsCards
          totalVehiclesToday={totalVehiclesToday}
          pendingSecond={pendingSecond}
          todaysTotal={todayTotal}
        />

        {/* First Weight Form */}
        <FirstWeightForm
          onSuccess={firstWeightSuccess}
          liveWeight={weight}
          vehiclePrices={vehiclePrices}
        />


        {/* Records Table */}
        {/* <RecordsTable records={records} openPrintModal={openPrintModal} vehiclePrices={vehiclePrices} slipType={slipType} onUpdateRecord={handleUpdateRecord}  /> */}

        {/* ✅ React-controlled Print Modal */}
        <PrintModal
          show={showPrintModal}
          slipType={slipType}
          onClose={() => setShowPrintModal(false)}
        />
      </div>
    </div>
  );
}