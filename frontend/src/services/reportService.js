const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchReportPdfDocument({ patient, analysis, originalImage }) {
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
      // Keep stable error
    }
    throw new Error(detail);
  }

  const reportUrlHeader = response.headers.get('x-report-url');
  const fallbackName = `pneumoscan-${(patient?.fullName || 'patient').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
  const reportFilename = response.headers.get('x-report-filename') || fallbackName;
  const blob = await response.blob();
  const file = new File([blob], reportFilename, { type: 'application/pdf' });
  const directUrl = reportUrlHeader ? `${API_BASE_URL}${reportUrlHeader}` : null;

  return { blob, file, filename: reportFilename, directUrl };
}

export async function downloadReportPdf({ patient, analysis, originalImage }) {
  const { blob, filename } = await fetchReportPdfDocument({ patient, analysis, originalImage });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return filename;
}
