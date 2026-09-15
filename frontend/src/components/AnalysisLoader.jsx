import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, Cpu, Scan, Layers, Sparkles } from 'lucide-react';

export default function AnalysisLoader({ xrayPreview, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(10);

  const steps = [
    { title: 'Preparing X-ray', desc: 'Normalizing image matrix and checking resolution (224×224 px)', icon: Scan },
    { title: 'Running DenseNet121 analysis', desc: 'Forward pass through the trained classification model', icon: Cpu },
    { title: 'Generating Grad-CAM', desc: 'Calculating gradient-based attention from convolutional feature maps', icon: Layers },
    { title: 'Preparing visualization', desc: 'Building the heatmap and original-image overlay', icon: Sparkles },
    { title: 'Preparing result', desc: 'Returning the model prediction and confidence from FastAPI', icon: CheckCircle2 }
  ];

  useEffect(() => {
    // Step timings for smooth realistic AI inference
    const timer1 = setTimeout(() => {
      setCurrentStep(1);
      setProgress(30);
    }, 500);

    const timer2 = setTimeout(() => {
      setCurrentStep(2);
      setProgress(50);
    }, 1200);

    const timer3 = setTimeout(() => {
      setCurrentStep(3);
      setProgress(70);
    }, 1900);

    const timer4 = setTimeout(() => {
      setCurrentStep(4);
      setProgress(90);
    }, 2300);

    const timer5 = setTimeout(() => {
      setProgress(100);
      if (onComplete) onComplete();
    }, 2800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div 
      className="card" 
      style={{ 
        maxWidth: '680px', 
        margin: '2rem auto', 
        padding: '2.5rem 2rem',
        textAlign: 'center' 
      }}
    >
      <div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, var(--cyan-500) 0%, var(--teal-500) 100%)',
          color: '#ffffff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
          boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)'
        }}
      >
        <Activity size={30} className="animate-pulse" />
      </div>

      <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
        Analyzing Chest X-Ray
      </h2>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Executing deep learning pattern recognition via DenseNet121 convolutional architecture
      </p>

      {/* Radiograph Scan Box with Animated Laser Sweep */}
      {xrayPreview && (
        <div 
          style={{
            position: 'relative',
            width: '200px',
            height: '200px',
            margin: '0 auto 2rem',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#0a0f1d',
            border: '2px solid var(--border-light)',
            boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.2)'
          }}
        >
          <img 
            src={xrayPreview} 
            alt="Scanning Radiograph" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.85 }} 
          />

          {/* Animated Cyan Laser Scan Line */}
          <div 
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: '#38bdf8',
              boxShadow: '0 0 12px 3px #0ea5e9',
              animation: 'scanSweep 1.8s ease-in-out infinite'
            }}
          />
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ width: '100%', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
          <span>Inference Progress</span>
          <span>{progress}%</span>
        </div>
        <div 
          style={{ 
            height: '8px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--bg-subtle)', 
            overflow: 'hidden',
            border: '1px solid var(--border-light)'
          }}
        >
          <div 
            style={{ 
              height: '100%', 
              width: `${progress}%`, 
              background: 'linear-gradient(90deg, var(--cyan-600) 0%, var(--teal-500) 100%)',
              transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }} 
          />
        </div>
      </div>

      {/* 4 Steps Checklist */}
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.85rem',
          textAlign: 'left',
          backgroundColor: 'var(--bg-subtle)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        {steps.map((step, idx) => {
          const isDone = idx < currentStep;
          const isCurrent = idx === currentStep;
          const Icon = step.icon;

          return (
            <div 
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                opacity: idx > currentStep ? 0.45 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <div 
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDone ? 'var(--status-normal-bg)' : isCurrent ? 'var(--cyan-100)' : '#ffffff',
                  color: isDone ? 'var(--status-normal-solid)' : isCurrent ? 'var(--cyan-600)' : 'var(--text-light)',
                  border: isDone ? '1px solid var(--status-normal-border)' : isCurrent ? '1px solid var(--cyan-400)' : '1px solid var(--border-light)'
                }}
              >
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={14} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: isCurrent ? 'var(--navy-900)' : 'var(--text-secondary)' }}>
                  {idx + 1}. {step.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {step.desc}
                </div>
              </div>

              {isCurrent && (
                <span 
                  className="badge badge-cyan" 
                  style={{ fontSize: '0.65rem', animation: 'pulse 1.5s infinite' }}
                >
                  Running
                </span>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes scanSweep {
          0% { top: 0%; }
          50% { top: 96%; }
          100% { top: 0%; }
        }
      `}</style>
    </div>
  );
}
