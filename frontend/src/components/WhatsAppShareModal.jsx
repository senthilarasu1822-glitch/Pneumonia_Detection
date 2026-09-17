import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Copy, Check, X, Share2,
  ExternalLink, MessageCircle, User, Phone,
  Paperclip, ArrowRight, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchReportPdfDocument, downloadReportPdf } from '../services/reportService';
import { buildWhatsAppReport, normalizePhone } from '../utils/whatsappReport';

export default function WhatsAppShareModal({
  isOpen,
  onClose,
  defaultRecipient = 'patient'
}) {
  const { patient, xray, analysis } = useApp();
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [customPhone, setCustomPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [sharedDirectly, setSharedDirectly] = useState(false);
  const [instructionsVisible, setInstructionsVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset states when opened
  useEffect(() => {
    if (isOpen && patient && analysis) {
      setRecipient(defaultRecipient);
      setSharedDirectly(false);
      setInstructionsVisible(false);
      setErrorMsg('');
      preparePdfDocument();
    }
  }, [isOpen]);

  const preparePdfDocument = async () => {
    try {
      setLoadingPdf(true);
      const doc = await fetchReportPdfDocument({
        patient,
        analysis,
        originalImage: xray?.previewUrl
      });
      setPdfMeta(doc);
      setPdfReady(true);
    } catch (err) {
      console.error('Failed to prepare PDF document:', err);
      setErrorMsg('Could not pre-generate PDF. You can still open WhatsApp with the text summary.');
    } finally {
      setLoadingPdf(false);
    }
  };

  if (!isOpen || !patient || !analysis) return null;

  const targetPhone = recipient === 'patient' 
    ? (patient?.contactNumber || '') 
    : customPhone;

  const { message, waMeUrl, webUrl } = buildWhatsAppReport(
    patient,
    analysis,
    targetPhone,
    pdfMeta?.directUrl || (pdfMeta ? `${window.location.origin}/reports/${pdfMeta.filename}` : null)
  );

  const handleShareDocument = async () => {
    setErrorMsg('');
    try {
      let doc = pdfMeta;
      if (!doc) {
        setLoadingPdf(true);
        doc = await fetchReportPdfDocument({
          patient,
          analysis,
          originalImage: xray?.previewUrl
        });
        setPdfMeta(doc);
      }

      // Check if browser supports sharing native files (Mobile Chrome, Safari, etc.)
      const canShareFiles = typeof navigator !== 'undefined' && 
        navigator.canShare && 
        doc.file && 
        navigator.canShare({ files: [doc.file] });

      if (canShareFiles) {
        await navigator.share({
          files: [doc.file],
          title: `PneumoAI Report - ${patient.fullName}`,
          text: message
        });
        setSharedDirectly(true);
        return;
      }

      // Fallback for Desktop: Auto-download the PDF and open WhatsApp Web with prefilled message
      const blobUrl = URL.createObjectURL(doc.blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      // Open WhatsApp chat in new window
      const openUrl = normalizePhone(targetPhone) ? waMeUrl : webUrl;
      window.open(openUrl, '_blank', 'noopener,noreferrer');

      // Show the guide to attach the file in WhatsApp Web
      setInstructionsVisible(true);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing PDF document:', err);
        setErrorMsg('Sharing document was canceled or not supported on this device. You can download the PDF directly.');
      }
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleDownloadOnly = async () => {
    try {
      setLoadingPdf(true);
      await downloadReportPdf({
        patient,
        analysis,
        originalImage: xray?.previewUrl
      });
    } catch (err) {
      setErrorMsg(err.message || 'Download failed');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 120,
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
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <MessageCircle size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--navy-900)', fontWeight: 700 }}>
                Send Report as PDF Document
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Share official PDF report directly to WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* PDF Document Preview Card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 1.2rem',
            backgroundColor: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '1.25rem'
          }}
        >
          <div
            style={{
              width: '46px',
              height: '52px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              flexShrink: 0
            }}
          >
            <FileText size={22} />
            <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', marginTop: '2px' }}>PDF</span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pdfMeta?.filename || `pneumoai-report-${(patient.fullName || 'patient').toLowerCase()}.pdf`}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
              Patient: <strong>{patient.fullName}</strong> • {analysis.prediction === 'PNEUMONIA' ? '🔴 Pneumonia' : '🟢 Normal'} ({analysis.confidence}%)
            </div>
            <div style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 600, marginTop: '2px' }}>
              {loadingPdf ? '⏳ Compiling diagnostic PDF with Grad-CAM images...' : '✓ Official PDF Document Ready'}
            </div>
          </div>
        </div>

        {/* Recipient Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.04em' }}>
            Send WhatsApp To:
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setRecipient('patient')}
              className={`btn btn-sm ${recipient === 'patient' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.65rem 0.8rem', justifyContent: 'flex-start', border: recipient === 'patient' ? 'none' : '1px solid var(--border-light)' }}
            >
              <User size={15} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Patient Contact</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>{patient?.contactNumber || 'No number'}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRecipient('custom')}
              className={`btn btn-sm ${recipient === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.65rem 0.8rem', justifyContent: 'flex-start', border: recipient === 'custom' ? 'none' : '1px solid var(--border-light)' }}
            >
              <Phone size={15} style={{ flexShrink: 0 }} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Custom Number</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.85 }}>Enter recipient phone</div>
              </div>
            </button>
          </div>

          {recipient === 'custom' && (
            <div style={{ marginTop: '0.5rem' }}>
              <input
                type="text"
                placeholder="Enter 10-digit number or international format (e.g. 9876543210)"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={handleShareDocument}
            disabled={loadingPdf}
            className="btn"
            style={{
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              fontSize: '0.98rem',
              fontWeight: 700,
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
              cursor: loadingPdf ? 'wait' : 'pointer'
            }}
          >
            {loadingPdf ? (
              <>
                <Loader2 size={18} className="spin" />
                <span>Preparing PDF Document...</span>
              </>
            ) : (
              <>
                <MessageCircle size={20} />
                <span>Send PDF Document to WhatsApp</span>
              </>
            )}
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              onClick={handleDownloadOnly}
              disabled={loadingPdf}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              <Download size={15} />
              <span>Download PDF File</span>
            </button>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                padding: '0.6rem',
                fontWeight: 600,
                fontSize: '0.82rem'
              }}
            >
              {copied ? <Check size={15} style={{ color: '#16a34a' }} /> : <Copy size={15} />}
              <span>{copied ? 'Copied with Link!' : 'Copy Text & Link'}</span>
            </button>
          </div>
        </div>

        {/* Guided Step Banner (Shows on Desktop after triggering) */}
        {instructionsVisible && (
          <div
            style={{
              padding: '1rem 1.2rem',
              backgroundColor: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              animation: 'fadeIn 0.2s ease-in-out'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#1d4ed8', fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={18} />
              <span>PDF Downloaded & WhatsApp Web Opened!</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#1e40af', lineHeight: 1.5 }}>
              To attach the document in your opened WhatsApp chat:
              <ol style={{ margin: '0.4rem 0 0.2rem 1.2rem', padding: 0 }}>
                <li>Click the <strong>📎 Paperclip / Attach</strong> icon in WhatsApp.</li>
                <li>Select <strong>Document</strong>.</li>
                <li>Choose the downloaded PDF: <code>{pdfMeta?.filename}</code>.</li>
                <li>Hit <strong>Send</strong>!</li>
              </ol>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="form-error-msg" style={{ display: 'block', marginBottom: '1rem', padding: '0.65rem 0.85rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Message & Document Link Preview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              WhatsApp Message Preview (with PDF Document Link):
            </span>
          </div>

          <div
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem',
              fontSize: '0.75rem',
              color: '#334155',
              whiteSpace: 'pre-wrap',
              maxHeight: '120px',
              overflowY: 'auto',
              fontFamily: 'monospace',
              lineHeight: 1.45
            }}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}
