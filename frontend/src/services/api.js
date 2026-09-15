/**
 * PneumoAI — Backend API Service
 * Handles communication with FastAPI backend:
 * - Prediction & Grad-CAM: POST /predict
 * - Appointments: GET/POST /appointments, POST /appointments/{id}/approve, POST /appointments/{id}/reject
 * - Health check: GET /
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function checkBackendStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Send chest X-ray image to DenseNet121 model endpoint
 */
export async function predictChestXray(file) {
  if (!file) {
    throw new Error('Select or capture a chest X-ray image before starting analysis.');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server returned HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.prediction || typeof data.confidence !== 'number' || !data.heatmap || !data.overlay) {
      throw new Error('Invalid response structure received from /predict');
    }

    return {
      prediction: data.prediction.toUpperCase(),
      confidence: parseFloat(data.confidence.toFixed(1)),
      probability: data.pneumonia_probability ?? data.probability,
      pneumoniaProbability: data.pneumonia_probability,
      normalProbability: data.normal_probability,
      threshold: data.threshold || 0.65,
      model: data.model || 'DenseNet121',
      heatmap: data.heatmap,
      overlay: data.overlay,
      spreadMap: data.spread_map,
      thermalMap: data.thermal_map,
      diseaseSpread: data.disease_spread || { spread_percentage: 0, severity: 'No Significant Disease Opacity', regions: [] },
      gradcamLayer: data.gradcam_layer,
      isMock: false,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Analysis timed out. Check that the FastAPI backend is running and try again.');
    }
    throw new Error(error.message || `Backend unavailable at ${API_BASE_URL}.`);
  }
}

/**
 * Fetch all appointments from backend
 */
export async function getAppointmentsApi() {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`);
    if (!response.ok) throw new Error('Failed to fetch appointments');
    return await response.json();
  } catch (err) {
    console.warn('Backend appointments fetch error, using local fallback:', err);
    return null;
  }
}

/**
 * Create an appointment
 */
export async function createAppointmentApi(appointmentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentData)
    });
    if (!response.ok) throw new Error('Failed to create appointment');
    return await response.json();
  } catch (err) {
    console.warn('Backend appointment creation error:', err);
    return null;
  }
}

/**
 * Doctor approves appointment
 */
export async function approveAppointmentApi(appointmentId, approvalData) {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalData)
    });
    if (!response.ok) throw new Error('Failed to approve appointment');
    return await response.json();
  } catch (err) {
    console.warn('Backend appointment approval error:', err);
    return null;
  }
}

/**
 * Doctor rejects appointment
 */
export async function rejectAppointmentApi(appointmentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to reject appointment');
    return await response.json();
  } catch (err) {
    console.warn('Backend appointment rejection error:', err);
    return null;
  }
}
