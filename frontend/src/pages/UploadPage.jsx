import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import UploadZone from '../components/UploadZone';
import AnalysisLoader from '../components/AnalysisLoader';
import StepIndicator from '../components/StepIndicator';
import { predictChestXray } from '../services/api';

export default function UploadPage({ analyzing: analyzingProp = false }) {
  const { xray, recordAnalysisResult, navigateTo } = useApp();
  const [analyzing, setAnalyzing] = useState(analyzingProp);
  const [analysisError, setAnalysisError] = useState('');

  // If activePage was set to 'analyzing' from outside, auto-trigger
  useEffect(() => {
    if (analyzingProp) {
      setAnalyzing(true);
    }
  }, [analyzingProp]);

  const handleAnalyze = async () => {
    if (!xray?.file) return;
    setAnalysisError('');
    setAnalyzing(true);
    navigateTo('analyzing');
  };

  const handleLoaderComplete = useCallback(async () => {
    // At this point the loader animation is done, now call the API
    try {
      const result = await predictChestXray(xray.file);
      recordAnalysisResult(result);
      navigateTo('detailed');
    } catch (err) {
      console.error('Prediction failed:', err);
      setAnalysisError(`${err.message || 'The X-ray could not be analyzed.'} Start FastAPI with: .\\.venv-tf\\Scripts\\python.exe -m uvicorn app:app --reload --port 8000`);
      setAnalyzing(false);
      navigateTo('upload');
    }
  }, [navigateTo, recordAnalysisResult, xray]);

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <StepIndicator currentStep={2} />

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          STEP 2 OF 3
        </div>
        <h2 style={{ fontSize: '1.65rem', color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
          {analyzing ? 'AI Analysis in Progress' : 'Upload Chest X-Ray'}
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {analyzing
            ? 'DenseNet121 is processing the radiograph through its 121 dense convolutional layer blocks.'
            : 'Upload a PA/AP chest radiograph image for pneumonia pattern screening via DenseNet121.'}
        </p>
      </div>

      {analyzing ? (
        <AnalysisLoader
          xrayPreview={xray?.previewUrl}
          onComplete={handleLoaderComplete}
        />
      ) : (
        <>
          {analysisError && (
            <div className="form-error-msg" style={{ display: 'block', marginBottom: '1rem', padding: '0.75rem 1rem' }}>
              {analysisError}
            </div>
          )}
          <UploadZone onAnalyze={handleAnalyze} />
        </>
      )}
    </div>
  );
}

