import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaBalanceScale,
  FaCheckCircle,
  FaTable,
  FaSignOutAlt,
  FaWeight
} from "react-icons/fa";

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate("/");
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
            fontSize: "1.6rem",
            letterSpacing: "0.5px",
            display: "flex",
            alignItems: "center"
          }}
        >
          <FaWeight className="me-2 text-blue-400" /> Awami Kanta
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
              { path: "/records", label: "Records", icon: <FaTable /> }
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
                    margin: "0 6px",
                    color: "#e5e7eb",
                    fontSize: "1rem",
                    gap: "8px",
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

          {/* Logout Button */}
          <button className="btn fw-bold logout-btn" onClick={handleLogout}>
            <FaSignOutAlt className="me-2" /> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
