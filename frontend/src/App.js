import React, { useState } from "react";
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
  Loader2
} from "lucide-react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

const App = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [preview, setPreview] = useState(null);
  const { user } = useClerk();

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setScanning(true);

    const formData = new FormData();
    formData.append("file", file);

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
      
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <div className="dashboard-layout">
          <aside className="glass-sidebar">
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
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 400px", gap: "2rem" }}>
                    <div>
                      <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>Live Terminal</h1>
                      <p style={{ color: "var(--text-muted)", marginBottom: "3rem" }}>Zero-Gravity Security Interface Activation</p>
                      
                      <div className="live-preview-box" style={{ background: preview ? `url(${preview}) center/cover` : "#000" }}>
                        {scanning && (
                          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="scanner-overlay" />
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
                          <div style={{ textAlign: "center", padding: "4rem 0" }}>
                            <Loader2 size={48} className="animate-spin" style={{ color: "var(--primary)", margin: "0 auto 1.5rem" }} />
                            <p>Analyzing Vehicle Data...</p>
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
                                <DetailRow label="LICENSE PLATE" value={result.plate_number} />
                                <DetailRow label="RESIDENT MATCH" value={result.owner_details?.Owner || "N/A"} />
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
      <button className="btn-secondary">View Residents</button>
    </motion.div>

    <div className="bento-grid">
      <BentoCard 
        icon={<Eye color="#3b82f6"/>} 
        title="OCR Deep Learning" 
        desc="Powered by Tesseract OCR and OpenCV to detect and read Indian vehicle plates with high precision." 
        large 
      />
      <BentoCard 
        icon={<Zap color="#fbbf24"/>} 
        title="Instant Verification" 
        desc="Real-time matching against your resident database to grant or deny access in seconds." 
      />
      <BentoCard 
        icon={<Database color="#ae7aff"/>} 
        title="Vehicle Database" 
        desc="Easily manage authorized vehicles, residents, and flat numbers through a centralized portal."
      />
      <BentoCard 
        icon={<ShieldCheck color="#10b981"/>} 
        title="Security Audit" 
        desc="Logs every vehicle entry/exit with timestamps and plate captures for complete facility oversight."
        large
      />
    </div>
  </motion.div>
);

const NavItem = ({ active, onClick, icon, label }) => (
  <div className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
    {icon} <span>{label}</span>
  </div>
);

const BentoCard = ({ icon, title, desc, large }) => (
  <motion.div whileHover={{ y: -5 }} className={`bento-card ${large ? "bento-large" : ""}`}>
    {icon}
    <h3>{title}</h3>
    <p>{desc}</p>
  </motion.div>
);

const DetailRow = ({ label, value, isSuccess }) => (
  <div className="detail-row" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
    <span style={{ fontSize: "0.75rem", letterSpacing: "0.1em" }}>{label}</span>
    <strong style={{ color: isSuccess ? "var(--success)" : "#fff" }}>{value}</strong>
  </div>
);

export default App;
