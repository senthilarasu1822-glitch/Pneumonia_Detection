import React, { useState, useRef } from 'react';
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Eye,
  Sun, Contrast, Sliders, Layers, Info
} from 'lucide-react';

export default function XRayViewer({
  imageUrl,
  heatmapUrl,
  overlayUrl,
  spreadMapUrl,
  diseaseSpread,
  title = 'Radiology & AI Attention Visualizer'
}) {
  const [zoom, setZoom] = useState(1);
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [overlayOpacity, setOverlayOpacity] = useState(60); // 0 to 100%
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [view, setView] = useState('overlay'); // Default to Overlay view

  const viewerRef = useRef(null);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setInvert(false);
    setBrightness(100);
    setContrast(100);
    setOverlayOpacity(60);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const imageFilterStyle = `
    brightness(${brightness}%) 
    contrast(${contrast}%) 
    ${invert ? 'invert(100%)' : ''}
  `;

  return (
    <div 
      ref={viewerRef}
      className={`card ${isFullscreen ? 'radiology-fullscreen' : ''}`}
      style={{
        padding: '1.25rem',
        backgroundColor: '#0a0f1d',
        borderColor: '#1e293b',
        color: '#ffffff',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        zIndex: isFullscreen ? 9999 : 1,
        borderRadius: isFullscreen ? 0 : 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : '580px',
        overflow: 'hidden'
      }}
    >
      {/* Top Radiology Tool Header */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid #1e293b',
          marginBottom: '0.75rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        {/* The 3 Core Visualization Tabs (Original, AI Attention, Overlay) */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            ['original', '1. Original X-Ray', imageUrl],
            ['heatmap', '2. AI Attention (Grad-CAM)', heatmapUrl],
            ['overlay', '3. X-Ray + Grad-CAM Overlay', overlayUrl],
            ['spread', 'Regional Analysis', spreadMapUrl]
          ].map(([value, label, hasUrl]) => (
            <button
              key={value}
              type="button"
              className="btn btn-sm"
              onClick={() => setView(value)}
              disabled={!hasUrl}
              style={{
                backgroundColor: view === value ? 'var(--cyan-600)' : '#1e293b',
                color: view === value ? '#ffffff' : hasUrl ? '#94a3b8' : '#475569',
                borderColor: view === value ? 'var(--cyan-500)' : '#334155',
                fontSize: '0.75rem',
                fontWeight: view === value ? 700 : 500,
                padding: '0.35rem 0.75rem',
                cursor: hasUrl ? 'pointer' : 'not-allowed'
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Viewport Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowControls(prev => !prev)}
            style={{
              backgroundColor: showControls ? 'rgba(14, 165, 233, 0.2)' : '#1e293b',
              color: showControls ? '#38bdf8' : '#94a3b8',
              borderColor: showControls ? '#0284c7' : '#334155',
              padding: '0.35rem 0.6rem'
            }}
            title="Adjust Radiology Sliders"
          >
            <Sliders size={14} />
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.75}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155', padding: '0.35rem 0.5rem' }}
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>

          <span style={{ fontSize: '0.75rem', color: '#94a3b8', minWidth: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155', padding: '0.35rem 0.5rem' }}
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleReset}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155', padding: '0.35rem 0.5rem' }}
            title="Reset Filters"
          >
            <RotateCcw size={14} />
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={toggleFullscreen}
            style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155', padding: '0.35rem 0.5rem' }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Adjustments Panel (Collapsible or in Overlay Mode) */}
      {(showControls || view === 'overlay') && (
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            padding: '0.6rem 1rem',
            backgroundColor: '#0f172a',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #1e293b',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            fontSize: '0.78rem'
          }}
        >
          {/* Overlay Opacity Slider */}
          {view === 'overlay' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={14} style={{ color: '#38bdf8' }} />
              <span style={{ color: '#cbd5e1' }}>Overlay Opacity:</span>
              <input
                type="range"
                min="10"
                max="90"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseInt(e.target.value))}
                style={{ width: '100px', accentColor: '#0ea5e9' }}
              />
              <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', minWidth: '35px' }}>
                {overlayOpacity}%
              </span>
            </div>
          )}

          {showControls && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sun size={13} style={{ color: '#94a3b8' }} />
                <span style={{ color: '#94a3b8' }}>Brightness:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  style={{ width: '70px', accentColor: '#0ea5e9' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Contrast size={13} style={{ color: '#94a3b8' }} />
                <span style={{ color: '#94a3b8' }}>Contrast:</span>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  style={{ width: '70px', accentColor: '#0ea5e9' }}
                />
              </div>

              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setInvert(v => !v)}
                style={{
                  backgroundColor: invert ? 'rgba(14, 165, 233, 0.2)' : '#1e293b',
                  color: invert ? '#38bdf8' : '#94a3b8',
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.72rem'
                }}
              >
                Invert Grayscale
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Radiology Canvas Viewport */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          borderRadius: 'var(--radius-md)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid #1e293b'
        }}
      >
        <div
          style={{
            position: 'relative',
            transform: `scale(${zoom})`,
            transition: 'transform 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '100%',
            maxWidth: '100%'
          }}
        >
          {/* Base Image depending on view */}
          {view === 'overlay' ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              {/* Original Radiograph underneath */}
              <img
                src={imageUrl}
                alt="Original CXR"
                style={{
                  display: 'block',
                  maxWidth: isFullscreen ? '75vw' : '440px',
                  maxHeight: isFullscreen ? '75vh' : '400px',
                  objectFit: 'contain',
                  filter: imageFilterStyle
                }}
              />
              {/* Grad-CAM Heatmap layer with variable opacity */}
              {heatmapUrl && (
                <img
                  src={heatmapUrl}
                  alt="Grad-CAM Overlay"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: overlayOpacity / 100,
                    mixBlendMode: 'screen',
                    pointerEvents: 'none'
                  }}
                />
              )}
            </div>
          ) : (
            <img
              src={
                view === 'heatmap' ? heatmapUrl :
                view === 'spread' ? (spreadMapUrl || overlayUrl) :
                imageUrl
              }
              alt="Radiology Visualizer"
              style={{
                display: 'block',
                maxWidth: isFullscreen ? '75vw' : '440px',
                maxHeight: isFullscreen ? '75vh' : '400px',
                objectFit: 'contain',
                filter: imageFilterStyle
              }}
            />
          )}
        </div>

        {/* Viewport Bottom Overlay Badge */}
        <div 
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(6px)',
            border: '1px solid #334155',
            borderRadius: 'var(--radius-md)',
            padding: '4px 10px',
            fontSize: '0.72rem',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem'
          }}
        >
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>
            {view === 'original' && 'ORIGINAL CHEST RADIOGRAPH (224×224)'}
            {view === 'heatmap' && 'GRAD-CAM AI ATTENTION HEATMAP (JET)'}
            {view === 'overlay' && `X-RAY + GRAD-CAM OVERLAY (${overlayOpacity}%)`}
            {view === 'spread' && 'ANATOMICAL ZONE SPREAD MAP'}
          </span>
        </div>
      </div>

      {/* Mandatory Scientific Label & Disclaimer */}
      <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.4 }}>
        <Info size={14} style={{ color: '#0ea5e9', flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong>AI Attention Visualization:</strong> Grad-CAM highlights image regions that influenced the DenseNet121 prediction. It represents artificial neural network attention weights, not an exact lesion or disease localization method.
        </span>
      </div>
    </div>
  );
}
