import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import PatientCard from '../components/PatientCard';
import Disclaimer from '../components/Disclaimer';
import WhatsAppShareModal from '../components/WhatsAppShareModal';
import {
  Upload, FileText, Stethoscope, Activity, Cpu, Clock,
  TrendingUp, AlertCircle, CheckCircle2, BarChart2, ArrowRight,
  Video, Building, ExternalLink, MessageCircle
} from 'lucide-react';

export default function Dashboard() {
  const { patient, history, analysis, appointment, navigateTo, doctor } = useApp();
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const totalScans = history.length;
  const pneumoniaCount = history.filter(h => h.prediction === 'PNEUMONIA').length;
  const normalCount = history.filter(h => h.prediction === 'NORMAL').length;

  const quickActions = [
    {
      icon: Upload,
      label: 'New Screening',
      sub: 'Upload a chest X-ray for DenseNet121 analysis',
      page: 'upload',
      color: 'var(--cyan-600)',
      bg: 'var(--cyan-50)',
      border: 'var(--cyan-100)',
      accent: true
    },
    {
      icon: FileText,
      label: 'View Report',
      sub: analysis ? 'View latest AI analysis report' : 'No analysis yet — run a screening first',
      page: 'report',
      color: '#7c3aed',
      bg: '#f5f3ff',
      border: '#ddd6fe',
      disabled: !analysis
    },
    {
      icon: Stethoscope,
      label: 'Doctor Consultation',
      sub: `Connect with ${doctor.name} (${doctor.phone})`,
      page: 'consultation',
      color: '#059669',
      bg: '#ecfdf5',
      border: '#a7f3d0'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Welcome Header */}
      <div>
        <h2 style={{ fontSize: '1.65rem', color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
          Welcome back, <span style={{ color: 'var(--cyan-600)' }}>{patient?.fullName?.split(' ')[0]}</span>
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          PneumoAI Dashboard — DenseNet121 Chest X-Ray Screening System
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Screenings', value: totalScans, icon: Activity, color: 'var(--cyan-600)', bg: 'var(--cyan-50)' },
          { label: 'Pneumonia Flags', value: pneumoniaCount, icon: AlertCircle, color: '#e11d48', bg: '#fff1f2' },
          { label: 'Normal Results', value: normalCount, icon: CheckCircle2, color: '#059669', bg: '#ecfdf5' },
          { label: 'Model Benchmark Reference', value: '91.51%', icon: TrendingUp, color: '#7c3aed', bg: '#f5f3ff' }
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card" style={{ padding: '1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Consultation Status Banner */}
      {appointment && (
        <div
          className="card"
          style={{
            padding: '1.25rem 1.5rem',
            borderLeft: `4px solid ${appointment.status === 'approved' ? '#10b981' : appointment.status === 'rejected' ? '#ef4444' : '#f59e0b'}`,
            backgroundColor: '#ffffff'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Active Consultation Request
                </span>
                <span className={`badge ${appointment.status === 'approved' ? 'badge-normal' : appointment.status === 'rejected' ? 'badge-suspected' : 'badge-uncertain'}`}>
                  {appointment.status === 'pending' ? 'PENDING APPROVAL' : appointment.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                {appointment.consultationType.toUpperCase()} Consultation with {appointment.doctor?.name || doctor?.name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Scheduled: {appointment.date} at {appointment.time}
                {appointment.consultationType === 'offline' && appointment.clinicName && ` • ${appointment.clinicName}`}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {/* ONLINE + APPROVED: Video Call Enabled + WhatsApp */}
              {appointment.status === 'approved' && appointment.consultationType === 'online' && (
                <>
                  <button className="btn btn-accent btn-sm" onClick={() => navigateTo('videocall')}>
                    <Video size={15} /> Join Video Call
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setIsWhatsAppOpen(true)}
                    style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}
                    title="Connect with Doctor on WhatsApp"
                  >
                    <MessageCircle size={14} /> WhatsApp Doctor
                  </button>
                </>
              )}

              {/* OFFLINE + APPROVED: View Clinic Details */}
              {appointment.status === 'approved' && appointment.consultationType === 'offline' && (
                <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('consultation')}>
                  <Building size={15} /> View Clinic Details
                </button>
              )}

              <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('consultation')}>
                Manage Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {quickActions.map(({ icon: Icon, label, sub, page, color, bg, border, disabled }) => (
            <button
              key={label}
              onClick={() => !disabled && navigateTo(page)}
              disabled={disabled}
              className="card"
              style={{
                padding: '1.35rem',
                textAlign: 'left',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                gap: '1rem',
                alignItems: 'flex-start',
                transition: 'all 0.2s ease',
                border: `1px solid ${border || 'var(--border-light)'}`,
                backgroundColor: disabled ? '#fafafa' : '#ffffff',
                opacity: disabled ? 0.55 : 1,
                boxShadow: 'none'
              }}
              onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.2rem' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{sub}</div>
              </div>
              {!disabled && <ArrowRight size={16} style={{ color: 'var(--text-light)', marginTop: '4px', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Patient + History Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

        {/* Patient Card */}
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Active Patient
          </h3>
          <PatientCard patient={patient} />
        </div>

        {/* Scan History */}
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Screening History
          </h3>
          <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {history.length === 0 ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BarChart2 size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
                <p style={{ fontSize: '0.88rem' }}>No screenings yet. Upload a chest X-ray to begin.</p>
              </div>
            ) : (
              history.slice(0, 5).map((item, idx) => {
                const isPneumonia = item.prediction === 'PNEUMONIA';
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      padding: '0.85rem 1.25rem',
                      borderBottom: idx < history.length - 1 ? '1px solid var(--border-light)' : 'none'
                    }}
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: isPneumonia ? '#fff1f2' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isPneumonia
                        ? <AlertCircle size={18} style={{ color: '#e11d48' }} />
                        : <CheckCircle2 size={18} style={{ color: '#059669' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--navy-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.fileName}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.date}</div>
                    </div>
                    <span className={`badge ${isPneumonia ? 'badge-suspected' : 'badge-normal'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                      {item.confidence}%
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Model Technical Info Card */}
      <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 100%)', border: 'none', color: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <Cpu size={20} style={{ color: '#38bdf8' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>DenseNet121 Model Architecture Reference</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b', backgroundColor: 'rgba(14,165,233,0.15)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(14,165,233,0.25)' }}>
            Educational Prototype
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Architecture', value: 'DenseNet121 (121-layer Dense CNN)' },
            { label: 'Classification Threshold', value: '0.65 (Probability ≥ 0.65 = Pneumonia)' },
            { label: 'Test Accuracy Reference', value: '91.51% (Sensitivity: 93.33%, Specificity: 88.46%)' },
            { label: 'Input Resolution', value: '224 × 224 px (DenseNet preprocess_input)' }
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>{label}</div>
              <div style={{ fontSize: '0.88rem', color: '#f1f5f9', fontWeight: 500 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <Disclaimer variant="card" />

      {/* WhatsApp Connect Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        defaultRecipient="doctor"
        appointmentData={appointment}
        reportData={analysis ? { prediction: analysis.prediction, confidence: analysis.confidence, analyzedAt: analysis.analyzedAt } : null}
      />
    </div>
  );
}
