import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // 1. Patient State
  const [patient, setPatient] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pneumoai_patient');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 2. Current X-Ray file & preview
  const [xray, setXray] = useState(null);

  // 3. Current Analysis Result
  const [analysis, setAnalysis] = useState(null);

  // 4. Screening History
  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pneumoai_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 5. Active View / Navigation
  // 'landing' -> 'patient-info' -> 'dashboard' -> 'upload' -> 'analyzing' -> 'detailed' -> 'report'
  const [activePage, setActivePage] = useState('landing');

  // Persist patient to session storage
  useEffect(() => {
    try {
      if (patient) {
        sessionStorage.setItem('pneumoai_patient', JSON.stringify(patient));
      } else {
        sessionStorage.removeItem('pneumoai_patient');
      }
    } catch (e) {
      console.error(e);
    }
  }, [patient]);

  // Persist history to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('pneumoai_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Navigation helper
  const navigateTo = (page) => {
    // If navigating to patient-only workflow without a registered patient, direct to patient-info
    const patientWorkflow = ['upload', 'analyzing', 'detailed', 'report'];
    if (patientWorkflow.includes(page) && !patient) {
      setActivePage('patient-info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save patient intake
  const savePatientInfo = (info) => {
    const patientData = {
      ...info,
      registeredAt: new Date().toISOString()
    };
    setPatient(patientData);
    navigateTo('dashboard');
  };

  // Reset / switch patient
  const logoutPatient = () => {
    setPatient(null);
    setXray(null);
    setAnalysis(null);
    setActivePage('landing');
    sessionStorage.removeItem('pneumoai_patient');
  };

  // Helper to load demo sample image (Normal or Pneumonia)
  const loadSampleXray = async (sampleType = 'normal') => {
    try {
      const url = sampleType === 'normal' 
        ? '/samples/sample_normal.jpeg' 
        : '/samples/sample_pneumonia.jpeg';
      const filename = sampleType === 'normal' 
        ? 'NORMAL_CHEST_XRAY_SAMPLE.jpeg' 
        : 'PNEUMONIA_CHEST_XRAY_SAMPLE.jpeg';

      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });

      setXray({
        file,
        previewUrl: url,
        fileName: filename,
        fileSize: (blob.size / 1024).toFixed(1) + ' KB',
        dimensions: '224 × 224 px',
        isSample: true,
        sampleType
      });
      return true;
    } catch (err) {
      console.error('Failed to load sample image:', err);
      return false;
    }
  };

  // Record an analysis result
  const recordAnalysisResult = (resultData) => {
    const fullResult = {
      ...resultData,
      modelName: 'DenseNet121',
      threshold: 0.65,
      // Official model test benchmark reference metrics (NOT patient confidence)
      testPerformance: {
        accuracy: 91.51,
        sensitivity: 93.33,
        specificity: 88.46,
        precision: 93.09,
        f1Score: 93.21,
        testImages: 624,
        confusionMatrix: [[207, 27], [26, 364]]
      },
      analyzedAt: new Date().toISOString(),
      patientName: patient?.fullName || 'N/A'
    };
    setAnalysis(fullResult);
    
    // Add to history
    setHistory(prev => [
      {
        id: 'SCAN-' + Date.now(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        prediction: fullResult.prediction,
        confidence: fullResult.confidence,
        previewUrl: xray?.previewUrl || null,
        fileName: xray?.fileName || 'CXR-Image.jpg'
      },
      ...prev.slice(0, 9)
    ]);
  };

  return (
    <AppContext.Provider
      value={{
        patient,
        savePatientInfo,
        logoutPatient,
        xray,
        setXray,
        loadSampleXray,
        analysis,
        setAnalysis,
        recordAnalysisResult,
        history,
        activePage,
        navigateTo
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
