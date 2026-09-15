import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import DoctorCard from '../components/DoctorCard';
import PatientCard from '../components/PatientCard';
import Disclaimer from '../components/Disclaimer';
import {
  MessageSquare, FileText, ArrowLeft, CalendarPlus, ExternalLink,
  Video, Clock, MapPin, Building, Info, AlertTriangle, CheckCircle2
} from 'lucide-react';
import WhatsAppShareModal from '../components/WhatsAppShareModal';

export default function ConsultationPage() {
  const {
    patient, doctor, analysis, appointment, requestAppointment, navigateTo
  } = useApp();
  
  const [consultationType, setConsultationType] = useState('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const submitAppointment = async (event) => {
    event.preventDefault();
    if (!date || !time) return;
    setIsSubmitting(true);
    try {
      await requestAppointment({ consultationType, date, time, reason });
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp Offline confirmation message (Section 25 & 30)
  const offlineWhatsappMessage = appointment ? `🏥 Offline Consultation Confirmed

Hello ${patient?.fullName},

Your consultation appointment with ${doctor?.name} has been approved.

📅 Date: ${appointment.date}
🕐 Time: ${appointment.time}
🏥 Clinic: ${appointment.clinicName || doctor?.clinic}
📍 Address: ${appointment.clinicAddress || doctor?.address}
📝 Instructions:
${appointment.instructions || 'Please arrive 10–15 minutes before your appointment.'}

Thank you,
PneumoAI` : '';

  // WhatsApp Online confirmation message (Section 30)
  const onlineWhatsappMessage = appointment ? `Hello ${patient?.fullName},

Your online consultation with ${doctor?.name} has been approved.

📅 Date: ${appointment.date}
🕐 Time: ${appointment.time}

Your video consultation will be available in the PneumoAI application at the scheduled time.

Thank you,
PneumoAI` : '';

  // Clean phone number for WhatsApp
  const cleanPatientPhone = patient?.contactNumber ? patient.contactNumber.replace(/[^0-9]/g, '') : '';
  const targetPhone = cleanPatientPhone.length === 10 ? '91' + cleanPatientPhone : cleanPatientPhone;

  const currentWhatsappUrl = appointment?.consultationType === 'offline'
    ? `https://wa.me/${targetPhone || ''}?text=${encodeURIComponent(offlineWhatsappMessage)}`
    : `https://wa.me/${targetPhone || ''}?text=${encodeURIComponent(onlineWhatsappMessage)}`;

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
            Doctor Consultation
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Schedule an online video consultation or in-person clinic visit with Dr. Sarah Mitchell.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {analysis && (
            <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('detailed')}>
              <ArrowLeft size={15} /> Back to Results
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('report')}>
            <FileText size={15} /> View Report
          </button>
          <button className="btn btn-sm" onClick={() => navigateTo('doctor-dashboard')} style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: 'var(--navy-800)' }}>
            Doctor Dashboard Demo
          </button>
        </div>
      </div>

      {/* Doctor Information Card */}
      <DoctorCard
        doctor={doctor}
        onViewReport={() => navigateTo('report')}
      />

      {/* Appointment Request / Status Card */}
      <div className="card" style={{ padding: '1.75rem' }}>
        <h3 style={{ color: 'var(--navy-900)', marginBottom: '0.35rem', fontSize: '1.25rem' }}>
          Consultation Booking & Status
        </h3>
        <p style={{ marginBottom: '1.25rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          Select consultation mode (Online Video or In-Person Clinic Visit). All requests require physician confirmation.
        </p>

        {appointment ? (
          <div style={{ backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--border-light)' }}>
            
            {/* Appointment Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  CONSULTATION REQUEST — {appointment.consultationType.toUpperCase()}
                </span>
                <h4 style={{ fontSize: '1.2rem', color: 'var(--navy-900)', marginTop: '0.2rem' }}>
                  {doctor.name}
                </h4>
              </div>

              <span className={`badge ${appointment.status === 'approved' ? 'badge-normal' : appointment.status === 'rejected' ? 'badge-suspected' : 'badge-uncertain'}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                {appointment.status === 'pending' ? 'PENDING DOCTOR APPROVAL' : appointment.status.toUpperCase()}
              </span>
            </div>

            {/* Appointment Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem', backgroundColor: '#ffffff', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED DATE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)' }}>{appointment.date}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>SCHEDULED TIME</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)' }}>{appointment.time}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONSULTATION MODE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)', textTransform: 'capitalize' }}>
                  {appointment.consultationType} Consultation
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>PATIENT CONTACT</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                  {patient.contactNumber}
                </div>
              </div>
            </div>

            {/* Offline-Specific Clinic Details (Section 24) */}
            {appointment.consultationType === 'offline' && appointment.status === 'approved' && (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e40af', fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.5rem' }}>
                  <Building size={16} />
                  <span>Confirmed Clinic Details</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: '#1e3a8a' }}>
                  <div><strong>Clinic:</strong> {appointment.clinicName || doctor.clinic}</div>
                  <div><strong>Address:</strong> {appointment.clinicAddress || doctor.address}</div>
                  {appointment.instructions && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Instructions:</strong> {appointment.instructions}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status Explanations */}
            {appointment.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b45309', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <Clock size={16} />
                <span>Your appointment request is awaiting doctor approval. The doctor will confirm the date and time.</span>
              </div>
            )}

            {appointment.status === 'rejected' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b91c1c', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <AlertTriangle size={16} />
                <span>The doctor was unable to accept this appointment slot. Please try requesting an alternate time.</span>
              </div>
            )}

            {/* Action Buttons based on Rules (Section 29) */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              
              {/* Doctor Dashboard trigger for demo */}
              <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('doctor-dashboard')}>
                Open Doctor Dashboard (Demo)
              </button>

              {/* ONLINE + APPROVED: Video Call Enabled & Direct WhatsApp Connect */}
              {appointment.status === 'approved' && appointment.consultationType === 'online' && (
                <>
                  <button className="btn btn-accent btn-sm" onClick={() => navigateTo('videocall')}>
                    <Video size={16} />
                    <span>Join Video Call</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setIsWhatsAppOpen(true)}
                    style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <ExternalLink size={15} />
                    <span>Connect Doctor on WhatsApp (+91 {doctor.phone})</span>
                  </button>
                </>
              )}

              {/* OFFLINE + APPROVED: WhatsApp Confirmation & NO Video Call */}
              {appointment.status === 'approved' && appointment.consultationType === 'offline' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setIsWhatsAppOpen(true)}
                  style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                >
                  <ExternalLink size={15} />
                  <span>Open WhatsApp Clinic Confirmation</span>
                </button>
              )}

              {/* ONLINE + PENDING: Video Call Disabled */}
              {appointment.status === 'pending' && appointment.consultationType === 'online' && (
                <button className="btn btn-secondary btn-sm" disabled title="Awaiting doctor approval">
                  <Video size={16} />
                  <span>Join Video Call (Disabled until approved)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Request Form */
          <form onSubmit={submitAppointment} style={{ display: 'grid', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                Select Consultation Format
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setConsultationType('online')}
                  className={`btn ${consultationType === 'online' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Video size={16} />
                  <span>Online Video Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('offline')}
                  className={`btn ${consultationType === 'offline' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ justifyContent: 'center', padding: '0.85rem' }}
                >
                  <Building size={16} />
                  <span>In-Person Clinic Visit</span>
                </button>
              </div>
            </div>

            {/* Offline Clinic Notice */}
            {consultationType === 'offline' && (
              <div style={{ padding: '0.85rem 1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 'var(--radius-md)', fontSize: '0.84rem', color: '#166534' }}>
                <strong>Clinic Location:</strong> {doctor.clinic} — {doctor.address}.<br />
                <span style={{ fontSize: '0.78rem', color: '#15803d' }}>Upon approval, exact confirmed time and instructions will be shared via WhatsApp.</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                  Preferred Date *
                </label>
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                  Preferred Time *
                </label>
                <input
                  className="form-input"
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                Reason for Consultation / Medical Notes (Optional)
              </label>
              <textarea
                className="form-textarea"
                rows="3"
                placeholder="E.g., Follow-up on AI chest radiograph screening finding, persistent cough, or second opinion..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>

            <button className="btn btn-accent" type="submit" disabled={isSubmitting} style={{ padding: '0.75rem' }}>
              <CalendarPlus size={16} />
              <span>{isSubmitting ? 'Submitting Request...' : `Request ${consultationType === 'online' ? 'Online Video' : 'Offline In-Person'} Appointment`}</span>
            </button>
          </form>
        )}
      </div>

      {/* Patient Summary + AI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Patient Information
          </h3>
          <PatientCard patient={patient} />
        </div>

        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
            Latest AI Screening
          </h3>
          <div className="card" style={{ padding: '1.25rem' }}>
            {analysis ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, color: analysis.prediction === 'PNEUMONIA' ? '#e11d48' : '#059669' }}>
                    {analysis.prediction}
                  </span>
                  <span style={{ fontWeight: 700 }}>{analysis.confidence}% confidence</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Model: DenseNet121 • Classification Threshold: 0.65
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No screening recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp Share / Connect Modal */}
      <WhatsAppShareModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        defaultRecipient="doctor"
        appointmentData={appointment}
        reportData={analysis ? { prediction: analysis.prediction, confidence: analysis.confidence, analyzedAt: analysis.analyzedAt } : null}
      />
    </div>
  );
}
