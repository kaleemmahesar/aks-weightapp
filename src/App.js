import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Login from "./components/Login";
import OperatorDashboard from "./pages/OperatorDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import SecondWeightPage from "./pages/SecondWeightPage";
import FinalWeightPage from "./pages/FinalWeightPage";
import SettingsPage from "./components/SettingsPage"; // Updated import
import Navbar from "./components/Navbar";
import RecordsPage from "./components/RecordsPage";
import ExpensePage from "./components/ExpensePage";
import { ToastContainer } from "react-toastify";
import { restoreUserSession, logout } from "./redux/slices/authSlice";
import { fetchRecords } from "./redux/slices/recordsSlice";
import { fetchSettings } from "./redux/slices/settingsSlice";
import "./App.css";
import WeightProvider from "./components/WeightProvider";

function App() {
  const dispatch = useDispatch();
  const { loggedIn, role } = useSelector((state) => state.auth);

  const [loadingSession, setLoadingSession] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);

  // ✅ Restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        dispatch(restoreUserSession(userData));
      } catch (error) {
        console.error("Error restoring user session:", error);
      }
    }
    setLoadingSession(false);
  }, [dispatch]);

  // ✅ Fetch data once after login & role check
  useEffect(() => {
    if (!loggedIn || dataFetched) return;
    if (role !== "operator" && role !== "owner") return;

    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchRecords()),
          dispatch(fetchSettings())
        ]);
        setDataFetched(true);
      } catch (error) {
        console.error('Failed to fetch initial data:', error);
      }
    };
    
    fetchData();
  }, [loggedIn, role, dataFetched, dispatch]);

  const handleLogout = () => {
    dispatch(logout());
    setDataFetched(false); // Reset so when user logs in again, data will fetch
  };

  // ✅ Show loading until session check completes
  if (loadingSession) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <>
      <ToastContainer />
      <WeightProvider simulation={false} />
      <Router>
        {loggedIn && <Navbar onLogout={handleLogout} />}
        <Routes>
          {/* ✅ Public route */}
          <Route
            path="/"
            element={
              loggedIn ? (
                role === "operator" ? <Navigate to="/dashboard" replace /> : <Navigate to="/owner" replace />
              ) : (
                <Login />
              )
            }
          />

          {/* ✅ Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute loggedIn={loggedIn} role={role} allowedRole="operator">
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/owner"
            element={
              <ProtectedRoute loggedIn={loggedIn} role={role} allowedRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/second-weight"
            element={
              <ProtectedRoute loggedIn={loggedIn} role={role} allowedRole="operator">
                <SecondWeightPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/final-weight"
            element={
              <ProtectedRoute loggedIn={loggedIn} role={role} allowedRole="operator">
                <FinalWeightPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/records"
            element={
              <ProtectedRoute loggedIn={loggedIn}>
                <RecordsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute loggedIn={loggedIn}>
                <ExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute loggedIn={loggedIn}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  );
}

// ✅ ProtectedRoute Component
function ProtectedRoute({ loggedIn, role, allowedRole, children }) {
  if (!loggedIn) {
    return <Navigate to="/" replace />;
  }
  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default App;