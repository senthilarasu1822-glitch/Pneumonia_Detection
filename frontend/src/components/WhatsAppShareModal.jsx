import React, { useState } from 'react';
import {
  ExternalLink, Copy, Check, X, Send, User, Stethoscope,
  Globe, Smartphone, MessageCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

function normalizeNumber(raw) {
  let number = String(raw || '').replace(/\D/g, '');
  if (number.length === 10) number = '91' + number;
  if (number.startsWith('0')) number = '91' + number.slice(1);
  return number;
}

function openWhatsApp(raw, message, useWeb = true) {
  const phone = normalizeNumber(raw);
  const text = encodeURIComponent(message);
  const url = useWeb
    ? `https://web.whatsapp.com/send?phone=${phone}&text=${text}`
    : `https://wa.me/${phone}?text=${text}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

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

  const doctorPhone = normalizeNumber(doctor?.phone || '9786113795');
  const patientPhone = normalizeNumber(patient?.contactNumber || '');
  const customFormattedPhone = normalizeNumber(customPhone);

  const activePhone = recipient === 'doctor' 
    ? doctorPhone 
    : recipient === 'patient' 
      ? patientPhone 
      : customFormattedPhone;

  // ─── Full rich message (clipboard only — too long for a URL) ────────────────
  let message = '';
  if (reportData) {
    if (recipient === 'doctor') {
      message = `PneumoAI - Patient X-Ray Screening Report\n\nHello ${doctor?.name || 'Doctor'},\n\nPatient: ${patient?.fullName || 'N/A'} | Age: ${patient?.age || 'N/A'} | Sex: ${patient?.sex || 'N/A'}\nContact: ${patient?.contactNumber || 'N/A'}\n\nAI Result: ${reportData.prediction}\nConfidence: ${reportData.confidence}%\nModel: DenseNet121 (Threshold: 0.65)\nDate: ${reportData.analyzedAt ? new Date(reportData.analyzedAt).toLocaleDateString() : new Date().toLocaleDateString()}\n\nPlease advise on next steps.\n\nThank you,\n${patient?.fullName || 'Patient'}`;
    } else {
      message = `PneumoAI - Your X-Ray Report is Ready\n\nHello ${patient?.fullName || 'Patient'},\n\nAI Result: ${reportData.prediction}\nConfidence: ${reportData.confidence}%\n\nPlease consult a healthcare professional for clinical evaluation.\n\n- PneumoAI`;
    }
  } else if (appointmentData) {
    if (recipient === 'doctor') {
      if (appointmentData.consultationType === 'online') {
        message = `PneumoAI - I am ready for our video consultation.\n\nHello ${doctor?.name || 'Doctor'},\n\nPatient: ${patient?.fullName || 'Patient'}\nScheduled: ${appointmentData.date} at ${appointmentData.time}\n${reportData?.prediction ? `AI Screening: ${reportData.prediction} (${reportData.confidence}%)` : ''}\n\nPlease join the video room.\n\nThank you,\n${patient?.fullName || 'Patient'}`;
      } else {
        message = `PneumoAI - Appointment Confirmation\n\nHello ${doctor?.name || 'Doctor'},\n\nI am confirming my in-person appointment.\n\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\nClinic: ${appointmentData.clinicName || doctor?.clinic || 'N/A'}\nPatient: ${patient?.fullName || 'Patient'}\n\nThank you,\n${patient?.fullName || 'Patient'}`;
      }
    } else {
      if (appointmentData.consultationType === 'offline') {
        message = `PneumoAI - Consultation Approved\n\nHello ${appointmentData.patient?.fullName || patient?.fullName},\n\nYour appointment with ${doctor?.name} is confirmed.\n\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\nClinic: ${appointmentData.clinicName || doctor?.clinic || 'N/A'}\nAddress: ${appointmentData.clinicAddress || doctor?.address || 'N/A'}\n\nThank you,\nPneumoAI`;
      } else {
        message = `PneumoAI - Online Consultation Approved\n\nHello ${appointmentData.patient?.fullName || patient?.fullName},\n\nYour video consultation with ${doctor?.name} is confirmed.\n\nDate: ${appointmentData.date}\nTime: ${appointmentData.time}\n\nThank you,\nPneumoAI`;
      }
    }
  }

  // ─── Short URL-safe message (<250 chars, no emojis) for WhatsApp links ───────
  // Emojis expand to ~12 chars each when URL-encoded; long URLs break WhatsApp.
  let shortMsg = '';
  if (reportData) {
    if (recipient === 'doctor') {
      shortMsg = `PneumoAI Report - Patient: ${patient?.fullName || 'N/A'}, Result: ${reportData.prediction}, Confidence: ${reportData.confidence}%. Please advise. - ${patient?.fullName || 'Patient'}`;
    } else {
      shortMsg = `PneumoAI: Your X-ray result is ready. Result: ${reportData.prediction}, Confidence: ${reportData.confidence}%. Consult a doctor for clinical evaluation.`;
    }
  } else if (appointmentData) {
    if (recipient === 'doctor') {
      shortMsg = appointmentData.consultationType === 'online'
        ? `PneumoAI: I am ready for our video consultation on ${appointmentData.date} at ${appointmentData.time}. - ${patient?.fullName || 'Patient'}`
        : `PneumoAI: Confirming appointment on ${appointmentData.date} at ${appointmentData.time} at ${appointmentData.clinicName || 'clinic'}. - ${patient?.fullName || 'Patient'}`;
    } else {
      shortMsg = appointmentData.consultationType === 'offline'
        ? `PneumoAI: Your appointment with ${doctor?.name} is confirmed for ${appointmentData.date} at ${appointmentData.time}. Clinic: ${appointmentData.clinicName || 'N/A'}.`
        : `PneumoAI: Your online consultation with ${doctor?.name} is confirmed for ${appointmentData.date} at ${appointmentData.time}.`;
    }
  }
  // Trim to 300 chars max as a safety net
  if (shortMsg.length > 300) shortMsg = shortMsg.slice(0, 297) + '...';

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Build URLs using the SHORT message so links actually work
  const encodedShort = encodeURIComponent(shortMsg);
  const waMeUrl = activePhone
    ? `https://wa.me/${activePhone}?text=${encodedShort}`
    : `https://wa.me/?text=${encodedShort}`;
  const webUrl = activePhone
    ? `https://web.whatsapp.com/send?phone=${activePhone}&text=${encodedShort}`
    : `https://web.whatsapp.com/send?text=${encodedShort}`;
  const apiUrl = activePhone
    ? `https://api.whatsapp.com/send?phone=${activePhone}&text=${encodedShort}`
    : `https://api.whatsapp.com/send?text=${encodedShort}`;

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

        {/* Connection Options — window.open() used instead of <a target="_blank">
          to avoid browser popup-blocker on modals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

          {/* Primary: wa.me — most reliable on mobile & desktop */}
          <button
            type="button"
            onClick={() => window.open(waMeUrl, '_blank', 'noopener,noreferrer')}
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
              cursor: 'pointer'
            }}
          >
            <Globe size={18} />
            <span>Open WhatsApp (wa.me — Recommended)</span>
          </button>

          {/* Secondary: WhatsApp Web Browser */}
          <button
            type="button"
            onClick={() => window.open(webUrl, '_blank', 'noopener,noreferrer')}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Smartphone size={16} />
            <span>Open in WhatsApp Web (Browser)</span>
          </button>

          {/* Tertiary: Universal API (desktop app) */}
          <button
            type="button"
            onClick={() => window.open(apiUrl, '_blank', 'noopener,noreferrer')}
            className="btn btn-secondary"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              padding: '0.75rem',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer'
            }}
          >
            <Smartphone size={14} />
            <span>Open in WhatsApp Desktop App</span>
          </button>

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
          💡 <strong>How it works:</strong> The WhatsApp buttons open with a <strong>short summary message</strong> (to ensure the link works on all devices). Use <strong>"Copy Pre-Filled Text"</strong> to get the full detailed message and paste it manually in WhatsApp.
        </p>
      </div>
    </div>
  );
}
