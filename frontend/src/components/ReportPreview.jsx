import React, { useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { FileText, Download, ArrowLeft, ShieldAlert, Share2, ExternalLink } from 'lucide-react';
import { downloadReportPdf } from '../services/reportService';
import WhatsAppShareModal from './WhatsAppShareModal';

export default function ReportPreview() {
  const { patient, xray, analysis, navigateTo, doctor } = useApp();
  const reportRef = useRef(null);

  const [reportError, setReportError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const handleDownload = async () => {
    setReportError('');
    setIsGenerating(true);
    try {
      await downloadReportPdf({ patient, analysis, originalImage: xray?.previewUrl });
    } catch (error) {
      setReportError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!patient || !analysis) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)' }}>No analysis data available to generate report.</p>
        <button className="btn btn-primary" onClick={() => navigateTo('dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  const isPneumonia = analysis.prediction === 'PNEUMONIA';
  const resultLabel = isPneumonia ? 'AI Prediction: Pneumonia Pattern' : 'AI Prediction: Normal Radiographic Pattern';
  const resultColor = isPneumonia ? '#e11d48' : '#059669';
  const reportDate = new Date(analysis.analyzedAt || new Date()).toLocaleString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  // WhatsApp Pre-filled message (Section 19)
  const whatsappMessage = `Hello ${patient.fullName},

Your PneumoAI X-ray analysis report is ready.

Prediction: ${analysis.prediction}
Confidence: ${analysis.confidence}%
Classification Threshold: 0.65

Please review the generated report and consult a qualified healthcare professional for medical evaluation.

PneumoAI - Educational AI Demonstration.`;

  // Format clean phone number if available
  const cleanPhone = patient.contactNumber ? patient.contactNumber.replace(/[^0-9]/g, '') : '';
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      {/* Top action bar */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={() => navigateTo('detailed')} className="btn btn-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Analysis
        </button>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleDownload} className="btn btn-accent btn-sm" disabled={isGenerating}>
            <Download size={15} /> {isGenerating ? 'Generating PDF...' : 'Download PDF Report'}
          </button>
          <button
            type="button"
            onClick={() => setIsWhatsAppOpen(true)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid #86efac', color: '#15803d', backgroundColor: '#f0fdf4', cursor: 'pointer' }}
            title="Open WhatsApp Web or App to send screening report"
          >
            <Share2 size={15} /> Send Report in WhatsApp
          </button>
          <button onClick={() => navigateTo('consultation')} className="btn btn-primary btn-sm">
            <FileText size={15} /> Consult Doctor
          </button>
        </div>
      </div>
      {reportError && <div className="form-error-msg" style={{ maxWidth: '860px', margin: '0 auto 1rem', display: 'block' }}>{reportError}</div>}

      {/* Report Document */}
      <div 
        ref={reportRef}
        className="report-page-container"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-lg)',
          maxWidth: '860px',
          margin: '0 auto',
          overflow: 'hidden'
        }}
      >
        {/* Report Header */}
        <div 
          style={{
            background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
            color: '#ffffff',
            padding: '2rem 2.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                    Pneumo<span style={{ color: '#38bdf8' }}>AI</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>AI-ASSISTED X-RAY ANALYSIS REPORT</div>
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#94a3b8' }}>
              <div>Generated: {reportDate}</div>
              <div style={{ marginTop: '0.3rem', padding: '2px 8px', background: 'rgba(14, 165, 233, 0.2)', border: '1px solid #0ea5e9', borderRadius: '4px', fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>
                EDUCATIONAL DEMONSTRATION ONLY
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Medical Disclaimer Banner */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.85rem 1rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-md)' }}>
            <ShieldAlert size={18} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
            <p style={{ fontSize: '0.8rem', color: '#92400e', lineHeight: 1.5, margin: 0 }}>
              <strong>Important Medical Disclaimer:</strong> This application is an educational AI demonstration and is not a clinically validated diagnostic system. AI predictions should not be used as a substitute for evaluation by a qualified healthcare professional.
            </p>
          </div>

          {/* 1. Patient Information (NO Patient ID) */}
          <section>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-900)', borderBottom: '2px solid var(--cyan-500)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
              01. Patient Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {[
                { label: 'Full Name', value: patient.fullName },
                { label: 'Age', value: `${patient.age} years` },
                { label: 'Sex', value: patient.sex },
                { label: 'Contact Number', value: patient.contactNumber },
                { label: 'Examination', value: 'Chest Radiograph (CXR)' }
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>{label}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 2. AI Analysis */}
          <section>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-900)', borderBottom: '2px solid var(--cyan-500)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
              02. AI Analysis & Individual Confidence
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: isPneumonia ? '#fff1f2' : '#ecfdf5', borderRadius: 'var(--radius-md)', border: `1px solid ${isPneumonia ? '#fecdd3' : '#a7f3d0'}` }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>AI PREDICTION</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: resultColor, marginTop: '0.2rem' }}>{resultLabel}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>INDIVIDUAL CONFIDENCE</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: resultColor, marginTop: '0.2rem' }}>{analysis.confidence}%</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>MODEL & RESOLUTION</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.35rem' }}>DenseNet121 (224×224)</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLASSIFICATION THRESHOLD</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>0.65</div>
              </div>
            </div>
          </section>

          {/* 3. Image Analysis & Grad-CAM */}
          <section>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-900)', borderBottom: '2px solid var(--cyan-500)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
              03. Visual Image Analysis (Grad-CAM Attention)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Grad-CAM highlights image regions that influenced the model prediction. It is not an exact lesion or disease localization method.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.4rem' }}>Original Chest X-Ray</div>
                <div style={{ backgroundColor: '#0a0f1d', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <img src={xray?.previewUrl} alt="Original CXR" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.4rem' }}>AI Attention Visualization</div>
                <div style={{ backgroundColor: '#0a0f1d', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <img src={analysis.heatmap} alt="Grad-CAM Attention" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.4rem' }}>X-Ray + Grad-CAM Overlay</div>
                <div style={{ backgroundColor: '#0a0f1d', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '220px' }}>
                  <img src={analysis.overlay} alt="Overlay" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          </section>

          {/* 4. Model Test Performance Reference */}
          <section>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--navy-900)', borderBottom: '2px solid var(--cyan-500)', paddingBottom: '0.4rem', marginBottom: '1rem' }}>
              04. Model Test Performance Reference (624 Test Images)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Test Accuracy</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0284c7' }}>91.51%</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Sensitivity (Recall)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>93.33%</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Specificity</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9333ea' }}>88.46%</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pneumonia Precision</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#d97706' }}>93.09%</div>
              </div>
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pneumonia F1-Score</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#db2777' }}>93.21%</div>
              </div>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.4rem' }}>
              Note: The above metrics represent independent model evaluation performance on the test benchmark, not individual patient confidence.
            </p>
          </section>

          {/* 5. WhatsApp Sharing Info */}
          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.88rem' }}>Share Report Summary via WhatsApp</div>
              <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                Open WhatsApp Web or mobile app with pre-filled analysis summary for Dr. Sarah Mitchell or patient
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsWhatsAppOpen(true)}
              className="btn btn-sm"
              style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}
            >
              <ExternalLink size={14} /> Send Report in WhatsApp
            </button>
          </div>

        </div>
      </div>

      {/* Interactive WhatsApp Connection Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        defaultRecipient="doctor"
        reportData={{
          prediction: analysis.prediction,
          confidence: analysis.confidence,
          analyzedAt: analysis.analyzedAt
        }}
      />
    </>
  );
}
