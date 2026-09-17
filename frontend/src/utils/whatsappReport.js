export function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.startsWith('0') && digits.length === 11) return '91' + digits.slice(1);
  return digits;
}

function fmtDate(ts) {
  if (!ts) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function buildWhatsAppReport(patient, analysis, recipient = 'patient', directPdfUrl = null) {
  const isPneumonia  = analysis?.prediction === 'PNEUMONIA';
  const resultLabel  = isPneumonia ? 'PNEUMONIA' : 'NORMAL';
  const confidence   = analysis?.confidence ?? 'N/A';
  const analysisDate = fmtDate(analysis?.analyzedAt);

  const patientName    = patient?.fullName       || 'Patient';
  const patientAge     = patient?.age            || 'N/A';
  const patientSex     = patient?.sex            || 'N/A';
  const patientContact = patient?.contactNumber  || '';

  const lines = [
    '📄 *PNEUMOAI - CHEST X-RAY ANALYSIS REPORT*',
    '━━━━━━━━━━━━━━━━━━━━━━━━━',
    '👤 *Patient Information:*',
    '• Name: ' + patientName,
    '• Age / Sex: ' + patientAge + ' yrs / ' + patientSex,
    '• Contact: ' + (patientContact || 'N/A'),
    '• Examination: Chest Radiograph (CXR)',
    '• Date: ' + analysisDate,
    '',
    '🔍 *AI Screening Result:*',
    '• Diagnostic Classification: *' + resultLabel + '*',
    '• Individual Confidence: *' + confidence + '%*',
    '• Deep Learning Model: DenseNet121',
    '• Decision Threshold: 0.65'
  ];

  if (directPdfUrl) {
    lines.push(
      '',
      '📥 *OFFICIAL PDF REPORT DOCUMENT:*',
      'Download / View PDF: ' + directPdfUrl
    );
  }

  lines.push(
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━',
    '- PneumoAI Screening Platform'
  );

  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  const targetPhone = recipient === 'patient' && patientContact ? normalizePhone(patientContact) : (recipient !== 'patient' && recipient ? normalizePhone(recipient) : '');
  const waMeUrl = targetPhone ? ('https://wa.me/' + targetPhone + '?text=' + encoded) : ('https://wa.me/?text=' + encoded);
  const webUrl  = targetPhone ? ('https://web.whatsapp.com/send?phone=' + targetPhone + '&text=' + encoded) : ('https://web.whatsapp.com/send?text=' + encoded);

  return { message, waMeUrl, webUrl, targetPhone };
}