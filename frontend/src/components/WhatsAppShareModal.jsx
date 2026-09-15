import React, { useState } from 'react';
import {
  ExternalLink, Copy, Check, X, Send, User, Stethoscope,
  Globe, Smartphone, MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  defaultRecipient = 'doctor', // 'doctor' | 'patient'
  reportData,
  appointmentData
}) {
  const { doctor, patient } = useApp();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [customPhone, setCustomPhone] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Clean and format phone numbers
  const formatPhone = (num) => {
    if (!num) return '';
    const clean = num.replace(/[^0-9]/g, '');
    return clean.length === 10 ? '91' + clean : clean;
  };

  const doctorPhone = formatPhone(doctor?.phone || '9786113795');
  const patientPhone = formatPhone(patient?.contactNumber || '');
  const customFormattedPhone = formatPhone(customPhone);

  const activePhone = recipient === 'doctor' 
    ? doctorPhone 
    : recipient === 'patient' 
      ? patientPhone 
      : customFormattedPhone;

  // Build appropriate message
  let message = '';
  if (reportData) {
    if (recipient === 'doctor') {
      message = `🏥 *PneumoAI — Patient Chest X-Ray Screening Report*

Hello ${doctor?.name || 'Dr. Sarah Mitchell, MD'},

I would like to share my AI-assisted chest X-ray screening analysis for medical review.

👤 *Patient Details:*
• Name: ${patient?.fullName || 'Not provided'}
• Age / Sex: ${patient?.age || 'N/A'} yrs / ${patient?.sex || 'N/A'}
• Contact: ${patient?.contactNumber || 'N/A'}

🔬 *AI Screening Findings:*
• Result: *${reportData.prediction}*
• Confidence: *${reportData.confidence}%*
• Architecture: DenseNet121 (Threshold: 0.65)
• Analysis Date: ${reportData.analyzedAt ? new Date(reportData.analyzedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString()}

*Notice:* This is an AI educational screening output. Please advise if an online video consultation or in-person clinic visit is recommended.

Thank you,
${patient?.fullName || 'Patient'}`;
    } else {
      message = `🏥 *PneumoAI — Chest X-Ray Screening Report*

Hello ${patient?.fullName || 'Patient'},

Your PneumoAI chest radiograph analysis report is ready.

🔬 *AI Result:* ${reportData.prediction}
📊 *Confidence:* ${reportData.confidence}%
⚙️ *Classification Threshold:* 0.65

Please review your report and consult a healthcare professional for clinical evaluation.

Thank you,
PneumoAI`;
    }
  } else if (appointmentData) {
    if (recipient === 'doctor') {
      if (appointmentData.consultationType === 'online') {
        message = `🏥 *Online Video Consultation — Patient Ready*

Hello ${doctor?.name || 'Dr. Sarah Mitchell, MD'},

I am ${patient?.fullName || 'the patient'}. I have joined our online video consultation room on PneumoAI for our scheduled appointment.

📅 *Scheduled:* ${appointmentData.date} at ${appointmentData.time}
👤 *Patient Name:* ${patient?.fullName || 'Patient'}
📞 *Patient Contact:* ${patient?.contactNumber || 'N/A'}
${reportData?.prediction ? `🔬 *AI Screening Result:* ${reportData.prediction} (${reportData.confidence}% confidence)` : ''}

I am ready for our consultation call. Please join the video room or connect with me here on WhatsApp.

Thank you,
${patient?.fullName || 'Patient'}`;
      } else {
        message = `🏥 *Offline Clinic Consultation — Patient Confirmation*

Hello ${doctor?.name || 'Dr. Sarah Mitchell, MD'},

I am confirming my in-person clinic consultation appointment with you.

📅 *Date:* ${appointmentData.date}
🕐 *Time:* ${appointmentData.time}
🏥 *Clinic:* ${appointmentData.clinicName || doctor?.clinic}
📍 *Address:* ${appointmentData.clinicAddress || doctor?.address}
👤 *Patient Name:* ${patient?.fullName || 'Patient'}
📞 *Contact:* ${patient?.contactNumber || 'N/A'}

Thank you,
${patient?.fullName || 'Patient'}`;
      }
    } else {
      if (appointmentData.consultationType === 'offline') {
        message = `🏥 *Offline Consultation Confirmed*

Hello ${appointmentData.patient?.fullName || patient?.fullName},

Your consultation appointment with ${doctor?.name} has been approved.

📅 *Date:* ${appointmentData.date}
🕐 *Time:* ${appointmentData.time}
🏥 *Clinic:* ${appointmentData.clinicName || doctor?.clinic}
📍 *Address:* ${appointmentData.clinicAddress || doctor?.address}
📝 *Instructions:* ${appointmentData.instructions || 'Please arrive 10–15 minutes before your appointment.'}

Thank you,
PneumoAI`;
      } else {
        message = `🏥 *Online Consultation Confirmed*

Hello ${appointmentData.patient?.fullName || patient?.fullName},

Your online video consultation with ${doctor?.name} has been approved.

📅 *Date:* ${appointmentData.date}
🕐 *Time:* ${appointmentData.time}

Your video consultation room will be available in the PneumoAI application at the scheduled time.

Thank you,
PneumoAI`;
      }
    }
  }

  // Universal WhatsApp URLs
  const encodedText = encodeURIComponent(message);
  
  // WhatsApp Web (Direct in browser - best for PC/Laptop, bypasses missing desktop app)
  const webUrl = activePhone
    ? `https://web.whatsapp.com/send?phone=${activePhone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?text=${encodedText}`;

  // WhatsApp Universal API (works on Mobile and launches Desktop app if installed)
  const apiUrl = activePhone
    ? `https://api.whatsapp.com/send?phone=${activePhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // Short wa.me link
  const waMeUrl = activePhone
    ? `https://wa.me/${activePhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '560px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-900)' }}>
                Send Report in WhatsApp
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Connect directly via WhatsApp Web (Browser) or Mobile App
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Recipient Selection Toggle */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            Select Recipient:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setRecipient('doctor')}
              className={`btn btn-sm ${recipient === 'doctor' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.65rem 0.8rem', justifyContent: 'flex-start', border: recipient === 'doctor' ? 'none' : '1px solid var(--border-light)' }}
            >
              <Stethoscope size={16} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Doctor (Dr. Sarah)</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>+91 {doctor?.phone || '9786113795'}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRecipient('patient')}
              className={`btn btn-sm ${recipient === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.65rem 0.8rem', justifyContent: 'flex-start', border: recipient === 'patient' ? 'none' : '1px solid var(--border-light)' }}
            >
              <User size={16} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>Patient (Self)</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>{patient?.contactNumber || 'Patient Contact'}</div>
              </div>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setRecipient('custom')}
              style={{
                fontSize: '0.75rem',
                color: recipient === 'custom' ? 'var(--primary)' : 'var(--text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: recipient === 'custom' ? 700 : 500,
                textDecoration: 'underline'
              }}
            >
              Or enter custom WhatsApp number
            </button>
            {recipient === 'custom' && (
              <input
                type="text"
                placeholder="e.g. 9786113795"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.35rem 0.6rem',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              />
            )}
          </div>
        </div>

        {/* Message Preview Box */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Pre-filled Message Preview:
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: 'none',
                border: 'none',
                color: copied ? '#16a34a' : 'var(--cyan-700)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
            </button>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              fontSize: '0.78rem',
              color: '#334155',
              whiteSpace: 'pre-wrap',
              maxHeight: '150px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.5
            }}
          >
            {message}
          </div>
        </div>

        {/* Connection Options - Direct <a> tags so browser never blocks them */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          
          {/* Primary: WhatsApp Web (Direct in browser, works on any PC without app installed) */}
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
            style={{
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
              textDecoration: 'none'
            }}
          >
            <Globe size={18} />
            <span>Open in WhatsApp Web (Browser)</span>
          </a>

          {/* Secondary: WhatsApp Mobile App / Universal API */}
          <a
            href={apiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            <Smartphone size={16} />
            <span>Open in WhatsApp App / Mobile</span>
          </a>

          {/* Copy button fallback */}
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-secondary btn-sm"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.78rem',
              padding: '0.45rem'
            }}
          >
            <Copy size={13} />
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Pre-Filled Text'}</span>
          </button>
        </div>

        <p style={{ margin: '1rem 0 0', fontSize: '0.73rem', color: '#64748b', textAlign: 'center', lineHeight: 1.45 }}>
          💡 <strong>Tip for PC/Laptop:</strong> Click <strong>"Open in WhatsApp Web (Browser)"</strong> to chat immediately in Chrome or Edge without needing the WhatsApp Desktop app installed.
        </p>
      </div>
    </div>
  );
}
