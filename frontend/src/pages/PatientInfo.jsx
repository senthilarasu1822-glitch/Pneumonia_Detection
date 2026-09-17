import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';
import StepIndicator from '../components/StepIndicator';
import { Shield, Cpu, FileText, Activity, ArrowRight, Lock, CheckCircle2 } from 'lucide-react';

const INITIAL_FORM = { fullName: '', age: '', sex: '', contactNumber: '' };

export default function PatientInfo() {
  const { savePatientInfo, navigateTo } = useApp();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) e.age = 'Please enter a valid age (1–120)';
    if (!form.sex) e.sex = 'Please select sex';
    if (!form.contactNumber.trim()) e.contactNumber = 'Contact number is required';
    else if (!/^[\d\s\-+()]{7,15}$/.test(form.contactNumber)) e.contactNumber = 'Enter a valid contact number';
    return e;
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    savePatientInfo({ ...form, age: parseInt(form.age) });
  };

  const features = [
    { icon: Cpu, title: 'AI-Assisted Image Analysis', desc: 'DenseNet121 deep learning pattern recognition' },
    { icon: Activity, title: 'Fast X-Ray Processing', desc: 'Automated chest radiograph screening in seconds' },
    { icon: FileText, title: 'Detailed Analysis Reports', desc: 'Comprehensive structured clinical-style reports' }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div 
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: '100vh'
        }}
        className="patient-info-grid"
      >
        {/* LEFT COLUMN: Branding & Features */}
        <div
          style={{
            background: 'linear-gradient(160deg, var(--navy-950) 0%, var(--navy-850) 50%, #0a2a4a 100%)',
            padding: '3rem 3.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Decorative background circles */}
          <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.08)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: 'rgba(20, 184, 166, 0.06)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '2rem' }}>
              <Logo size="lg" light showTagline />
            </div>

            <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#0ea5e9', marginBottom: '0.85rem', padding: '0.3rem 0.75rem', border: '1px solid rgba(14, 165, 233, 0.35)', borderRadius: 'var(--radius-full)' }}>
              AI-POWERED CHEST X-RAY SCREENING
            </span>

            <h1 style={{ fontSize: '2.6rem', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
              Intelligent Chest<br />
              <span style={{ background: 'linear-gradient(90deg, #38bdf8, #14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                X-Ray Analysis
              </span>
            </h1>

            <p style={{ fontSize: '1rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: '420px' }}>
              Advanced deep learning technology designed to assist with chest X-ray screening and pneumonia pattern detection using DenseNet121 convolutional architecture.
            </p>

            {/* Feature List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.5rem' }}>
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.9rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.25)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.15rem' }}>{title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.75rem 1rem', background: 'rgba(14, 165, 233, 0.08)', border: '1px solid rgba(14, 165, 233, 0.2)', borderRadius: 'var(--radius-md)' }}>
              <Lock size={16} style={{ color: '#38bdf8', flexShrink: 0 }} />
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Patient data is stored locally in session only. No data is transmitted externally without backend connection.
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Patient Form */}
        <div
          style={{
            backgroundColor: '#f8fafc',
            padding: '3rem 3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: '440px', width: '100%', margin: '0 auto' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => navigateTo('landing')}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem' }}
              >
                ← Back to Home
              </button>
            </div>

            {/* Step Indicator */}
            <StepIndicator currentStep={1} />

            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
                STEP 1 OF 3
              </div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                Patient Information
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Enter the patient's details before beginning the chest X-ray analysis.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="e.g. John Smith"
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  autoComplete="off"
                />
                {errors.fullName && <span className="form-error-msg">{errors.fullName}</span>}
              </div>

              {/* Age + Sex Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Age <span className="required">*</span></label>
                  <input
                    type="number"
                    className={`form-input ${errors.age ? 'error' : ''}`}
                    placeholder="e.g. 35"
                    value={form.age}
                    min="1"
                    max="120"
                    onChange={(e) => handleChange('age', e.target.value)}
                  />
                  {errors.age && <span className="form-error-msg">{errors.age}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Sex <span className="required">*</span></label>
                  <select
                    className={`form-select ${errors.sex ? 'error' : ''}`}
                    value={form.sex}
                    onChange={(e) => handleChange('sex', e.target.value)}
                  >
                    <option value="">Select sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sex && <span className="form-error-msg">{errors.sex}</span>}
                </div>
              </div>

              {/* Contact Number */}
              <div className="form-group">
                <label className="form-label">Contact Number <span className="required">*</span></label>
                <input
                  type="tel"
                  className={`form-input ${errors.contactNumber ? 'error' : ''}`}
                  placeholder="e.g. +91 98765 43210"
                  value={form.contactNumber}
                  onChange={(e) => handleChange('contactNumber', e.target.value)}
                  autoComplete="off"
                />
                {errors.contactNumber && <span className="form-error-msg">{errors.contactNumber}</span>}
              </div>

              {/* Submit */}
              <button type="submit" className="btn btn-accent btn-lg" style={{ marginTop: '0.5rem', width: '100%' }}>
                <span>Continue to X-Ray Analysis</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Privacy Notice */}
            <div style={{ marginTop: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: '#0369a1', lineHeight: 1.55 }}>
              <strong>Privacy Notice:</strong> Patient information is stored securely in your session and used only for the analysis workflow and report generation.
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Style */}
      <style>{`
        @media (max-width: 768px) {
          .patient-info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
