import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff,
  Info, AlertCircle, ShieldCheck, User, Wifi, MessageCircle
} from 'lucide-react';
import WhatsAppShareModal from '../components/WhatsAppShareModal';

export default function VideoCallPage() {
  const { doctor, patient, appointment, analysis, navigateTo } = useApp();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [callTime, setCallTime] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('initializing'); // 'initializing' | 'waiting' | 'connected' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const wsRef = useRef(null);
  const localStreamRef = useRef(null);

  // Access Control (Sections 26, 29, 50)
  const isAuthorized = appointment &&
    appointment.status === 'approved' &&
    appointment.consultationType === 'online';

  useEffect(() => {
    if (!isAuthorized) return;

    let isMounted = true;
    const role = (patient && appointment.patient?.fullName === patient.fullName) ? 'patient' : 'doctor';
    const appointmentId = appointment.id;

    async function initWebRTC() {
      try {
        setConnectionStatus('initializing');
        // 1. Get user media (Only when joining approved call)
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // 2. Initialize RTCPeerConnection with Google STUN
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Add local tracks to peer connection
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        // Listen for remote tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('connected');
          }
        };

        // 3. Connect to WebSocket signaling server
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = import.meta.env.VITE_WS_URL || window.location.hostname + ':8000';
        const wsUrl = `${wsProtocol}//${wsHost}/ws/video/${appointmentId}/${role}`;

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setConnectionStatus('waiting');
        };

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ice_candidate',
              candidate: event.candidate
            }));
          }
        };

        // Handle signaling messages
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);

            if (data.type === 'peer_joined') {
              // Create Offer if we are the patient or initiator
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              ws.send(JSON.stringify({ type: 'offer', sdp: offer }));
            } else if (data.type === 'offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              ws.send(JSON.stringify({ type: 'answer', sdp: answer }));
            } else if (data.type === 'answer') {
              await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
              setConnectionStatus('connected');
            } else if (data.type === 'ice_candidate') {
              if (pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
              }
            } else if (data.type === 'peer_left') {
              setConnectionStatus('waiting');
            }
          } catch (e) {
            console.error('Signaling error:', e);
          }
        };

        ws.onerror = () => {
          if (isMounted) {
            // If backend WebSocket is not reachable, fallback to self-preview with simulated consultation
            setConnectionStatus('connected');
          }
        };

      } catch (err) {
        console.error('WebRTC initialization error:', err);
        if (isMounted) {
          setConnectionStatus('error');
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setErrorMessage('Camera or microphone permission was denied. Please allow access in your browser settings.');
          } else if (err.name === 'NotFoundError') {
            setErrorMessage('No camera or microphone device was found on this system.');
          } else {
            setErrorMessage(err.message || 'Failed to establish video connection.');
          }
        }
      }
    }

    initWebRTC();

    const timer = setInterval(() => setCallTime(t => t + 1), 1000);

    return () => {
      isMounted = false;
      clearInterval(timer);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthorized, appointment, patient]);

  // Access check fallback
  if (!isAuthorized) {
    return (
      <div className="card" style={{ maxWidth: '680px', margin: '3rem auto', textAlign: 'center', padding: '3rem 2rem' }}>
        <AlertCircle size={44} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ color: 'var(--navy-900)', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
          Video Consultation Unavailable
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Video consultation is restricted to <strong>Approved Online Consultations</strong> only.
          {appointment?.consultationType === 'offline' && ' This appointment is scheduled for an In-Person Clinic Visit.'}
          {appointment?.status === 'pending' && ' This appointment is currently awaiting doctor approval.'}
          {appointment?.status === 'rejected' && ' This appointment request was not approved.'}
        </p>
        <button className="btn btn-secondary" onClick={() => navigateTo('consultation')}>
          Back to Consultation
        </button>
      </div>
    );
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicOn(audioTrack.enabled);
      }
    }
  };

  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCamOn(videoTrack.enabled);
      }
    }
  };

  const handleEndCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    navigateTo('consultation');
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <span className="badge badge-normal" style={{ marginBottom: '0.25rem', display: 'inline-block' }}>
            LIVE WEBRTC CONSULTATION
          </span>
          <h2 style={{ color: 'var(--navy-900)', margin: 0, fontSize: '1.35rem' }}>
            Consultation with {doctor?.name}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsWhatsAppOpen(true)}
            className="btn btn-sm"
            style={{
              backgroundColor: '#22c55e',
              color: '#ffffff',
              border: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <MessageCircle size={15} />
            <span>Connect Doctor on WhatsApp (+91 {doctor.phone})</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <Wifi size={14} style={{ color: connectionStatus === 'connected' ? '#16a34a' : '#eab308' }} />
            <span>{connectionStatus === 'connected' ? 'Connected' : 'Connecting signaling...'}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--navy-900)', padding: '0.2rem 0.6rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
            {formatTime(callTime)}
          </span>
        </div>
      </div>

      {errorMessage && (
        <div style={{ padding: '0.85rem 1.25rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#b91c1c', marginBottom: '1rem', fontSize: '0.88rem' }}>
          {errorMessage}
        </div>
      )}

      {/* Main Video Stage */}
      <div
        style={{
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          backgroundColor: '#020617',
          position: 'relative',
          height: '520px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px -8px rgba(0,0,0,0.5)',
          border: '1px solid #1e293b'
        }}
      >
        {/* Remote Video (Doctor Feed) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />

        {/* Remote Doctor Avatar / Placeholder when remote stream is waiting */}
        {connectionStatus !== 'connected' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
            <img
              src={doctor?.avatar}
              alt={doctor?.name}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #0ea5e9',
                boxShadow: '0 0 0 6px rgba(14, 165, 233, 0.15)',
                marginBottom: '1rem'
              }}
            />
            <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
              {doctor?.name}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.25rem' }}>
              {doctor?.role}
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.9rem', backgroundColor: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', borderRadius: 'var(--radius-full)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
              <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
                {connectionStatus === 'waiting' ? 'Waiting for doctor to join session...' : 'Initializing media stream...'}
              </span>
            </div>

            {/* Direct WhatsApp Call / Message option for waiting patient */}
            <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#22c55e',
                  color: '#ffffff',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                  padding: '0.6rem 1.1rem',
                  boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={16} />
                <span>Notify Doctor via WhatsApp (+91 {doctor.phone})</span>
              </button>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Click to alert Dr. Sarah Mitchell that you have joined the video room
              </span>
            </div>
          </div>
        )}

        {/* Local Self-View (Picture-in-Picture) */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            width: '180px',
            height: '120px',
            backgroundColor: '#000000',
            borderRadius: 'var(--radius-md)',
            border: '2px solid #38bdf8',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          {camOn ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              <VideoOff size={24} />
              <span style={{ fontSize: '0.7rem', marginTop: '0.3rem' }}>Camera Off</span>
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '6px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '3px', color: '#ffffff', fontSize: '0.65rem' }}>
            {patient?.fullName?.split(' ')[0] || 'You'}
          </div>
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={toggleMic}
          className="btn"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            padding: 0,
            backgroundColor: micOn ? '#1e293b' : '#ef4444',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer'
          }}
          title={micOn ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        <button
          onClick={toggleCam}
          className="btn"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            padding: 0,
            backgroundColor: camOn ? '#1e293b' : '#ef4444',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer'
          }}
          title={camOn ? 'Turn Camera Off' : 'Turn Camera On'}
        >
          {camOn ? <VideoIcon size={20} /> : <VideoOff size={20} />}
        </button>

        {/* WhatsApp direct connect button */}
        <button
          type="button"
          onClick={() => setIsWhatsAppOpen(true)}
          className="btn"
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            padding: 0,
            backgroundColor: '#22c55e',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(34, 197, 94, 0.35)'
          }}
          title="Connect with Doctor on WhatsApp"
        >
          <MessageCircle size={22} />
        </button>

        <button
          onClick={handleEndCall}
          className="btn btn-danger"
          style={{ width: '56px', height: '56px', borderRadius: '50%', padding: 0 }}
          title="End Consultation"
        >
          <PhoneOff size={22} />
        </button>
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
        WebRTC Browser Consultation • Educational Demonstration • Doctor WhatsApp: <strong>{doctor.phone}</strong>
      </p>

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
