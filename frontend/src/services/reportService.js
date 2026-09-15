const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function downloadReportPdf({ patient, analysis, originalImage }) {
  const response = await fetch(`${API_BASE_URL}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient, analysis, originalImage })
  });

  if (!response.ok) {
    let detail = 'Report generation failed.';
    try {
      const data = await response.json();
      detail = data.detail || detail;
    } catch {
      // Keep a stable user-facing error when the server response is not JSON.
    }
    throw new Error(detail);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pneumoscan-${patient.fullName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
