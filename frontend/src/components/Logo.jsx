import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

export default function Logo({ size = 'md', light = false, showTagline = false }) {
  const sizeClasses = {
    sm: { icon: 20, text: '1.1rem', sub: '0.65rem' },
    md: { icon: 26, text: '1.35rem', sub: '0.72rem' },
    lg: { icon: 34, text: '1.75rem', sub: '0.82rem' },
    xl: { icon: 42, text: '2.15rem', sub: '0.9rem' }
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', userSelect: 'none' }}>
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: currentSize.icon * 1.6,
          height: currentSize.icon * 1.6,
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0f172a 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}
      >
        <Activity size={currentSize.icon} strokeWidth={2.4} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span 
            style={{ 
              fontFamily: 'var(--font-heading)',
              fontWeight: 800, 
              fontSize: currentSize.text, 
              color: light ? '#ffffff' : 'var(--navy-900)',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}
          >
            Pneumo<span style={{ color: '#0ea5e9' }}>AI</span>
          </span>
        </div>
        {showTagline && (
          <span style={{ fontSize: currentSize.sub, color: light ? '#94a3b8' : 'var(--text-muted)', fontWeight: 500 }}>
            Chest X-Ray Screening System
          </span>
        )}
      </div>
    </div>
  );
}
