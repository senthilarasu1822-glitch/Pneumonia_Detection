import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  UploadCloud, Camera, RefreshCw, Trash2, ArrowRight,
  CheckCircle2, Sparkles, AlertCircle, Video, X
} from 'lucide-react';

export default function UploadZone({ onAnalyze }) {
  const { xray, setXray, loadSampleXray } = useApp();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [cameraError, setCameraError] = useState('');

  // Clean up camera stream when modal is closed or unmounted
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleFileSelect = (file) => {
    setUploadError('');
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Invalid format. Please upload a chest X-ray in JPG, JPEG, or PNG format.');
      return;
    }

    // Validate size (max 15MB)
    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds 15MB limit. Please provide an optimized radiograph image.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setXray({
        file,
        previewUrl,
        fileName: file.name,
        fileSize: (file.size / 1024).toFixed(1) + ' KB',
        dimensions: `${img.width} × ${img.height} px`,
        isSample: false
      });
    };
    img.src = previewUrl;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = async (type) => {
    setLoadingSample(true);
    setUploadError('');
    await loadSampleXray(type);
    setLoadingSample(false);
  };

  const handleRemove = () => {
    setXray(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Camera Handlers
  const startCamera = async () => {
    setCameraError('');
    setCapturedSnapshot(null);
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera permissions in your browser.');
      } else {
        setCameraError('Unable to access device camera. Please check your camera connection.');
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedSnapshot(null);
    setCameraError('');
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedSnapshot(dataUrl);
  };

  const retakePhoto = () => {
    setCapturedSnapshot(null);
  };

  const useCapturedPhoto = () => {
    if (!canvasRef.current || !capturedSnapshot) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_xray_${Date.now()}.jpg`, { type: 'image/jpeg' });
      setXray({
        file,
        previewUrl: capturedSnapshot,
        fileName: file.name,
        fileSize: (blob.size / 1024).toFixed(1) + ' KB',
        dimensions: `${canvasRef.current.width} × ${canvasRef.current.height} px`,
        isSample: false
      });
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  return (
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto' }}>
      
      {/* Upload Box or Preview Box */}
      {!xray ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: isDragging ? '2.5px dashed var(--cyan-500)' : '2px dashed #cbd5e1',
              borderRadius: 'var(--radius-xl)',
              backgroundColor: isDragging ? 'var(--cyan-50)' : '#ffffff',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isDragging ? '0 10px 25px rgba(14, 165, 233, 0.15)' : 'var(--shadow-sm)'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              accept=".jpg,.jpeg,.png,image/jpeg,image/png"
              style={{ display: 'none' }}
            />

            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'var(--cyan-50)',
                color: 'var(--cyan-600)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 10px rgba(14, 165, 233, 0.15)'
              }}
            >
              <UploadCloud size={32} />
            </div>

            <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: '0.4rem' }}>
              Drop X-ray here <span style={{ color: 'var(--cyan-600)' }}>or Browse Files</span>
            </h3>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Supports standard digital chest radiograph formats (JPG, JPEG, PNG)
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-light)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <span>Max file size: <strong>15 MB</strong></span>
              <span>•</span>
              <span>Input dimension: <strong>DenseNet121 (224×224)</strong></span>
            </div>

            {uploadError && (
              <div 
                style={{ 
                  marginTop: '1.25rem', 
                  padding: '0.6rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  backgroundColor: 'var(--status-suspected-bg)',
                  color: 'var(--status-suspected-text)',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}
          </div>

          {/* Camera Access Option */}
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <button
              type="button"
              onClick={startCamera}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem' }}
            >
              <Camera size={16} style={{ color: 'var(--cyan-600)' }} />
              <span>Use Device Camera</span>
            </button>
          </div>
        </div>
      ) : (
        /* Image Preview State */
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div 
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--status-normal-bg)',
                  color: 'var(--status-normal-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={18} />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--navy-900)' }}>
                Radiograph Ready for DenseNet121 Analysis
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
              >
                <RefreshCw size={14} />
                <span>Replace</span>
              </button>
              <button
                onClick={handleRemove}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--status-suspected-solid)' }}
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            style={{ display: 'none' }}
          />

          {/* Radiograph View Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '380px',
              height: '380px',
              margin: '0 auto 1.5rem',
              backgroundColor: '#0a0f1d',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #1e293b',
              boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.25)'
            }}
          >
            <img
              src={xray.previewUrl}
              alt="Chest X-Ray Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: 'block'
              }}
            />

            {/* Overlay metadata tag */}
            <div 
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '4px',
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {xray.dimensions} • {xray.fileSize}
            </div>

            {xray.isSample && (
              <div 
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: 'rgba(14, 165, 233, 0.9)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                Sample Dataset Image
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
              {xray.fileName}
            </h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Target Modality: Digital Chest Radiograph (CXR) • Model Input: 224×224 Preprocessed
            </p>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={onAnalyze}
            className="btn btn-accent btn-lg"
            style={{ width: '100%', maxWidth: '380px' }}
          >
            <span>Analyze X-Ray</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCamera && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
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
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              padding: '1.5rem',
              color: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Camera size={18} style={{ color: '#38bdf8' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#ffffff' }}>Camera X-Ray Capture</h3>
              </div>
              <button
                onClick={stopCamera}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {cameraError ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                <AlertCircle size={36} style={{ color: '#ef4444', marginBottom: '0.75rem' }} />
                <p style={{ color: '#f87171', marginBottom: '1rem', fontSize: '0.9rem' }}>{cameraError}</p>
                <button onClick={stopCamera} className="btn btn-secondary btn-sm">Close</button>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '320px',
                    backgroundColor: '#000000',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.25rem'
                  }}
                >
                  {!capturedSnapshot ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => videoRef.current?.play()}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <img
                      src={capturedSnapshot}
                      alt="Captured Radiograph"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  )}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  {!capturedSnapshot ? (
                    <button onClick={capturePhoto} className="btn btn-accent">
                      <Camera size={16} />
                      <span>Capture Radiograph</span>
                    </button>
                  ) : (
                    <>
                      <button onClick={retakePhoto} className="btn btn-secondary">
                        <RefreshCw size={16} />
                        <span>Retake</span>
                      </button>
                      <button onClick={useCapturedPhoto} className="btn btn-accent">
                        <CheckCircle2 size={16} />
                        <span>Use This Image</span>
                      </button>
                    </>
                  )}
                  <button onClick={stopCamera} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Demo Samples Section */}
      <div 
        style={{ 
          marginTop: '1.75rem',
          padding: '1.25rem 1.5rem',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={16} style={{ color: 'var(--cyan-600)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--navy-900)' }}>
              Quick Demo Samples (Test Benchmark)
            </span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            One-click test without uploading
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
          <button
            onClick={() => handleSampleClick('normal')}
            disabled={loadingSample}
            className="btn btn-secondary btn-sm"
            style={{ 
              justifyContent: 'flex-start',
              border: '1px solid #a7f3d0',
              backgroundColor: '#f0fdf4',
              padding: '0.65rem 0.9rem'
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.82rem' }}>Sample 1: Normal CXR</div>
              <div style={{ fontSize: '0.7rem', color: '#047857' }}>Ground truth: Normal (Prob &lt; 0.65)</div>
            </div>
          </button>

          <button
            onClick={() => handleSampleClick('pneumonia')}
            disabled={loadingSample}
            className="btn btn-secondary btn-sm"
            style={{ 
              justifyContent: 'flex-start',
              border: '1px solid #fecdd3',
              backgroundColor: '#fff1f2',
              padding: '0.65rem 0.9rem'
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#e11d48' }} />
            <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
              <div style={{ fontWeight: 600, color: '#9f1239', fontSize: '0.82rem' }}>Sample 2: Pneumonia CXR</div>
              <div style={{ fontSize: '0.7rem', color: '#be123c' }}>Ground truth: Pneumonia (Prob &ge; 0.65)</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
