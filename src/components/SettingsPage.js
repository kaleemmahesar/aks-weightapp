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
  
  // State for business names
  const [newBusinessName, setNewBusinessName] = useState("");
  const [businessNames, setBusinessNames] = useState(settings.businessNames || []);
  const [editingBusinessName, setEditingBusinessName] = useState("");
  const [editingBusinessNameValue, setEditingBusinessNameValue] = useState("");
  
  // Load settings on component mount
  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);
  
  // Update business names when settings change
  useEffect(() => {
    setBusinessNames(settings.businessNames || []);
  }, [settings]);
  
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
  
  // Handle adding a new business name
  const handleAddBusinessName = (e) => {
    e.preventDefault();
    
    if (!newBusinessName.trim()) {
      alert("Please enter a business name");
      return;
    }
    
    // Check if business name already exists
    if (businessNames.includes(newBusinessName.trim())) {
      alert("Business name already exists");
      return;
    }
    
    // Create updated business names array
    const updatedBusinessNames = [...businessNames, newBusinessName.trim()];
    
    // Dispatch update to Redux store and backend
    dispatch(updateSettingsData({
      ...settings,
      businessNames: updatedBusinessNames
    }));
    
    // Reset form
    setNewBusinessName("");
  };
  
  // Handle updating a business name
  const handleUpdateBusinessName = (e) => {
    e.preventDefault();
    
    if (!editingBusinessName || !editingBusinessNameValue.trim()) {
      alert("Please enter a business name");
      return;
    }
    
    // Create updated business names array
    const updatedBusinessNames = businessNames.map(name => 
      name === editingBusinessName ? editingBusinessNameValue.trim() : name
    );
    
    // Dispatch update to Redux store and backend
    dispatch(updateSettingsData({
      ...settings,
      businessNames: updatedBusinessNames
    }));
    
    // Reset form
    setEditingBusinessName("");
    setEditingBusinessNameValue("");
  };
  
  // Handle deleting a business name
  const handleDeleteBusinessName = (businessName) => {
    if (window.confirm(`Are you sure you want to delete ${businessName}?`)) {
      // Create updated business names array
      const updatedBusinessNames = businessNames.filter(name => name !== businessName);
      
      // Dispatch update to Redux store and backend
      dispatch(updateSettingsData({
        ...settings,
        businessNames: updatedBusinessNames
      }));
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0 text-uppercase">Business Names Settings</h4>
              <p className="mb-0 text-uppercase">Manage business names for party selection</p>
            </div>
            <div className="card-body">
              {/* Add New Business Name Form */}
              <div className="row mb-4">
                <div className="col-md-12">
                  <h5 className="text-uppercase">Add New Business Name</h5>
                  <form onSubmit={handleAddBusinessName} className="row g-3">
                    <div className="col-md-10">
                      <label className="form-label text-uppercase">Business Name</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={newBusinessName}
                        onChange={(e) => setNewBusinessName(e.target.value)}
                        placeholder={"Enter business name".toUpperCase()}
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="btn btn-primary w-100 text-uppercase">
                        Add Business Name
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Edit Business Name Form (shown when editing) */}
              {editingBusinessName && (
                <>
                  <hr />
                  <div className="row">
                    <div className="col-md-12">
                      <h5 className="text-uppercase">Edit Business Name</h5>
                      <form onSubmit={handleUpdateBusinessName} className="row g-3">
                        <div className="col-md-10">
                          <label className="form-label text-uppercase">Business Name</label>
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={editingBusinessNameValue}
                            onChange={(e) => setEditingBusinessNameValue(e.target.value)}
                            placeholder={"Enter business name".toUpperCase()}
                          />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                          <button type="submit" className="btn btn-success w-100 me-2 text-uppercase">
                            Update
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary w-100 text-uppercase"
                            onClick={() => {
                              setEditingBusinessName("");
                              setEditingBusinessNameValue("");
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
              
              {/* Existing Business Names List */}
              <div className="row">
                <div className="col-md-12">
                  <h5 className="text-uppercase">Existing Business Names</h5>
                  {businessNames.length === 0 ? (
                    <p className="text-muted text-uppercase">No business names added yet.</p>
                  ) : (
                    <div className="row">
                      {businessNames.map((name, index) => (
                        <div className="col-md-4 mb-3" key={index}>
                          <div className="card">
                            <div className="card-body d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 text-uppercase">{name.toUpperCase()}</h6>
                              </div>
                              <div>
                                <button
                                  className="btn btn-sm btn-warning me-2 text-uppercase"
                                  onClick={() => {
                                    setEditingBusinessName(name);
                                    setEditingBusinessNameValue(name);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger text-uppercase"
                                  onClick={() => handleDeleteBusinessName(name)}
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
              
              <hr className="my-5" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0 text-uppercase">Vehicle Type Settings</h4>
              <p className="mb-0 text-uppercase">Manage vehicle types and their prices</p>
            </div>
            <div className="card-body">
              {/* Add New Vehicle Type Form */}
              <div className="row mb-4">
                <div className="col-md-12">
                  <h5 className="text-uppercase">Add New Vehicle Type</h5>
                  <form onSubmit={handleAddVehicleType} className="row g-3">
                    <div className="col-md-5">
                      <label className="form-label text-uppercase">Vehicle Type Name</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={newVehicleType}
                        onChange={(e) => setNewVehicleType(e.target.value)}
                        placeholder={"Enter vehicle type name".toUpperCase()}
                      />
                    </div>
                    <div className="col-md-5">
                      <label className="form-label text-uppercase">Price (PKR)</label>
                      <input
                        type="number"
                        className="form-control text-uppercase"
                        value={newVehiclePrice}
                        onChange={(e) => setNewVehiclePrice(e.target.value)}
                        placeholder={"Enter price".toUpperCase()}
                        min="0"
                      />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="btn btn-primary w-100 text-uppercase">
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
                      <h5 className="text-uppercase">Edit Vehicle Type</h5>
                      <form onSubmit={handleUpdateVehicleType} className="row g-3">
                        <div className="col-md-5">
                          <label className="form-label text-uppercase">Vehicle Type Name</label>
                          <input
                            type="text"
                            className="form-control text-uppercase"
                            value={editingVehicleType}
                            readOnly
                          />
                        </div>
                        <div className="col-md-5">
                          <label className="form-label text-uppercase">Price (PKR)</label>
                          <input
                            type="number"
                            className="form-control text-uppercase"
                            value={editingVehiclePrice}
                            onChange={(e) => setEditingVehiclePrice(e.target.value)}
                            placeholder={"Enter price".toUpperCase()}
                            min="0"
                          />
                        </div>
                        <div className="col-md-2 d-flex align-items-end">
                          <button type="submit" className="btn btn-success w-100 me-2 text-uppercase">
                            Update
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary w-100 text-uppercase"
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
                  <h5 className="text-uppercase">Existing Vehicle Types</h5>
                  {Object.keys(vehiclePrices).length === 0 ? (
                    <p className="text-muted text-uppercase">No custom vehicle types added yet.</p>
                  ) : (
                    <div className="row">
                      {Object.entries(vehiclePrices).map(([type, price]) => (
                        <div className="col-md-4 mb-3" key={type}>
                          <div className="card">
                            <div className="card-body d-flex justify-content-between align-items-center">
                              <div>
                                <h6 className="mb-0 text-uppercase">{type.toUpperCase()}</h6>
                                <p className="mb-0 text-muted text-uppercase">{price.toLocaleString()} PKR</p>
                              </div>
                              <div>
                                <button
                                  className="btn btn-sm btn-warning me-2 text-uppercase"
                                  onClick={() => {
                                    setEditingVehicleType(type);
                                    setEditingVehiclePrice(price.toString());
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger text-uppercase"
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