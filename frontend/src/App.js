import React, { useState, useEffect } from "react";
import { 
  SignedIn, 
  SignedOut, 
  SignInButton, 
  UserButton, 
  useClerk
} from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Users, 
  History, 
  Settings, 
  Eye, 
  Database, 
  Zap, 
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Sun,
  Moon,
  ChevronDown,
  Sliders,
  Crop,
  Type
} from "lucide-react";

import "./App.css";

const API_BASE_URL = "http://localhost:5000";

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const [residents, setResidents] = useState([]);
  const [loadingResidents, setLoadingResidents] = useState(false);
  const [newResident, setNewResident] = useState({ number: "", owner: "", vehicle: "", city: "" });
  const { user } = useClerk();

  const scanSteps = [
    "Initializing OCR Engine...",
    "Isolating Plate Region...",
    "Extracting Alphanumerics...",
    "Matching Database Records...",
    "Finalizing Verification..."
  ];

  useEffect(() => {
    let interval;
    if (scanning) {
      interval = setInterval(() => {
        setScanStep((prev) => (prev + 1) % scanSteps.length);
      }, 1000);
    } else {
      setScanStep(0);
    }
    return () => clearInterval(interval);
  }, [scanning]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const fetchResidents = async () => {
    setLoadingResidents(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/residents`);
      const data = await response.json();
      setResidents(data);
    } catch (err) {
      console.error("Failed to fetch residents", err);
    } finally {
      setLoadingResidents(false);
    }
  };

  useEffect(() => {
    if (activeTab === "residents") {
      fetchResidents();
    }
  }, [activeTab]);

  const handleAddResident = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE_URL}/api/residents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResident),
      });
      if (response.ok) {
        setNewResident({ number: "", owner: "", vehicle: "", city: "" });
        fetchResidents();
      } else {
        const err = await response.json();
        alert(err.error || "Failed to add resident");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setScanning(true);

    const formData = new FormData();
    formData.append("image", file); // Changed from 'file' to 'image' to match backend

    try {
      const response = await fetch(`${API_BASE_URL}/api/recognize`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setResult(data);
      setScanning(false);
    } catch (err) {
      console.error(err);
      setScanning(false);
    }
  };

  return (
    <div className="app-wrapper">
      <div className="glow-orb" />
      
      <div className="theme-toggle-container">
        <button className="theme-toggle-btn" onClick={toggleTheme}>
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="dashboard-layout">
<aside className="glass-sidebar" style={{ background: "var(--sidebar-bg)" }}>
            <div className="sidebar-brand" style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "1.25rem", fontWeight: 800 }}>
              <ShieldCheck size={32} color="#3b82f6" />
              <span>SmartGate Pro</span>
            </div>

            <nav className="sidebar-nav">
              <NavItem active={activeTab === "dashboard"} onClick={() => setActiveTab("dashboard")} icon={<LayoutDashboard size={20}/>} label="Terminal" />
              <NavItem active={activeTab === "residents"} onClick={() => setActiveTab("residents")} icon={<Users size={20}/>} label="Residents" />
              <NavItem active={activeTab === "logs"} onClick={() => setActiveTab("logs")} icon={<History size={20}/>} label="Security Logs" />
              <NavItem active={activeTab === "settings"} onClick={() => setActiveTab("settings")} icon={<Settings size={20}/>} label="System Config" />
            </nav>

            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "1rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: "1rem" }}>
              <UserButton />
              <div style={{ fontSize: "0.85rem" }}>
                <div style={{ fontWeight: 700 }}>{user?.fullName || "Admin"}</div>
                <div style={{ color: "var(--text-muted)" }}>Access Level: 01</div>
              </div>
            </div>
          </aside>

          <main className="main-viewport">
            <AnimatePresence mode="wait">
              {activeTab === "dashboard" ? (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
                    <div>
                      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Live Terminal</h1>
                      <p style={{ color: "var(--text-muted)", marginBottom: "3rem" }}>Zero-Gravity Security Interface Activation</p>
                      
                      <div className="live-preview-box" style={{ background: preview ? `url(${preview}) center/cover` : "var(--card-bg)" }}>
                        {scanning && (
                          <>
                            <motion.div 
                              className="scanning-ray"
                              animate={{ top: ["0%", "100%", "0%"] }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 0.3 }}
                              className="scanner-overlay" 
                            />
                          </>
                        )}
                        <div className="scanning-text">
                          {scanning ? "MATCHING DATABASE..." : "SYSTEM READY"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                        <motion.label whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-glow" style={{ flex: 1, display: "flex", gap: "0.5rem", justifyContent: "center", cursor: "pointer" }}>
                          <Camera size={20} />
                          Capture Vehicle
                          <input type="file" onChange={handleUpload} hidden accept="image/*" />
                        </motion.label>
                        <button className="btn-secondary" style={{ flex: 1, display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                          <Upload size={20} />
                          Manual Override
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: "4rem" }}>
                      <div className="bento-card" style={{ height: "100%", padding: "2rem" }}>
                        <h2 style={{ marginBottom: "2rem", fontSize: "1.25rem" }}>Entry Verification</h2>
                        
                        {scanning ? (
                          <div style={{ padding: "1rem 0" }}>
                            <div className="pipeline-container">
                              <div className={`pipeline-step ${scanStep === 0 ? "active" : ""}`}>
                                <div className="step-icon">
                                  {scanStep === 0 ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                </div>
                                <div className="step-content"><h4>Loading Image</h4></div>
                              </div>
                              <div className="step-arrow"><ChevronDown size={14} /></div>

                              <div className={`pipeline-step ${scanStep === 1 ? "active" : ""}`}>
                                <div className="step-icon">
                                  {scanStep === 1 ? <Loader2 size={16} className="animate-spin" /> : <Sliders size={16} />}
                                </div>
                                <div className="step-content"><h4>Image Processing</h4></div>
                              </div>
                              <div className="step-arrow"><ChevronDown size={14} /></div>

                              <div className={`pipeline-step ${scanStep === 2 ? "active" : ""}`}>
                                <div className="step-icon">
                                  {scanStep === 2 ? <Loader2 size={16} className="animate-spin" /> : <Crop size={16} />}
                                </div>
                                <div className="step-content"><h4>Plate Detection</h4></div>
                              </div>
                              <div className="step-arrow"><ChevronDown size={14} /></div>

                              <div className={`pipeline-step ${scanStep === 3 ? "active" : ""}`}>
                                <div className="step-icon">
                                  {scanStep === 3 ? <Loader2 size={16} className="animate-spin" /> : <Type size={16} />}
                                </div>
                                <div className="step-content"><h4>OCR Extraction</h4></div>
                              </div>
                              <div className="step-arrow"><ChevronDown size={14} /></div>

                              <div className={`pipeline-step ${scanStep === 4 ? "active" : ""}`}>
                                <div className="step-icon">
                                  {scanStep === 4 ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                                </div>
                                <div className="step-content"><h4>Database Match</h4></div>
                              </div>
                            </div>
                            
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              style={{ textAlign: "center", marginTop: "1.5rem", color: "var(--primary)", fontWeight: 700 }}
                            >
                              {scanStep === 4 ? "SEARCHING REGISTRY..." : "AI PROCESSING..."}
                            </motion.div>
                          </div>
                        ) : result ? (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                                {result.status === "success" ? (
                                    <CheckCircle size={64} style={{ color: "var(--success)", marginBottom: "1rem" }} />
                                ) : (
                                    <XCircle size={64} style={{ color: "var(--error)", marginBottom: "1rem" }} />
                                )}
                                <h3 style={{ fontSize: "1.75rem", fontWeight: 800 }}>{result.status === "success" ? "GRANTED" : "DENIED"}</h3>
                            </div>
                            
                            <div className="vehicle-details" style={{ background: "rgba(0,0,0,0.3)", border: "none" }}>
                                <DetailRow label="LICENSE PLATE" value={result.plate || "Unknown"} />
                                <DetailRow label="RESIDENT MATCH" value={result.owner || "N/A"} />
                                <DetailRow label="STATUS" value={result.status === "success" ? "VALIDATED" : "FLAGGED"} isSuccess={result.status === "success"} />
                            </div>
                            
                            <button className="btn-glow" style={{ width: "100%", marginTop: "2rem", background: result.status === "success" ? "var(--success)" : "var(--error)" }}>
                               {result.status === "success" ? "Open Barrier" : "Call Response Team"}
                            </button>
                          </motion.div>
                        ) : (
                          <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--text-muted)" }}>
                            <AlertCircle size={40} style={{ margin: "0 auto 1rem" }} />
                            <p>Awaiting vehicle detection in primary gate zone.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : activeTab === "residents" ? (
                <motion.div key="residents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Resident Management</h1>
                  <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Centralized Vehicle Registration Hub</p>

                  <div className="bento-card" style={{ marginBottom: "2rem" }}>
                    <h3 style={{ marginTop: 0 }}>Register New Vehicle</h3>
                    <form onSubmit={handleAddResident} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: "1rem", marginTop: "1.5rem" }}>
                      <input 
                        className="glass-input" 
                        placeholder="Plate Number" 
                        value={newResident.number} 
                        onChange={e => setNewResident({...newResident, number: e.target.value.toUpperCase()})}
                        required
                      />
                      <input 
                        className="glass-input" 
                        placeholder="Owner Name" 
                        value={newResident.owner} 
                        onChange={e => setNewResident({...newResident, owner: e.target.value})}
                        required
                      />
                      <input 
                        className="glass-input" 
                        placeholder="Vehicle" 
                        value={newResident.vehicle} 
                        onChange={e => setNewResident({...newResident, vehicle: e.target.value})}
                        required
                      />
                      <input 
                        className="glass-input" 
                        placeholder="City" 
                        value={newResident.city} 
                        onChange={e => setNewResident({...newResident, city: e.target.value})}
                        required
                      />
                      <button type="submit" className="btn-glow" style={{ padding: "0 1.5rem" }}>Add Resident</button>
                    </form>
                  </div>

                  <div className="bento-card">
                    <table className="glass-table">
                      <thead>
                        <tr>
                          <th>Plate Number</th>
                          <th>Resident Name</th>
                          <th>Vehicle Model</th>
                          <th>Region</th>
                          <th>Access Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingResidents ? (
                          <tr><td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>Loading system data...</td></tr>
                        ) : residents.length > 0 ? (
                          residents.map((res, i) => (
                            <tr key={i}>
                              <td style={{ fontWeight: 700, color: "var(--primary)" }}>{res.number}</td>
                              <td>{res.owner}</td>
                              <td>{res.vehicle}</td>
                              <td>{res.city}</td>
                              <td><span className="verified-badge">ACTIVE</span></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="5" style={{ textAlign: "center", padding: "3rem" }}>No residents found in database.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              ) : (
                <div className="bento-card" style={{ textAlign: "center", padding: "10rem" }}>
                  <Zap size={48} color="#3b82f6" style={{ margin: "0 auto 1.5rem" }} />
                  <h2>System Module Offline</h2>
                  <p>The {activeTab} control plane is currently undergoing maintenance.</p>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </SignedIn>
    </div>
  );
};

const LandingPage = () => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="landing-hero">
    <motion.h1 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.2 }}
      className="hero-heading"
    >
      SmartGate AI <br/> Recognition.
    </motion.h1>
    <motion.p 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.3 }}
      className="hero-subtext"
    >
      Automated license plate recognition and access control system for modern residential communities and parking facilities.
    </motion.p>
    
    <motion.div 
      initial={{ y: 20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      transition={{ delay: 0.4 }}
      style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
    >
      <SignInButton mode="modal">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="btn-glow">
          Administrator Login
        </motion.button>
      </SignInButton>
    </motion.div>

    <div className="bento-grid">
      <BentoCard 
        icon={<Eye color="#3b82f6"/>} 
        title="OCR Deep Learning" 
        desc="Powered by Tesseract OCR and OpenCV to detect and read Indian vehicle plates with high precision." 
        large 
        variant="blue"
      />
      <BentoCard 
        icon={<Zap color="#fbbf24"/>} 
        title="Instant Verification" 
        desc="Real-time matching against your resident database to grant or deny access in seconds." 
        variant="amber"
      />
      <BentoCard 
        icon={<Database color="#ae7aff"/>} 
        title="Vehicle Database" 
        desc="Easily manage authorized vehicles, residents, and flat numbers through a centralized portal."
        variant="purple"
      />
      <BentoCard 
        icon={<ShieldCheck color="#10b981"/>} 
        title="Security Audit" 
        desc="Logs every vehicle entry/exit with timestamps and plate captures for complete facility oversight."
        variant="green"
      />
      <BentoCard 
        icon={<History color="#ff4d4d"/>} 
        title="Response History" 
        desc="Detailed analysis of entry trends and manual interventions for better site planning."
        variant="red"
      />
      <BentoCard 
        icon={<Settings color="#00d4ff"/>} 
        title="Admin Controls" 
        desc="Full control over user permissions, system updates, and automated gate scheduling."
        variant="cyan"
      />
    </div>

    <footer className="landing-footer">
      <div className="footer-line"></div>
      <div className="footer-content">
        <div className="footer-brand">
          <ShieldCheck size={24} color="#3b82f6" />
          <span>SmartGate AI</span>
        </div>
        <p className="footer-tagline">Advanced Autonomous Perimeter Security Ecosystem.</p>
        <div className="footer-links">
          <span>Documentation</span>
          <span>Security Portal</span>
          <span>System Status</span>
        </div>
        <div className="footer-credits">
          <span className="credit-label">Engineered by</span>
          <span className="credit-names">Samith & Koushik</span>
        </div>
        <p className="footer-copyright">© 2026 SmartGate Systems. All rights reserved.</p>
      </div>
    </footer>
  </motion.div>
);

const NavItem = ({ active, onClick, icon, label }) => (
  <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
    {icon} <span>{label}</span>
  </div>
);

const BentoCard = ({ icon, title, desc, large, variant }) => (
  <motion.div 
    whileHover={{ y: -5 }} 
    className={`bento-card ${large ? "bento-large" : ""} border-anim-${variant || "blue"}`}
  >
    <div className="bento-content">
      {icon}
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  </motion.div>
);

const DetailRow = ({ label, value, isSuccess }) => (
  <div className="detail-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>{label}</span>
    <strong style={{ color: isSuccess ? "var(--success)" : "#fff" }}>{value}</strong>
  </div>
);

export default App;
