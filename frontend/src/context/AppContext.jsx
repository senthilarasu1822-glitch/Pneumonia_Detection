import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getAppointmentsApi,
  createAppointmentApi,
  approveAppointmentApi,
  rejectAppointmentApi
} from '../services/api';

const AppContext = createContext(null);

export const DEMO_DOCTOR = {
  name: 'Dr. Sarah Mitchell, MD',
  role: 'Attending Pulmonologist & Radiologist',
  department: 'Thoracic Imaging & Respiratory Care',
  affiliation: 'Metro Academic Medical Center',
  clinic: 'Metro Pulmonary Care Center',
  address: '12 Health Sciences Avenue, Academic District',
  phone: '9786113795',
  whatsapp: '9786113795',
  avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
  qualifications: 'MBBS, MD (Radiodiagnosis), FCCP',
  license: 'MD-92847-RAD (Prototype License)',
  status: 'Available for Consultation',
  experience: '12+ Years Clinical Radiology Experience',
  isDemo: true
};

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

  // 4. Appointments State (array of all appointments for doctor & patient)
  const [appointments, setAppointments] = useState([]);
  
  // Current patient's active appointment
  const [appointment, setAppointment] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pneumoai_appointment');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 5. Screening History
  const [history, setHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('pneumoai_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // 6. Active View / Navigation
  // 'landing' -> 'patient-info' -> 'dashboard' -> 'upload' -> 'analyzing' -> 'detailed' -> 'report' -> 'consultation' -> 'videocall' -> 'doctor-dashboard'
  const [activePage, setActivePage] = useState('landing');
  const [activeRole, setActiveRole] = useState('patient'); // 'patient' or 'doctor'

  // Fetch appointments from backend on load
  const refreshAppointments = useCallback(async () => {
    const data = await getAppointmentsApi();
    if (data && Array.isArray(data)) {
      setAppointments(data);
      // Sync active appointment if exists
      if (appointment) {
        const found = data.find(a => a.id === appointment.id);
        if (found) {
          setAppointment(found);
          sessionStorage.setItem('pneumoai_appointment', JSON.stringify(found));
        }
      }
    }
  }, [appointment]);

  useEffect(() => {
    refreshAppointments();
    // Poll periodically so patient receives doctor approval updates automatically
    const interval = setInterval(refreshAppointments, 4000);
    return () => clearInterval(interval);
  }, [refreshAppointments]);

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

  useEffect(() => {
    try {
      if (appointment) sessionStorage.setItem('pneumoai_appointment', JSON.stringify(appointment));
      else sessionStorage.removeItem('pneumoai_appointment');
    } catch (e) {
      console.error(e);
    }
  }, [appointment]);

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
    setAppointment(null);
    setActivePage('landing');
    sessionStorage.removeItem('pneumoai_patient');
    sessionStorage.removeItem('pneumoai_appointment');
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

  // Patient requests an appointment
  const requestAppointment = async ({ consultationType, date, time, reason }) => {
    const payload = {
      patient: { ...patient },
      doctor: { ...DEMO_DOCTOR },
      consultationType,
      date,
      time,
      reason: reason || ''
    };

    const created = await createAppointmentApi(payload);
    const newApt = created || {
      id: `APT-${Date.now()}`,
      ...payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      clinicName: DEMO_DOCTOR.clinic,
      clinicAddress: DEMO_DOCTOR.address,
      instructions: consultationType === 'offline' ? 'Please arrive 10-15 minutes prior to appointment.' : ''
    };

    setAppointment(newApt);
    setAppointments(prev => [newApt, ...prev.filter(a => a.id !== newApt.id)]);
    return newApt;
  };

  // Doctor approves appointment
  const approveAppointment = async (appointmentId, approvalData) => {
    const res = await approveAppointmentApi(appointmentId, approvalData);
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return res || { ...a, status: 'approved', ...approvalData };
      }
      return a;
    }));
    if (appointment?.id === appointmentId) {
      setAppointment(prev => ({ ...prev, status: 'approved', ...approvalData }));
    }
  };

  // Doctor rejects appointment
  const rejectAppointment = async (appointmentId) => {
    const res = await rejectAppointmentApi(appointmentId);
    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return res || { ...a, status: 'rejected' };
      }
      return a;
    }));
    if (appointment?.id === appointmentId) {
      setAppointment(prev => ({ ...prev, status: 'rejected' }));
    }
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
        appointment,
        setAppointment,
        appointments,
        refreshAppointments,
        requestAppointment,
        approveAppointment,
        rejectAppointment,
        activePage,
        navigateTo,
        activeRole,
        setActiveRole,
        doctor: DEMO_DOCTOR
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
