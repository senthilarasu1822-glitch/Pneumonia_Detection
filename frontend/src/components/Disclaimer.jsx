import React from 'react';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';

export default function Disclaimer({ variant = 'banner', compact = false }) {
  if (variant === 'card') {
    return (
      <div 
        style={{
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-uncertain-bg)',
          border: '1px solid var(--status-uncertain-border)',
          color: 'var(--status-uncertain-text)',
          textAlign: 'left'
        }}
      >
        <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--status-uncertain-solid)' }} />
        <div style={{ fontSize: '0.85rem', lineHeight: 1.55 }}>
          <strong style={{ display: 'block', marginBottom: '0.2rem', color: '#78350f', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.75rem' }}>
            Educational AI Prototype — Not a Medical Diagnosis
          </strong>
          This system is an academic research prototype utilizing a DenseNet121 convolutional neural network. 
          The output represents automated pattern classification and <strong>must not be interpreted as a clinical diagnosis</strong>. 
          Always consult a licensed medical radiologist or certified physician for clinical evaluation.
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
        <Info size={14} />
        <span>Educational AI Prototype. Not intended for clinical diagnostic use.</span>
      </p>
    );
  }

  // Default Banner Variant
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        padding: compact ? '0.4rem 0.8rem' : '0.65rem 1.2rem',
        backgroundColor: '#fef3c7',
        borderBottom: '1px solid #fde68a',
        color: '#92400e',
        fontSize: '0.82rem',
        fontWeight: 500,
        textAlign: 'center',
        lineHeight: 1.4
      }}
    >
      <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
      <span>
        <strong>Educational AI Prototype:</strong> Chest X-ray pattern screening demonstration only. 
        Not a clinically validated medical diagnostic system.
      </span>
    </div>
  );
}
