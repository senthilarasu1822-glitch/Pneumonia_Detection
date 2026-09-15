import React, { useState } from 'react';
import {
  ShieldCheck, AlertCircle, HelpCircle, CheckCircle2, Cpu,
  ChevronDown, ChevronUp, Info, Activity
} from 'lucide-react';

export default function ResultCard({ prediction, confidence, modelName = 'DenseNet121', threshold = 0.65 }) {
  const [showExplanation, setShowExplanation] = useState(false);

  const isPneumonia = prediction?.toUpperCase() === 'PNEUMONIA';
  const isNormal = prediction?.toUpperCase() === 'NORMAL';

  const config = isPneumonia ? {
    badgeClass: 'badge-suspected',
    badgeText: 'AI Prediction: Pneumonia Pattern',
    title: 'Pneumonia Pattern Detected',
    tagline: 'AI-assisted screening detected radiological features consistent with pneumonia pattern (Probability ≥ 0.65).',
    icon: AlertCircle,
    color: '#e11d48',
    bgColor: '#fff1f2',
    borderColor: '#fecdd3'
  } : {
    badgeClass: 'badge-normal',
    badgeText: 'AI Prediction: Normal Radiographic Pattern',
    title: 'Normal Radiographic Pattern',
    tagline: 'AI-assisted screening found no significant consolidations or opacities exceeding the 0.65 threshold.',
    icon: CheckCircle2,
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0'
  };

  const Icon = config.icon;

  return (
    <div 
      className="card"
      style={{
        padding: '1.75rem',
        border: `1.5px solid ${config.borderColor}`,
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span className={`badge ${config.badgeClass}`}>
          {config.badgeText}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <Cpu size={14} />
          <span>Model: <strong>{modelName}</strong></span>
          <span>•</span>
          <span>Threshold: <strong>{threshold}</strong></span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
        <div 
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: config.bgColor,
            color: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Icon size={26} />
        </div>

        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
            AI-Assisted Educational Screening
          </span>
          <h3 style={{ fontSize: '1.45rem', color: 'var(--navy-900)', margin: '0.15rem 0 0.4rem', fontWeight: 800 }}>
            {config.title}
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {config.tagline}
          </p>
        </div>
      </div>

      {/* Metrics Bar */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-subtle)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          marginBottom: '1rem'
        }}
      >
        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Individual Confidence
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: config.color, fontFamily: 'var(--font-heading)' }}>
            {confidence}%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>
            Calculated for this image
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Classification Threshold
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'var(--font-heading)' }}>
            {threshold}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>
            Pneumonia ≥ {threshold}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
            Model Test Accuracy
          </div>
          <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-heading)' }}>
            91.51%
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>
            Model Test Performance Reference
          </div>
        </div>
      </div>

      {/* Collapsible: How the AI analyzed this image */}
      <div>
        <button
          type="button"
          onClick={() => setShowExplanation(v => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--cyan-700)',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0'
          }}
        >
          <Info size={14} />
          <span>How the AI analyzed this image</span>
          {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showExplanation && (
          <div
            style={{
              marginTop: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              fontSize: '0.82rem',
              color: '#334155',
              lineHeight: 1.6
            }}
          >
            The image was processed by a <strong>DenseNet121</strong> deep learning model preprocessed at 224×224 resolution. The model generated a sigmoid probability score for pneumonia, and the application classified the image using the configured <strong>0.65 threshold</strong> (scores ≥ 0.65 are classified as Pneumonia, scores &lt; 0.65 are classified as Normal). Visual attention was extracted from the final convolutional block (<code>conv5_block16_2_conv</code>) using real Grad-CAM GradientTape.
          </div>
        )}
      </div>
    </div>
  );
}
