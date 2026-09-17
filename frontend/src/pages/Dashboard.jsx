import React from 'react';
import { useApp } from '../context/AppContext';
import PatientCard from '../components/PatientCard';
import {
  Upload, FileText, Activity, Cpu, Clock,
  TrendingUp, AlertCircle, CheckCircle2, BarChart2, ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { patient, history, analysis, navigateTo } = useApp();

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
            DenseNet121 v1.0
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
    </div>
  );
}
