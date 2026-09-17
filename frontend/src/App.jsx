import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import './index.css';

// Layout
import Header from './components/Header';

// Pages
import LandingPage from './pages/LandingPage';
import PatientInfo from './pages/PatientInfo';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import DetailedResult from './pages/DetailedResult';

// Report view
import ReportPreview from './components/ReportPreview';

function AppRouter() {
  const { activePage } = useApp();

  // Landing page has its own immersive dark layout
  if (activePage === 'landing') {
    return <LandingPage />;
  }

  // Patient-info page has its own full layout (no header)
  if (activePage === 'patient-info') {
    return <PatientInfo />;
  }

  // All other pages share the sticky header
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)' }}>
      <Header />
      <main style={{ flex: 1, padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 'var(--max-w-screen)', margin: '0 auto' }}>
          {activePage === 'dashboard'        && <Dashboard />}
          {activePage === 'upload'           && <UploadPage />}
          {activePage === 'analyzing'        && <UploadPage analyzing />}
          {activePage === 'detailed'         && <DetailedResult />}
          {activePage === 'report'           && <ReportPreview />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
