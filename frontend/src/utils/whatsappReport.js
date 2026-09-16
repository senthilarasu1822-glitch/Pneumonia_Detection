function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return '91' + digits;
  if (digits.startsWith('0') && digits.length === 11) return '91' + digits.slice(1);
  return digits;
}
function fmtDate(ts) {
  if (!ts) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export function buildWhatsAppReport(patient, analysis, doctor, recipient = 'doctor') {
  const isPneumonia  = analysis?.prediction === 'PNEUMONIA';
  const resultLabel  = isPneumonia ? 'PNEUMONIA PATTERN DETECTED' : 'NORMAL RADIOGRAPHIC PATTERN';
  const confidence   = analysis?.confidence ?? 'N/A';
  const analysisDate = fmtDate(analysis?.analyzedAt);
  const patientName    = patient?.fullName       || 'N/A';
  const patientAge     = patient?.age            || 'N/A';
  const patientSex     = patient?.sex            || 'N/A';
  const patientContact = patient?.contactNumber  || 'N/A';
  const doctorName   = doctor?.name           || 'Dr. Sarah Mitchell, MD';
  const doctorPhone  = normalizePhone(doctor?.phone || '9786113795');
  const doctorRole   = doctor?.role           || 'Pulmonologist & Radiologist';
  const doctorClinic = doctor?.clinic         || 'Metro Pulmonary Care Center';
  const doctorQual   = doctor?.qualifications || 'MBBS, MD (Radiodiagnosis), FCCP';
  let lines = [];
  if (recipient === 'doctor') {
    lines = [
      '*PneumoAI - Chest X-Ray Screening Report*',
      '_For Medical Review_',
      '',
      '*PATIENT INFORMATION*',
      'Name: ' + patientName,
      'Age / Sex: ' + patientAge + ' yrs / ' + patientSex,
      'Contact: +91 ' + patientContact,
      'Exam Date: ' + analysisDate,
      '',
      '*AI SCREENING RESULT*',
      'Result: *' + resultLabel + '*',
      'Individual Confidence: *' + confidence + '%*',
      'Model: DenseNet121 (121-layer Dense CNN)',
      'Classification Threshold: 0.65',
      '',
      '*MODEL BENCHMARK REFERENCE*',
      'Test Accuracy: 91.51% | Sensitivity: 93.33%',
      'Specificity: 88.46% | Precision: 93.09%',
      '(Evaluated on 624 independent test images)',
      '',
      '*DISCLAIMER:* Educational AI output. NOT a clinical diagnosis.',
      'Professional medical evaluation is required.',
      '',
      'Please advise on next steps.',
      '- ' + patientName
    ];
  } else {
    lines = [
      '*PneumoAI - Your Chest X-Ray Report*',
      '',
      '*PATIENT DETAILS*',
      'Name: ' + patientName,
      'Age / Sex: ' + patientAge + ' yrs / ' + patientSex,
      'Exam Date: ' + analysisDate,
      '',
      '*AI SCREENING RESULT*',
      'Result: *' + resultLabel + '*',
      'Confidence: *' + confidence + '%*',
      'Model: DenseNet121 | Threshold: 0.65',
      '',
      '*YOUR DOCTOR*',
      doctorName,
      doctorRole + ' | ' + doctorQual,
      'Clinic: ' + doctorClinic,
      'WhatsApp: +91 ' + doctorPhone,
      '',
      '*DISCLAIMER:* Educational AI output. NOT a clinical diagnosis.',
      'Please consult your doctor for clinical evaluation.',
      '',
      '- PneumoAI Educational Platform'
    ];
  }
  const message = lines.join('\n');
  const encoded = encodeURIComponent(message);
  const targetPhone = recipient === 'doctor' ? doctorPhone : normalizePhone(patientContact);
  const waMeUrl = targetPhone ? ('https://wa.me/' + targetPhone + '?text=' + encoded) : ('https://wa.me/?text=' + encoded);
  const webUrl  = targetPhone ? ('https://web.whatsapp.com/send?phone=' + targetPhone + '&text=' + encoded) : ('https://web.whatsapp.com/send?text=' + encoded);
  return { message, waMeUrl, webUrl };
}