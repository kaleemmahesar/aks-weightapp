import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import notify from "./notification";
import logo from "../assets/logo512.png";
import { 
  FaUser, 
  FaLock, 
  FaSpinner, 
  FaSignInAlt, 
  FaShieldAlt 
} from "react-icons/fa";
import { loginUser } from "../redux/slices/authSlice";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const dispatch = useDispatch();
    const { loading, error } = useSelector(state => state.auth);

    const handleLogin = async () => {
        if (!username || !password) {
            notify.warning("Please enter username and password");
            return;
        }

        const result = await dispatch(loginUser({ username, password }));
        
        if (result.error) {
            notify.error(result.error.message || "Login failed");
        }
    };

    return (
        <div
            className="d-flex align-items-center justify-content-center vh-100"
            style={{ 
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            }}
        >
            <div 
                className="card shadow-lg p-5" 
                style={{ 
                    width: "480px", 
                    borderRadius: "20px",
                    border: "none",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
                }}
            >
                <div className="text-center mb-4">
                    <div 
                        className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                        style={{
                            width: "120px",
                            height: "120px",
                            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                            boxShadow: "0 10px 30px rgba(102, 126, 234, 0.3)"
                        }}
                    >
                        <img src={logo} alt="Company Logo" style={{ width: "80px", borderRadius: "50%" }} />
                    </div>
                    <h3 className="fw-bold" style={{ color: "#2c3e50" }}>Al Hussaini Computerised Kanta</h3>
                    <p className="text-muted">Secure Weighbridge Management System</p>
                </div>
                
                <div className="mb-4">
                    <div className="form-floating mb-3">
                        <input
                            type="text"
                            id="username"
                            className="form-control"
                            style={{ 
                                borderRadius: "12px",
                                border: "2px solid #e3e6f0",
                                fontSize: "16px"
                            }}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                        />
                        <label htmlFor="username">
                            <FaUser className="me-2" />
                            Username
                        </label>
                    </div>
                    
                    <div className="form-floating mb-4">
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            style={{ 
                                borderRadius: "12px",
                                border: "2px solid #e3e6f0",
                                fontSize: "16px"
                            }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                        <label htmlFor="password">
                            <FaLock className="me-2" />
                            Password
                        </label>
                    </div>
                </div>
                
                <button
                    className="w-full btn-primary text-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <FaSpinner className="me-2 spinner" />
                            Logging in...
                        </>
                    ) : (
                        <>
                            <FaSignInAlt className="me-2" />
                            Login
                        </>
                    )}
                </button>
                
                <div className="text-center mt-4">
                    <small className="text-muted">
                        <FaShieldAlt className="me-1" />
                        Secure Authentication
                    </small>
                </div>
                
                <div className="text-center mt-3 text-muted">
                    © {new Date().getFullYear()} Al Hussaini Computerised Kanta
                </div>
            </div>
        </div>
    );
}
