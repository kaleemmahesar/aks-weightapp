import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import Login from "./Login";
import OperatorDashboard from "../pages/OperatorDashboard";
import Settings from "./Settings";
import Navbar from "./Navbar";

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [settings, setSettings] = useState({
        companyName: "Awami Computerized Kanta",
        companyAddress: "Miro Khan Road, Larkana",
        contactNumber: "03420721023",
        tareWeight: 100
    });

    return (
        <Router>
            {loggedIn && <Navbar onLogout={() => setLoggedIn(false)} />}
            <Routes>
                <Route path="/" element={loggedIn ? <Navigate to="/dashboard" /> : <Login onLogin={() => setLoggedIn(true)} />} />
                <Route path="/dashboard" element={loggedIn ? <OperatorDashboard settings={settings} /> : <Navigate to="/" />} />
                <Route path="/settings" element={loggedIn ? <Settings settings={settings} setSettings={setSettings} /> : <Navigate to="/" />} />
            </Routes>
        </Router>
    );
}

export default App;
