function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function textLine(x, y, size, color, value) {
  return `BT /F1 ${size} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`;
}

export function createCertificatePdf(courseTitle) {
  const content = [
    'q 0.78 0.84 0.91 RG 1.5 w 32 32 728 548 re S Q',
    'q 0.91 0.94 0.98 RG 0.6 w 43 43 526 526 re S Q',
    textLine(277, 525, 10, '0.20 0.39 0.66', 'MICROSOFT LEARNING HUB'),
    textLine(260, 483, 25, '0.12 0.20 0.34', 'CERTIFICATE'),
    textLine(305, 461, 10, '0.37 0.45 0.57', 'OF COMPLETION'),
    textLine(256, 422, 10, '0.40 0.47 0.57', 'THIS CERTIFICATE IS PROUDLY PRESENTED TO'),
    textLine(261, 380, 24, '0.15 0.32 0.55', 'KRANTHI THIMMAYYA'),
    '0.77 0.82 0.88 RG 0.7 w 207 367 m 585 367 l S',
    textLine(250, 339, 11, '0.40 0.47 0.57', 'FOR SUCCESSFULLY COMPLETING'),
    textLine(212, 307, 17, '0.15 0.32 0.55', courseTitle),
    textLine(278, 272, 9, '0.40 0.47 0.57', 'WITH DEDICATION AND COMMITMENT TO LIFELONG LEARNING'),
    textLine(104, 202, 8, '0.46 0.52 0.61', 'COMPLETION DATE'),
    textLine(104, 183, 10, '0.16 0.24 0.36', 'November 18, 2026'),
    textLine(313, 202, 8, '0.46 0.52 0.61', 'CERTIFICATE ID'),
    textLine(313, 183, 10, '0.16 0.24 0.36', 'MLH-2026-AI900-0482'),
    textLine(104, 137, 8, '0.46 0.52 0.61', 'AUTHORIZED ISSUER'),
    textLine(104, 119, 10, '0.16 0.24 0.36', 'Learning Hub Program Director'),
    '0.93 0.95 0.98 rg 654 79 72 72 re f',
    '0.25 0.35 0.50 rg 0.7 w 654 79 72 72 re S',
    textLine(662, 112, 7, '0.35 0.43 0.54', 'QR PLACEHOLDER'),
    textLine(279, 57, 8, '0.61 0.27 0.25', 'SAMPLE CERTIFICATE - NOT AN OFFICIAL MICROSOFT CREDENTIAL'),
  ].join('\n');
  const encoder = new TextEncoder();
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    `5 0 obj\n<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream\nendobj\n`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(encoder.encode(pdf).length);
    pdf += object;
  });
  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: 'application/pdf' });
}
