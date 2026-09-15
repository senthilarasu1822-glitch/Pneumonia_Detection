import React from 'react';
import { Check, User, Upload, FileCheck2 } from 'lucide-react';

export default function StepIndicator({ currentStep = 1 }) {
  const steps = [
    { num: 1, id: '01', title: 'Patient', sub: 'Information', icon: User },
    { num: 2, id: '02', title: 'X-Ray', sub: 'Upload Image', icon: Upload },
    { num: 3, id: '03', title: 'Result', sub: 'DenseNet121 AI', icon: FileCheck2 }
  ];

  return (
    <div style={{ width: '100%', marginBottom: '1.75rem' }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          position: 'relative',
          padding: '0 0.5rem'
        }}
      >
        {/* Progress connecting track */}
        <div 
          style={{
            position: 'absolute',
            top: '20px',
            left: '35px',
            right: '35px',
            height: '2px',
            backgroundColor: 'var(--border-light)',
            zIndex: 0
          }}
        >
          <div 
            style={{
              height: '100%',
              backgroundColor: 'var(--cyan-500)',
              width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
              transition: 'width 0.4s ease'
            }}
          />
        </div>

        {steps.map((s) => {
          const isCompleted = s.num < currentStep;
          const isActive = s.num === currentStep;
          const Icon = s.icon;

          return (
            <div 
              key={s.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.4rem',
                position: 'relative',
                zIndex: 1
              }}
            >
              <div 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isCompleted 
                    ? 'var(--cyan-600)' 
                    : isActive 
                      ? '#ffffff' 
                      : '#ffffff',
                  border: isCompleted
                    ? '2px solid var(--cyan-600)'
                    : isActive
                      ? '2.5px solid var(--cyan-500)'
                      : '2px solid var(--border-light)',
                  color: isCompleted
                    ? '#ffffff'
                    : isActive
                      ? 'var(--cyan-600)'
                      : 'var(--text-light)',
                  boxShadow: isActive ? '0 0 0 4px rgba(14, 165, 233, 0.15)' : 'var(--shadow-xs)',
                  transition: 'all 0.3s ease'
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'var(--font-heading)' }}>
                    {s.id}
                  </span>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <span 
                  style={{ 
                    display: 'block',
                    fontSize: '0.78rem', 
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--navy-900)' : isCompleted ? 'var(--cyan-600)' : 'var(--text-muted)'
                  }}
                >
                  {s.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
