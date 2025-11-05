import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSettingsData, fetchSettings, deleteVehicleType } from "../redux/slices/settingsSlice";
import { getVehiclePrices } from "../config/vehicleConfig";

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { settings = {} } = useSelector(state => state.settings || {});
  const vehiclePrices = getVehiclePrices(settings.vehiclePrices);
  
  // State for new vehicle type form
  const [newVehicleType, setNewVehicleType] = useState("");
  const [newVehiclePrice, setNewVehiclePrice] = useState("");
  
  // State for editing existing vehicle types
  const [editingVehicleType, setEditingVehicleType] = useState("");
  const [editingVehiclePrice, setEditingVehiclePrice] = useState("");
  
  // Load settings on component mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  
  // Handle adding a new vehicle type
  const handleAddVehicleType = (e) => {
    e.preventDefault();
    
    if (!newVehicleType || !newVehiclePrice) {
      alert("Please enter both vehicle type and price");
      return;
    }
    
    // Check if vehicle type already exists
    if (vehiclePrices[newVehicleType]) {
      alert("Vehicle type already exists");
      return;
    }
    
    // Create updated vehicle prices object
    const updatedVehiclePrices = {
      ...settings.vehiclePrices,
      [newVehicleType]: parseFloat(newVehiclePrice)
    };
    
    // Dispatch update to Redux store and backend
    dispatch(updateSettingsData({
      ...settings,
      vehiclePrices: updatedVehiclePrices
    }));
    
    // Reset form
    setNewVehicleType("");
    setNewVehiclePrice("");
  };
  
  // Handle updating an existing vehicle type
  const handleUpdateVehicleType = (e) => {
    e.preventDefault();
    
    if (!editingVehicleType || !editingVehiclePrice) {
      alert("Please enter both vehicle type and price");
      return;
    }
    
    // Create updated vehicle prices object
    const updatedVehiclePrices = {
      ...settings.vehiclePrices,
      [editingVehicleType]: parseFloat(editingVehiclePrice)
    };
    
    // Dispatch update to Redux store and backend
    dispatch(updateSettingsData({
      ...settings,
      vehiclePrices: updatedVehiclePrices
    }));
    
    // Reset form
    setEditingVehicleType("");
    setEditingVehiclePrice("");
  };
  
  // Handle deleting a vehicle type
  const handleDeleteVehicleType = (vehicleType) => {
    if (window.confirm(`Are you sure you want to delete ${vehicleType}?`)) {
      // Dispatch delete to Redux store and backend
      dispatch(deleteVehicleType(vehicleType));
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Vehicle Type Settings</h4>
              <p className="mb-0">Manage vehicle types and their prices</p>
            </div>
            <div className="card-body">
              {/* Add New Vehicle Type Form */}
              <div className="row mb-4">
                <div className="col-md-12">
                  <h5>Add New Vehicle Type</h5>
                  <form onSubmit={handleAddVehicleType} className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label">Vehicle Type Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        placeholder="Enter vehicle type name"
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label">Price (PKR)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={newVehiclePrice}
                        onChange={(e) => setNewVehiclePrice(e.target.value)}
                        placeholder="Enter price"
                        min="0"
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="btn btn-primary w-100">
                        Add Vehicle Type
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Edit Vehicle Type Form (shown when editing) */}
              {editingVehicleType && (
                <>
                  <hr />
                  <div className="row">
                    <div className="col-md-12">
                      <h5>Edit Vehicle Type</h5>
                      <form onSubmit={handleUpdateVehicleType} className="row g-3">
                        <div className="col-md-5">
                          <label className="form-label">Vehicle Type Name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={editingVehicleType}
                            readOnly
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label">Price (PKR)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingVehiclePrice}
                            onChange={(e) => setEditingVehiclePrice(e.target.value)}
                            placeholder="Enter price"
                            min="0"
                          />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                          <button type="submit" className="btn btn-success w-100 me-2">
                            Update
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary w-100"
                            onClick={() => {
                              setEditingVehicleType("");
                              setEditingVehiclePrice("");
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </>
              )}
              
              {/* Existing Vehicle Types List */}
              <div className="row">
                <div className="col-md-12">
                  <h5>Existing Vehicle Types</h5>
                  {Object.keys(vehiclePrices).length === 0 ? (
                    <p className="text-muted">No custom vehicle types added yet.</p>
                  ) : (
                    <div className="row">
                      {Object.entries(vehiclePrices).map(([type, price]) => (
                        <div className="col-md-4 mb-3" key={type}>
                          <div className="card">
                            <div className="card-body d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0">{type}</h6>
                                <p className="mb-0 text-muted">{price.toLocaleString()} PKR</p>
                              </div>
                              <div>
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => {
                                    setEditingVehicleType(type);
                                    setEditingVehiclePrice(price.toString());
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteVehicleType(type)}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;