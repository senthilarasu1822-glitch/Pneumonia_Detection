import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ResultCard from '../components/ResultCard';
import ConfidenceCard from '../components/ConfidenceCard';
import XRayViewer from '../components/XRayViewer';
import StepIndicator from '../components/StepIndicator';
import WhatsAppShareModal from '../components/WhatsAppShareModal';
import { ArrowLeft, FileText, RefreshCw, Activity, MapPin, Target, AlertTriangle, MessageCircle } from 'lucide-react';

export default function DetailedResult() {
  const { analysis, xray, navigateTo } = useApp();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  if (!analysis) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
          No analysis data found. Please run a screening first.
        </p>
        <button className="btn btn-accent" onClick={() => navigateTo('upload')}>
          Run New Screening
        </button>
      </div>
    );
  }

  const diseaseSpread = analysis.diseaseSpread || { spread_percentage: 0, severity: 'No Significant Disease Opacity', regions: [] };
  const regions = diseaseSpread.regions || [];

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <StepIndicator currentStep={3} />

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
            STEP 3 OF 3 — RESULT & SPREAD ANALYSIS
          </div>
          <h2 style={{ fontSize: '1.65rem', color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
            AI Screening & Disease Spread Analysis
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            DenseNet121 neural activation analysis with localized disease opacity spread mapping.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigateTo('upload')}>
            <RefreshCw size={15} />
            New Scan
          </button>
          <button className="btn btn-accent btn-sm" onClick={() => navigateTo('report')}>
            <FileText size={15} />
            View Report
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ backgroundColor: '#22c55e', color: '#ffffff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
            onClick={() => setShareModalOpen(true)}
            title="Send full PDF report via WhatsApp"
          >
            <MessageCircle size={15} />
            Send on WhatsApp
          </button>
        </div>
      </div>

      {/* Main Result */}
      <div style={{ marginBottom: '1.5rem' }}>
        <ResultCard
          prediction={analysis.prediction}
          confidence={analysis.confidence}
          threshold={analysis.threshold || 0.65}
        />
      </div>

      {/* Viewer + Confidence Side-by-Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <XRayViewer
          imageUrl={xray?.previewUrl}
          heatmapUrl={analysis.heatmap}
          overlayUrl={analysis.overlay}
          spreadMapUrl={analysis.spreadMap}
          diseaseSpread={diseaseSpread}
          title="Chest X-Ray & AI Attention Viewer"
        />
        <ConfidenceCard
          prediction={analysis.prediction}
          confidence={analysis.confidence}
          probability={analysis.probability ?? analysis.pneumoniaProbability}
          threshold={analysis.threshold || 0.65}
        />
      </div>

      {/* Disease Spread Analysis Breakdown Card */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: analysis.prediction === 'PNEUMONIA' ? '#fff1f2' : '#ecfdf5', color: analysis.prediction === 'PNEUMONIA' ? '#e11d48' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--navy-900)', marginBottom: '0.15rem' }}>
                Disease Spread & Regional Opacity Breakdown
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Quantitative neural opacity density & region localization
              </p>
            </div>
          </div>

          <span className={`badge ${analysis.prediction === 'PNEUMONIA' ? 'badge-suspected' : 'badge-normal'}`}>
            {diseaseSpread.severity || 'N/A'}
          </span>
        </div>

        {/* Spread Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Affected Lung Spread
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: analysis.prediction === 'PNEUMONIA' ? '#e11d48' : '#059669', fontFamily: 'var(--font-heading)' }}>
              {diseaseSpread.spread_percentage || 0}%
            </div>
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '3px', marginTop: '0.5rem', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, diseaseSpread.spread_percentage || 0)}%`,
                  backgroundColor: analysis.prediction === 'PNEUMONIA' ? '#e11d48' : '#059669',
                  borderRadius: '3px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Identified ROI Regions
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--navy-900)', fontFamily: 'var(--font-heading)' }}>
              {regions.length} {regions.length === 1 ? 'Region' : 'Regions'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {regions.length > 0 ? 'High neural opacity zones' : 'Clear pulmonary fields'}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
              Primary Anatomical Zone
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--navy-900)', marginTop: '0.25rem' }}>
              {regions.length > 0 ? regions[0].location : 'Bilateral Clear'}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {regions.length > 0 ? `Peak Activation: ${regions[0].peak_intensity}%` : 'No focal consolidation'}
            </div>
          </div>
        </div>

        {/* Region Breakdown Table/List */}
        {regions.length > 0 ? (
          <div>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={16} style={{ color: '#e11d48' }} />
              Detected Opacity Spread Zones
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {regions.map((r) => (
                <div
                  key={r.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: 'var(--radius-md)',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <MapPin size={16} style={{ color: '#e11d48' }} />
                    <div>
                      <strong style={{ color: '#9f1239', fontSize: '0.88rem' }}>{r.id}: {r.location}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#be123c' }}>
                        Bounding Box: X [{r.bbox_pct?.[0]}%] Y [{r.bbox_pct?.[1]}%] Width [{r.bbox_pct?.[2]}%] Height [{r.bbox_pct?.[3]}%]
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#be123c', textTransform: 'uppercase', fontWeight: 600 }}>Region Area</div>
                      <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.9rem' }}>{r.area_percentage}% of Lung</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.7rem', color: '#be123c', textTransform: 'uppercase', fontWeight: 600 }}>Peak Intensity</div>
                      <div style={{ fontWeight: 700, color: '#9f1239', fontSize: '0.9rem' }}>{r.peak_intensity}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: 'var(--radius-md)', border: '1px solid #a7f3d0', color: '#047857', fontSize: '0.85rem' }}>
            <strong>No Focal Opacity Outlines Detected:</strong> The model did not identify significant high-density pneumonia consolidation zones in this chest radiograph.
          </div>
        )}
      </div>

      <WhatsAppShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        defaultRecipient="patient"
      />
    </div>
  );
}


