const PDFDocument = require('pdfkit');

const generatePrescriptionPdf = (customerName, customerEmail, prescriptions) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Clinic Header
  doc
    .fontSize(22)
    .font('Helvetica-Bold')
    .fillColor('#0F172A')
    .text('SpecsUp Optical Care', 40, 40);

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#64748B')
    .text('Official Clinical Prescription History & Optical Records', 40, 68);

  // Divider
  doc
    .moveTo(40, 85)
    .lineTo(555, 85)
    .strokeColor('#CBD5E1')
    .lineWidth(1)
    .stroke();

  // Patient Info Box
  const generatedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Patient Name: ', 40, 95, { continued: true })
    .font('Helvetica')
    .fillColor('#0F172A')
    .text(customerName)
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Email Address: ', 40, 110, { continued: true })
    .font('Helvetica')
    .fillColor('#0F172A')
    .text(customerEmail);

  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Total Records: ', 360, 95, { continued: true })
    .font('Helvetica')
    .fillColor('#0F172A')
    .text(String(prescriptions.length))
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Issued Date: ', 360, 110, { continued: true })
    .font('Helvetica')
    .fillColor('#0F172A')
    .text(generatedAt);

  doc
    .moveTo(40, 130)
    .lineTo(555, 130)
    .strokeColor('#E2E8F0')
    .lineWidth(0.5)
    .stroke();

  let y = 145;

  prescriptions.forEach((rx, idx) => {
    // Check if new page needed
    if (y > 700) {
      doc.addPage();
      y = 40;
    }

    // Prescription Card Header
    doc
      .rect(40, y, 515, 24)
      .fillColor('#1E293B')
      .fill();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#FFFFFF')
      .text(`Examination #${prescriptions.length - idx}  •  Checkup Date: ${rx.checkup_date}`, 48, y + 7);

    y += 24;

    // Table Header
    doc
      .rect(40, y, 515, 20)
      .fillColor('#F1F5F9')
      .fill();

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('Eye', 50, y + 6)
      .text('SPH (Sphere)', 120, y + 6)
      .text('CYL (Cylinder)', 220, y + 6)
      .text('Axis (deg)', 330, y + 6)
      .text('Pupillary Distance (PD)', 430, y + 6);

    y += 20;

    // Right Eye Row
    doc
      .rect(40, y, 515, 18)
      .fillColor('#FFFFFF')
      .fill();

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('OD (Right)', 50, y + 5)
      .font('Helvetica')
      .text(Number(rx.right_sph) >= 0 ? `+${Number(rx.right_sph).toFixed(2)} D` : `${Number(rx.right_sph).toFixed(2)} D`, 120, y + 5)
      .text(Number(rx.right_cyl) >= 0 ? `+${Number(rx.right_cyl).toFixed(2)} D` : `${Number(rx.right_cyl).toFixed(2)} D`, 220, y + 5)
      .text(`${rx.right_axis} deg`, 330, y + 5)
      .text(`${rx.right_pd} mm`, 430, y + 5);

    y += 18;

    // Left Eye Row
    doc
      .rect(40, y, 515, 18)
      .fillColor('#F8FAFC')
      .fill();

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('OS (Left)', 50, y + 5)
      .font('Helvetica')
      .text(Number(rx.left_sph) >= 0 ? `+${Number(rx.left_sph).toFixed(2)} D` : `${Number(rx.left_sph).toFixed(2)} D`, 120, y + 5)
      .text(Number(rx.left_cyl) >= 0 ? `+${Number(rx.left_cyl).toFixed(2)} D` : `${Number(rx.left_cyl).toFixed(2)} D`, 220, y + 5)
      .text(`${rx.left_axis} deg`, 330, y + 5)
      .text(`${rx.left_pd} mm`, 430, y + 5);

    y += 18;

    // Notes
    if (rx.notes) {
      doc
        .rect(40, y, 515, 18)
        .fillColor('#FFFFFF')
        .fill();

      doc
        .fontSize(7.5)
        .font('Helvetica-Oblique')
        .fillColor('#64748B')
        .text(`Clinical Notes: ${rx.notes}`, 50, y + 4);

      y += 18;
    }

    // Border around card
    doc
      .rect(40, y - (rx.notes ? 80 : 62), 515, rx.notes ? 80 : 62)
      .strokeColor('#CBD5E1')
      .lineWidth(0.5)
      .stroke();

    y += 16;
  });

  // Footer Note
  if (y > 750) doc.addPage();
  doc
    .fontSize(7.5)
    .font('Helvetica')
    .fillColor('#94A3B8')
    .text(
      'Notice: This clinical history document is issued for record-keeping and vision monitoring. Consult a certified optometrist before dispensing lenses.',
      40,
      780,
      { align: 'center', width: 515 }
    );

  doc.end();
  return doc;
};

module.exports = { generatePrescriptionPdf };
