import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'step1', icon: 'fa-upload', title: 'Loading Image' },
    { id: 'step2', icon: 'fa-sliders-h', title: 'Image Processing' },
    { id: 'step3', icon: 'fa-crop-alt', title: 'Plate Detection' },
    { id: 'step4', icon: 'fa-font', title: 'OCR Extraction' },
    { id: 'step5', icon: 'fa-database', title: 'Database Match' }
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setActiveStep(0);
      interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % steps.length); // Loop back to 0 when it reaches the end
      }, 800);
    } else {
      setActiveStep(-1);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading, steps.length]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreview(url);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Use absolute URL to be safe during development if proxy is not set
      const response = await fetch('http://127.0.0.1:5000/api/recognize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to process image');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setLoading(false);
    setError(null);
    setActiveStep(-1);
  };

  return (
    <div className="App">
      <nav className="navbar">
        <div className="logo-section">
          <div className="logo-icon">
            <i className="fas fa-car"></i>
          </div>
          <div className="logo-text">Smart<span>Vehicle</span>ID</div>
        </div>
      </nav>

      <main className="main-container">
        <div className="content-grid">
          {/* Left Column */}
          <div className="card">
            <div className="card-title">
              <i className="fas fa-cloud-upload-alt"></i>
              Upload Vehicle Image
            </div>

            {!preview ? (
              <div className="upload-area" onClick={() => document.getElementById('fileInput').click()}>
                <div className="upload-icon">
                  <i className="fas fa-image"></i>
                </div>
                <h3>Drag & Drop your image here</h3>
                <p>or click to browse from your device</p>
                <span className="browse-btn">Browse Files</span>
                <input type="file" id="fileInput" hidden onChange={handleFileChange} accept="image/*" />
              </div>
            ) : (
              <div className="preview-container" style={{display: 'block'}}>
                <img className="preview-image" src={preview} alt="Preview" />
                <div className="preview-actions">
                  <button className="btn btn-secondary" onClick={reset}>
                    <i className="fas fa-redo"></i> Change Image
                  </button>
                  <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
                    <i className="fas fa-search"></i> {loading ? 'Detecting...' : 'Detect License Plate'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="card">
            <div className="card-title">
              <i className="fas fa-clipboard-check"></i>
              Recognition Results
            </div>

            {!loading && !result && !error && (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-search"></i>
                </div>
                <h3>No Results Yet</h3>
                <p>Upload a vehicle image and click "Detect License Plate" to see the recognition results here.</p>
              </div>
            )}

            {loading && (
              <div className="pipeline-container" style={{display: 'block'}}>
                {steps.map((step, index) => (
                  <React.Fragment key={step.id}>
                    <div className={`pipeline-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}>
                      <div className="step-icon">
                        <i className={`fas ${index < activeStep ? 'fa-check' : step.icon}`}></i>
                      </div>
                      <div className="step-content">
                        <h4>{step.title}</h4>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="step-arrow"><i className="fas fa-chevron-down"></i></div>
                    )}
                  </React.Fragment>
                ))}
                <div className="processing-text">
                  <i className="fas fa-spinner fa-spin"></i>
                  AI is analyzing the frame...
                </div>
              </div>
            )}

            {result && (
              <div className="result-panel" style={{display: 'block'}}>
                <div className="result-header">
                  <div className="result-status">
                    <i className="fas fa-check"></i>
                  </div>
                  <div>
                    <h3>Vehicle Identified Successfully</h3>
                    <p>Match found in database</p>
                  </div>
                </div>

                <div className="plate-display">
                  <div className="plate-label">Detected License Plate</div>
                  <div className="plate-number">{result.plate}</div>
                </div>

                <div className="owner-details">
                  <div className="detail-row">
                    <div className="detail-icon"><i className="fas fa-user"></i></div>
                    <div>
                      <div className="detail-label">Owner Name</div>
                      <div className="detail-value">{result.owner}</div>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-icon"><i className="fas fa-car-side"></i></div>
                    <div>
                      <div className="detail-label">Vehicle</div>
                      <div className="detail-value">{result.vehicle}</div>
                    </div>
                  </div>
                  <div className="detail-row">
                    <div className="detail-icon"><i className="fas fa-map-marker-alt"></i></div>
                    <div>
                      <div className="detail-label">City</div>
                      <div className="detail-value">{result.city}</div>
                    </div>
                  </div>
                </div>
                <button className="new-scan-btn" onClick={reset}>
                  <i className="fas fa-redo"></i> Scan Another Vehicle
                </button>
              </div>
            )}

            {error && (
              <div className="error-message">
                <h3>Detection Failed</h3>
                <p>{error}</p>
                <button className="new-scan-btn" onClick={reset}>Try Again</button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
