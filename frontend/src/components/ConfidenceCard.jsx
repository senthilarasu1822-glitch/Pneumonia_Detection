import React from 'react';
import { BarChart3, TrendingUp, Info } from 'lucide-react';

export default function ConfidenceCard({ prediction, confidence, probability, threshold = 0.65 }) {
  const isPneumonia = prediction?.toUpperCase() === 'PNEUMONIA';
  
  // Calculate relative distribution probabilities
  const pneumoniaProb = typeof probability === 'number'
    ? parseFloat((probability * 100).toFixed(1))
    : (isPneumonia ? confidence : parseFloat((100 - confidence).toFixed(1)));
  const normalProb = parseFloat((100 - pneumoniaProb).toFixed(1));

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart3 size={18} style={{ color: 'var(--cyan-600)' }} />
          <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--navy-900)' }}>
            Class Probability Distribution
          </h4>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          DenseNet121 Sigmoid
        </span>
      </div>

      {/* Pneumonia Probability Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Pneumonia Probability</span>
          <span style={{ fontWeight: 700, color: isPneumonia ? '#e11d48' : 'var(--text-muted)' }}>
            {pneumoniaProb}%
          </span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden', position: 'relative' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${pneumoniaProb}%`, 
              backgroundColor: isPneumonia ? '#e11d48' : '#94a3b8',
              borderRadius: '4px',
              transition: 'width 0.6s ease'
            }} 
          />
        </div>
      </div>

      {/* Normal Probability Bar */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Normal Probability</span>
          <span style={{ fontWeight: 700, color: !isPneumonia ? '#059669' : 'var(--text-muted)' }}>
            {normalProb}%
          </span>
        </div>
        <div style={{ height: '8px', borderRadius: '4px', backgroundColor: 'var(--bg-subtle)', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${normalProb}%`, 
              backgroundColor: !isPneumonia ? '#10b981' : '#94a3b8',
              borderRadius: '4px',
              transition: 'width 0.6s ease'
            }} 
          />
        </div>
      </div>

      {/* Classification Threshold Marker */}
      <div
        style={{
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
          padding: '0.65rem 0.85rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          marginBottom: '0.75rem',
          fontSize: '0.78rem',
          color: 'var(--navy-900)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span><strong>Classification Threshold:</strong></span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0284c7' }}>0.65</span>
        </div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
          Pneumonia is flagged if predicted probability ≥ 0.65
        </div>
      </div>

      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          paddingTop: '0.65rem',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <Info size={14} style={{ flexShrink: 0 }} />
        <span>Model test performance reference: 91.51% Accuracy, 93.33% Sensitivity.</span>
      </div>
    </div>
  );
}
