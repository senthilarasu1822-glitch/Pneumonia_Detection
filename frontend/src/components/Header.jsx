import React from 'react';
import { useApp } from '../context/AppContext';
import Logo from './Logo';
import {
  LayoutDashboard, Upload, FileText, Stethoscope, LogOut,
  User, Home, Shield
} from 'lucide-react';

export default function Header() {
  const { patient, activePage, navigateTo, logoutPatient, analysis } = useApp();

  const handleLogout = () => {
    if (window.confirm('Reset current patient session and return to home page?')) {
      logoutPatient();
    }
  };

  return (
    <header 
      className="app-header"
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: 'var(--shadow-xs)'
      }}
    >
      <div 
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 'var(--header-height)',
          gap: '1rem'
        }}
      >
        {/* Left: Brand Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            onClick={() => navigateTo('landing')}
            style={{ cursor: 'pointer' }}
            title="PneumoAI Home"
          >
            <Logo size="md" showTagline={false} />
          </div>
          <button
            onClick={() => navigateTo('landing')}
            className="btn btn-sm"
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'var(--text-muted)'
            }}
            title="Home"
          >
            <Home size={15} />
          </button>
        </div>

        {/* Center: Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {patient && (
            <>
              <button
                onClick={() => navigateTo('dashboard')}
                className={`btn btn-sm ${activePage === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <LayoutDashboard size={15} />
                <span className="nav-label">Dashboard</span>
              </button>

              <button
                onClick={() => navigateTo('upload')}
                className={`btn btn-sm ${activePage === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <Upload size={15} />
                <span className="nav-label">New Screening</span>
              </button>

              {analysis && (
                <button
                  onClick={() => navigateTo('report')}
                  className={`btn btn-sm ${activePage === 'report' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.85rem' }}
                >
                  <FileText size={15} />
                  <span className="nav-label">Report</span>
                </button>
              )}

              <button
                onClick={() => navigateTo('consultation')}
                className={`btn btn-sm ${activePage === 'consultation' || activePage === 'videocall' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <Stethoscope size={15} />
                <span className="nav-label">Consultation</span>
              </button>
            </>
          )}

          {/* Doctor Portal Quick Switch */}
          <button
            onClick={() => navigateTo('doctor-dashboard')}
            className={`btn btn-sm ${activePage === 'doctor-dashboard' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '0.45rem 0.85rem',
              border: activePage === 'doctor-dashboard' ? 'none' : '1px solid #cbd5e1'
            }}
          >
            <Shield size={14} />
            <span className="nav-label">Doctor Portal</span>
          </button>
        </nav>

        {/* Right: Active Patient Profile Badge & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {patient ? (
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem',
                backgroundColor: 'var(--bg-subtle)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div 
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--navy-800)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {patient.fullName ? patient.fullName.charAt(0).toUpperCase() : 'P'}
              </div>

              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                  {patient.fullName}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{patient.contactNumber}</div>
              </div>

              <button
                onClick={handleLogout}
                title="Switch patient / Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <User size={15} />
              <span>Academic Demo</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
