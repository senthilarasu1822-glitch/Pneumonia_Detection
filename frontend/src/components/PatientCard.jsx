import React from 'react';
import { User, Calendar, Phone, Clock } from 'lucide-react';

export default function PatientCard({ patient, compact = false, editable = false, onEdit = null }) {
  if (!patient) return null;

  return (
    <div 
      className="card" 
      style={{ 
        padding: compact ? '1rem 1.25rem' : '1.5rem',
        borderLeft: '4px solid var(--cyan-500)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--cyan-50)',
              color: 'var(--cyan-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <User size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy-900)' }}>
              {patient.fullName}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Patient Record
            </span>
          </div>
        </div>

      </div>

      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '1rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <Calendar size={13} />
            <span>Age / Sex</span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
            {patient.age} yrs • {patient.sex}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
            <Phone size={13} />
            <span>Contact</span>
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            {patient.contactNumber}
          </div>
        </div>

        {patient.registeredAt && (
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
              <Clock size={13} />
              <span>Registered</span>
            </div>
            <div style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              {new Date(patient.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
