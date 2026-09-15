import React, { useState } from 'react';
import {
  Check, X, ShieldCheck, Video, Calendar, Clock, MapPin,
  Building, User, Phone, Share2, ExternalLink, ArrowLeft, Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import WhatsAppShareModal from '../components/WhatsAppShareModal';

export default function DoctorDashboard() {
  const {
    appointments, approveAppointment, rejectAppointment, navigateTo,
    setAppointment, doctor
  } = useApp();

  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved' | 'rejected'
  const [approvingApt, setApprovingApt] = useState(null);
  const [selectedAptForWhatsApp, setSelectedAptForWhatsApp] = useState(null);

  // Approval Form State
  const [confirmDate, setConfirmDate] = useState('');
  const [confirmTime, setConfirmTime] = useState('');
  const [confirmClinic, setConfirmClinic] = useState('');
  const [confirmAddress, setConfirmAddress] = useState('');
  const [confirmInstructions, setConfirmInstructions] = useState('');

  const openApprovalModal = (apt) => {
    setApprovingApt(apt);
    setConfirmDate(apt.date || '');
    setConfirmTime(apt.time || '');
    setConfirmClinic(apt.clinicName || doctor.clinic);
    setConfirmAddress(apt.clinicAddress || doctor.address);
    setConfirmInstructions(apt.instructions || 'Please arrive 10–15 minutes before your scheduled appointment.');
  };

  const handleConfirmApproval = async (e) => {
    e.preventDefault();
    if (!approvingApt) return;

    await approveAppointment(approvingApt.id, {
      date: confirmDate,
      time: confirmTime,
      clinicName: confirmClinic,
      clinicAddress: confirmAddress,
      instructions: confirmInstructions
    });

    setApprovingApt(null);
  };

  const filteredAppointments = appointments.filter(a => a.status === activeTab);

  // Format WhatsApp confirmation text for doctor to send to patient
  const getWhatsappConfirmationUrl = (apt) => {
    const isOffline = apt.consultationType === 'offline';
    const message = isOffline
      ? `🏥 Offline Consultation Confirmed

Hello ${apt.patient.fullName},

Your consultation appointment with ${doctor.name} has been approved.

📅 Date: ${apt.date}
🕐 Time: ${apt.time}
🏥 Clinic: ${apt.clinicName || doctor.clinic}
📍 Address: ${apt.clinicAddress || doctor.address}
📝 Instructions:
${apt.instructions || 'Please arrive 10–15 minutes before your appointment.'}

Thank you,
PneumoAI`
      : `Hello ${apt.patient.fullName},

Your online consultation with ${doctor.name} has been approved.

📅 Date: ${apt.date}
🕐 Time: ${apt.time}

Your video consultation will be available in the PneumoAI application at the scheduled time.

Thank you,
PneumoAI`;

    const clean = apt.patient.contactNumber ? apt.patient.contactNumber.replace(/[^0-9]/g, '') : '';
    const phone = clean.length === 10 ? '91' + clean : clean;
    return `https://wa.me/${phone || ''}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span className="badge badge-cyan">PHYSICIAN DASHBOARD</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Doctor WhatsApp: <strong>{doctor.phone}</strong>
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--navy-900)', margin: 0 }}>
            {doctor.name} — Consultation Management
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Review, confirm, and manage online video calls & offline clinic visit requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('consultation')}>
            <ArrowLeft size={15} /> Patient View
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'pending', label: 'Pending Requests', count: appointments.filter(a => a.status === 'pending').length },
          { id: 'approved', label: 'Approved Appointments', count: appointments.filter(a => a.status === 'approved').length },
          { id: 'rejected', label: 'Rejected', count: appointments.filter(a => a.status === 'rejected').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn btn-sm ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-md)', padding: '0.45rem 1rem' }}
          >
            <span>{tab.label}</span>
            <span style={{
              marginLeft: '0.4rem',
              padding: '1px 6px',
              borderRadius: '999px',
              fontSize: '0.7rem',
              backgroundColor: activeTab === tab.id ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-subtle)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)'
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      {filteredAppointments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <ShieldCheck size={36} style={{ color: 'var(--text-light)', marginBottom: '0.75rem' }} />
          <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.25rem' }}>No {activeTab} appointments</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {activeTab === 'pending' ? 'All consultation requests have been evaluated.' : `No appointments in ${activeTab} state.`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {filteredAppointments.map((apt) => (
            <div key={apt.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ color: 'var(--navy-900)', fontSize: '1.2rem', margin: 0 }}>
                      {apt.patient?.fullName}
                    </h3>
                    <span className={`badge ${apt.consultationType === 'online' ? 'badge-cyan' : 'badge-neutral'}`}>
                      {apt.consultationType.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {apt.patient?.age} years • {apt.patient?.sex} • Contact: <strong>{apt.patient?.contactNumber}</strong>
                  </div>
                </div>

                <span className={`badge ${apt.status === 'approved' ? 'badge-normal' : apt.status === 'rejected' ? 'badge-suspected' : 'badge-uncertain'}`}>
                  {apt.status.toUpperCase()}
                </span>
              </div>

              {/* Grid details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--bg-subtle)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>REQUESTED DATE</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>{apt.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>REQUESTED TIME</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--navy-900)' }}>{apt.time}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>REASON FOR CONSULTATION</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--navy-800)' }}>{apt.reason || 'Not specified'}</div>
                </div>
                {apt.consultationType === 'offline' && apt.status === 'approved' && (
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONFIRMED CLINIC</div>
                    <div style={{ fontSize: '0.88rem', color: 'var(--navy-800)' }}>{apt.clinicName}</div>
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                {apt.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-accent btn-sm" onClick={() => openApprovalModal(apt)}>
                      <Check size={15} /> Approve Appointment
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => rejectAppointment(apt.id)}>
                      <X size={15} /> Reject
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Notify via WhatsApp button */}
                    <button
                      type="button"
                      onClick={() => setSelectedAptForWhatsApp(apt)}
                      className="btn btn-sm"
                      style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                    >
                      <ExternalLink size={14} /> Notify Patient via WhatsApp
                    </button>

                    {/* If Online & Approved: Doctor can also join video call */}
                    {apt.status === 'approved' && apt.consultationType === 'online' && (
                      <button
                        className="btn btn-accent btn-sm"
                        onClick={() => {
                          setAppointment(apt);
                          navigateTo('videocall');
                        }}
                      >
                        <Video size={14} /> Join Video Consultation
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval & Confirmation Modal (Sections 23, 24, 25, 48) */}
      {approvingApt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              padding: '2rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-cyan">CONFIRM APPOINTMENT</span>
                <h3 style={{ color: 'var(--navy-900)', margin: '0.25rem 0 0', fontSize: '1.25rem' }}>
                  Approve Consultation for {approvingApt.patient?.fullName}
                </h3>
              </div>
              <button
                onClick={() => setApprovingApt(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                    Confirmed Date *
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={confirmDate}
                    onChange={e => setConfirmDate(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                    Confirmed Time *
                  </label>
                  <input
                    type="time"
                    className="form-input"
                    value={confirmTime}
                    onChange={e => setConfirmTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* If Offline: Collect / confirm clinic details */}
              {approvingApt.consultationType === 'offline' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                      Clinic / Hospital Name *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={confirmClinic}
                      onChange={e => setConfirmClinic(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                      Clinic Address *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={confirmAddress}
                      onChange={e => setConfirmAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
                      Instructions for Patient (Optional)
                    </label>
                    <textarea
                      rows="2"
                      className="form-textarea"
                      value={confirmInstructions}
                      onChange={e => setConfirmInstructions(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setApprovingApt(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent">
                  <Check size={16} /> Confirm & Approve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Share / Notify Modal */}
      <WhatsAppShareModal
        isOpen={!!selectedAptForWhatsApp}
        onClose={() => setSelectedAptForWhatsApp(null)}
        defaultRecipient="patient"
        appointmentData={selectedAptForWhatsApp}
      />
    </div>
  );
}
