/**
 * PneumoAI — Backend API Service
 * Handles communication with FastAPI backend:
 * - Prediction & Grad-CAM: POST /predict
 * - Appointments: GET/POST /appointments
 * - Doctor approval/rejection
 * - Health check: GET /
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';


/* =========================================================
   BACKEND HEALTH CHECK
   ========================================================= */

export async function checkBackendStatus() {
  try {
    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 2000);

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


/* =========================================================
   CHEST X-RAY PREDICTION
   POST /predict
   ========================================================= */

export async function predictChestXray(file) {

  // Make sure an image was selected
  if (!file) {
    throw new Error(
      'Select or capture a chest X-ray image before starting analysis.'
    );
  }

  // Create multipart form data
  const formData = new FormData();
  formData.append('file', file);

  try {

    /* -----------------------------------------------------
       DEBUG INFORMATION
       ----------------------------------------------------- */

    console.log(
      'PREDICT URL:',
      `${API_BASE_URL}/predict`
    );

    console.log(
      'PREDICT FILE:',
      file
    );

    console.log(
      'PREDICT FILE NAME:',
      file.name
    );

    console.log(
      'PREDICT FILE TYPE:',
      file.type
    );

    console.log(
      'PREDICT FILE SIZE:',
      file.size
    );


    /* -----------------------------------------------------
       REQUEST TIMEOUT
       ----------------------------------------------------- */

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 120000);


    /* -----------------------------------------------------
       SEND IMAGE TO FASTAPI
       ----------------------------------------------------- */

    console.log('Sending X-ray to FastAPI...');

    const response = await fetch(
      `${API_BASE_URL}/predict`,
      {
        method: 'POST',
        body: formData,
        signal: controller.signal
      }
    );


    clearTimeout(timeoutId);


    /* -----------------------------------------------------
       RESPONSE STATUS
       ----------------------------------------------------- */

    console.log(
      'PREDICT RESPONSE STATUS:',
      response.status
    );

    console.log(
      'PREDICT RESPONSE OK:',
      response.ok
    );


    /* -----------------------------------------------------
       HANDLE SERVER ERROR
       ----------------------------------------------------- */

    if (!response.ok) {

      const errorData =
        await response
          .json()
          .catch(() => ({}));

      console.error(
        'PREDICT SERVER ERROR:',
        errorData
      );

      throw new Error(
        errorData.detail ||
        `Server returned HTTP ${response.status}: ${response.statusText}`
      );
    }


    /* -----------------------------------------------------
       READ JSON RESPONSE
       ----------------------------------------------------- */

    const data = await response.json();

    console.log(
      'PREDICT RESPONSE DATA:',
      data
    );


    /* -----------------------------------------------------
       VALIDATE RESPONSE
       ----------------------------------------------------- */

    if (
      !data.prediction ||
      typeof data.confidence !== 'number' ||
      !data.heatmap ||
      !data.overlay
    ) {

      console.error(
        'INVALID /predict RESPONSE:',
        data
      );

      throw new Error(
        'Invalid response structure received from /predict'
      );
    }


    /* -----------------------------------------------------
       CONVERT RESPONSE TO FRONTEND FORMAT
       ----------------------------------------------------- */

    const result = {

      prediction:
        data.prediction.toUpperCase(),

      confidence:
        parseFloat(
          data.confidence.toFixed(1)
        ),

      probability:
        data.pneumonia_probability ??
        data.probability,

      pneumoniaProbability:
        data.pneumonia_probability,

      normalProbability:
        data.normal_probability,

      threshold:
        data.threshold || 0.65,

      model:
        data.model || 'DenseNet121',

      heatmap:
        data.heatmap,

      overlay:
        data.overlay,

      spreadMap:
        data.spread_map,

      thermalMap:
        data.thermal_map,

      diseaseSpread:
        data.disease_spread || {
          spread_percentage: 0,
          severity: 'No Significant Disease Opacity',
          regions: []
        },

      gradcamLayer:
        data.gradcam_layer,

      isMock:
        false,

      timestamp:
        new Date().toISOString()
    };


    console.log(
      'FINAL PREDICTION RESULT:',
      result
    );


    return result;


  } catch (error) {

    console.error(
      'Prediction failed:',
      error
    );


    /* -----------------------------------------------------
       TIMEOUT ERROR
       ----------------------------------------------------- */

    if (error.name === 'AbortError') {

      throw new Error(
        'Analysis timed out. Check that the FastAPI backend is running and try again.'
      );
    }


    /* -----------------------------------------------------
       OTHER ERRORS
       ----------------------------------------------------- */

    throw new Error(
      error.message ||
      `Backend unavailable at ${API_BASE_URL}.`
    );
  }
}


/* =========================================================
   GET APPOINTMENTS
   GET /appointments
   ========================================================= */

export async function getAppointmentsApi() {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/appointments`
      );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch appointments'
      );
    }

    return await response.json();

  } catch (err) {

    console.warn(
      'Backend appointments fetch error, using local fallback:',
      err
    );

    return null;
  }
}


/* =========================================================
   CREATE APPOINTMENT
   POST /appointments
   ========================================================= */

export async function createAppointmentApi(
  appointmentData
) {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/appointments`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              appointmentData
            )
        }
      );


    if (!response.ok) {

      throw new Error(
        'Failed to create appointment'
      );
    }


    return await response.json();

  } catch (err) {

    console.warn(
      'Backend appointment creation error:',
      err
    );

    return null;
  }
}


/* =========================================================
   APPROVE APPOINTMENT
   POST /appointments/{id}/approve
   ========================================================= */

export async function approveAppointmentApi(
  appointmentId,
  approvalData
) {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}/approve`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              approvalData
            )
        }
      );


    if (!response.ok) {

      throw new Error(
        'Failed to approve appointment'
      );
    }


    return await response.json();

  } catch (err) {

    console.warn(
      'Backend appointment approval error:',
      err
    );

    return null;
  }
}


/* =========================================================
   REJECT APPOINTMENT
   POST /appointments/{id}/reject
   ========================================================= */

export async function rejectAppointmentApi(
  appointmentId
) {

  try {

    const response =
      await fetch(
        `${API_BASE_URL}/appointments/${appointmentId}/reject`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          }
        }
      );


    if (!response.ok) {

      throw new Error(
        'Failed to reject appointment'
      );
    }


    return await response.json();

  } catch (err) {

    console.warn(
      'Backend appointment rejection error:',
      err
    );

    return null;
  }
}