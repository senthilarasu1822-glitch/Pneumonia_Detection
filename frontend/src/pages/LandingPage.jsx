import React from 'react';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';
import Disclaimer from '../components/Disclaimer';
import {
  Cpu, Activity, Layers, FileText, ArrowRight, ShieldCheck,
  Stethoscope, Eye, CheckCircle2, ChevronRight, Sparkles
} from 'lucide-react';

export default function LandingPage() {
  const { navigateTo, patient } = useApp();

  const handleStartScreening = () => {
    if (patient) {
      navigateTo('dashboard');
    } else {
      navigateTo('patient-info');
    }
  };

  const technologies = [
    {
      icon: Cpu,
      title: 'DenseNet121 Architecture',
      desc: '121-layer densely connected convolutional neural network with direct feature reuse across all layers.'
    },
    {
      icon: Eye,
      title: 'Grad-CAM Attention',
      desc: 'Gradient-weighted Class Activation Mapping highlighting visual patterns that influenced the model prediction.'
    },
    {
      icon: Activity,
      title: 'AI-Assisted Analysis',
      desc: 'Targeted binary classification screening with calibrated 0.65 probability threshold.'
    },
    {
      icon: FileText,
      title: 'Clinical-Grade PDF & WhatsApp',
      desc: 'Automated reporting with multi-spectral heatmaps and doctor appointment coordination.'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#090d16', color: '#f8fafc' }}>
      <Disclaimer compact />

      {/* Modern Medical Header */}
      <header
        style={{
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '1.25rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Logo size="md" light showTagline={false} />
          <span
            style={{
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(14, 165, 233, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(14, 165, 233, 0.3)'
            }}
          >
            Academic AI Platform
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigateTo('doctor-dashboard')}
            className="btn btn-sm"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8'
            }}
          >
            <Stethoscope size={15} />
            <span>Doctor Portal</span>
          </button>

          <button
            onClick={handleStartScreening}
            className="btn btn-accent btn-sm"
          >
            <span>Start Screening</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '3.5rem 1.5rem 4rem' }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center' }}>
          
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 1rem',
              borderRadius: '999px',
              backgroundColor: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              marginBottom: '1.75rem'
            }}
          >
            <Sparkles size={16} style={{ color: '#38bdf8' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#38bdf8' }}>
              DenseNet121 Deep Learning Screening
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '1.25rem',
              color: '#ffffff'
            }}
          >
            PneumoAI<br />
            <span style={{ background: 'linear-gradient(90deg, #38bdf8 0%, #14b8a6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AI-Assisted Pneumonia Detection
            </span>
          </h1>

          <p
            style={{
              fontSize: '1.15rem',
              color: '#94a3b8',
              lineHeight: 1.65,
              maxWidth: '680px',
              margin: '0 auto 2.5rem'
            }}
          >
            Upload a chest X-ray and receive an AI-generated prediction with visual attention analysis.
            Interpreted through real-time Grad-CAM neural attention overlays, verified test benchmark metrics, and seamless physician consultation.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
            <button
              onClick={handleStartScreening}
              className="btn btn-accent btn-lg"
              style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)' }}
            >
              <span>Start Screening</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('technology-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="btn btn-secondary btn-lg"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                padding: '0.85rem 1.85rem'
              }}
            >
              <span>Learn More</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Key Workflow Pill Highlights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.6)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div style={{ textAlign: 'left', padding: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Classification Threshold</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>0.65</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Target probability cut-off</div>
            </div>

            <div style={{ textAlign: 'left', padding: '0.5rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Model Benchmark</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#22c55e', marginTop: '0.2rem' }}>91.51%</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Test accuracy on 624 images</div>
            </div>

            <div style={{ textAlign: 'left', padding: '0.5rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Grad-CAM Attention</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#eab308', marginTop: '0.2rem' }}>conv5_block16</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Real convolutional activation</div>
            </div>

            <div style={{ textAlign: 'left', padding: '0.5rem', borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>Consultation</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#a855f7', marginTop: '0.2rem' }}>Online / Offline</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>WebRTC video & clinic visit</div>
            </div>
          </div>
        </div>

        {/* TECHNOLOGY SECTION */}
        <div id="technology-section" style={{ maxWidth: '1100px', margin: '5rem auto 0', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{ color: '#0ea5e9', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Core Technical Architecture
            </span>
            <h2 style={{ fontSize: '2.2rem', color: '#ffffff', fontFamily: 'var(--font-heading)', marginTop: '0.4rem' }}>
              Advanced Deep Learning & Explainable AI
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', maxWidth: '580px', margin: '0.5rem auto 0' }}>
              Built strictly on medical imaging standards with reproducible mathematical interpretability.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {technologies.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  backgroundColor: 'rgba(15, 23, 42, 0.45)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '1.75rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(14, 165, 233, 0.12)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  <Icon size={22} />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#ffffff', marginBottom: '0.6rem', fontFamily: 'var(--font-heading)' }}>
                  {title}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>

          {/* Model Test Performance Reference Card */}
          <div
            style={{
              marginTop: '3.5rem',
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: 'var(--radius-xl)',
              padding: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>EVALUATION BENCHMARK</span>
                <h3 style={{ color: '#ffffff', fontSize: '1.3rem', margin: 0 }}>Model Test Performance Reference</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Observed evaluation metrics across 624 independent test chest radiographs at threshold 0.65.
                </p>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                *Not patient-specific confidence
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Test Accuracy</div>
                <div style={{ color: '#38bdf8', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>91.51%</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Sensitivity (Recall)</div>
                <div style={{ color: '#22c55e', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>93.33%</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Specificity</div>
                <div style={{ color: '#a855f7', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>88.46%</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pneumonia Precision</div>
                <div style={{ color: '#f59e0b', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>93.09%</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem' }}>Pneumonia F1-Score</div>
                <div style={{ color: '#ec4899', fontSize: '1.5rem', fontWeight: 800, marginTop: '0.2rem' }}>93.21%</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.75rem 2rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
        <p>PneumoAI — Educational & Research Demonstration. Not a substitute for licensed medical diagnosis.</p>
      </footer>
    </div>
  );
}
