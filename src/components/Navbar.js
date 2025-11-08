import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux"; // Add useSelector import
import {
  FaTachometerAlt,
  FaBalanceScale,
  FaCheckCircle,
  FaTable,
  FaSignOutAlt,
  FaWeight,
  FaMoneyBillWave,
  FaCog,
  FaUser // Add user icon
} from "react-icons/fa";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();
  const { role } = useSelector(state => state.auth || {}); // Get user role from auth state

  const handleLogout = () => {
    onLogout();
    navigate("/");
  };

  // Capitalize the first letter of the role
  const capitalizeRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <nav
      className="navbar navbar-expand-lg sticky-top shadow-sm"
      style={{
        background: "linear-gradient(135deg, #374151, #1f2937)", // softer dark
        padding: "10px 20px",
        zIndex: "1030"
      }}
    >
      <div className="container-fluid">
        {/* Brand */}
        <NavLink
          className="navbar-brand fw-bold text-white"
          to="/dashboard"
          style={{
            fontSize: "1.25rem",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <FaWeight className="me-2 text-blue-400" /> Al Hussaini Kanta
        </NavLink>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler text-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          style={{ border: "none" }}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu Items */}
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {[
              { path: "/dashboard", label: "First Weight", icon: <FaTachometerAlt /> },
              { path: "/second-weight", label: "Second Weight", icon: <FaBalanceScale /> },
              { path: "/final-weight", label: "Final Weight", icon: <FaCheckCircle /> },
              { path: "/expenses", label: "Expenses", icon: <FaMoneyBillWave /> },
              { path: "/records", label: "Records", icon: <FaTable /> },
              { path: "/settings", label: "Settings", icon: <FaCog /> } // Added Settings link
            ].map((item) => (
              <li className="nav-item" key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link fw-semibold px-3 py-2 d-flex align-items-center ${
                      isActive ? "active-link" : ""
                    }`
                  }
                  style={{
                    borderRadius: "8px",
                    margin: "0 3px",
                    color: "#e5e7eb",
                    fontSize: "1rem",
                    gap: "5px",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.3s ease"
                  }}
                >
                  {item.icon} {item.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* User Info and Logout Section */}
          <div className="d-flex align-items-center">
            {/* User Info */}
            <div className="d-flex align-items-center me-3 text-white">
              <FaUser className="me-2" />
              <span className="fw-semibold">{capitalizeRole(role)}</span>
            </div>
            
            {/* Logout Button */}
            <button 
              className="btn btn-outline-light fw-bold d-flex align-items-center" 
              onClick={handleLogout}
              style={{
                borderRadius: "20px",
                padding: "8px 15px",
                border: "1px solid rgba(255,255,255,0.3)"
              }}
            >
              <FaSignOutAlt className="me-2" /> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;