import React from 'react';
import { Stethoscope, Video, FileText, CheckCircle2, Award, Building, Sparkles } from 'lucide-react';

export default function DoctorCard({ doctor, onStartVideo, onViewReport, compact = false }) {
  if (!doctor) return null;

  return (
    <div 
      className="card" 
      style={{ 
        padding: compact ? '1.25rem' : '1.75rem',
        border: '1px solid var(--border-light)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Banner Tag for Prototype Status */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <span 
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            backgroundColor: '#e0f2fe',
            color: '#0284c7',
            padding: '0.25rem 0.6rem',
            borderRadius: 'var(--radius-full)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Sparkles size={12} />
          Demo Doctor Profile (Academic Prototype)
        </span>

        <span 
          className="badge badge-normal" 
          style={{ fontSize: '0.7rem' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          Available for Demo
        </span>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Doctor Avatar */}
        <div 
          style={{
            position: 'relative',
            width: compact ? '64px' : '84px',
            height: compact ? '64px' : '84px',
            borderRadius: '16px',
            overflow: 'hidden',
            flexShrink: 0,
            border: '2px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <img 
            src={doctor.avatar} 
            alt={doctor.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>

        {/* Doctor Info */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900)', marginBottom: '0.2rem' }}>
            {doctor.name}
          </h3>
          <div style={{ fontSize: '0.86rem', color: 'var(--cyan-600)', fontWeight: 600, marginBottom: '0.4rem' }}>
            {doctor.role}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Stethoscope size={14} style={{ color: 'var(--cyan-600)' }} />
              <span>{doctor.department}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Building size={14} style={{ color: 'var(--cyan-600)' }} />
              <span>{doctor.affiliation}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={14} style={{ color: 'var(--cyan-600)' }} />
              <span>{doctor.qualifications} • {doctor.experience}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div 
        style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}
      >
        {onStartVideo && (
          <button 
            onClick={onStartVideo}
            className="btn btn-accent btn-sm"
            style={{ flex: 1, minWidth: '160px' }}
          >
            <Video size={16} />
            <span>Start Video Call</span>
          </button>
        )}

        {onViewReport && (
          <button 
            onClick={onViewReport}
            className="btn btn-secondary btn-sm"
            style={{ flex: 1, minWidth: '160px' }}
          >
            <FileText size={16} />
            <span>View Patient Report</span>
          </button>
        )}
      </div>
    </div>
  );
}
