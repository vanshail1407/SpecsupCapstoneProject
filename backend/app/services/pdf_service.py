import io
from datetime import datetime
from typing import List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_prescription_pdf(customer_name: str, customer_email: str, prescriptions: List[Dict[str, Any]]) -> io.BytesIO:
    """
    Generates a clean, professional medical PDF report containing ONLY
    prescription history, sorted newest to oldest.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0F172A'), # slate-900
        spaceAfter=4
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'), # slate-500
        spaceAfter=12
    )
    meta_label = ParagraphStyle(
        'MetaLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    meta_val = ParagraphStyle(
        'MetaVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    cell_head = ParagraphStyle(
        'CellHead',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white,
        alignment=1
    )
    cell_body = ParagraphStyle(
        'CellBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#1E293B'),
        alignment=1
    )
    cell_notes = ParagraphStyle(
        'CellNotes',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#475569')
    )
    footer_style = ParagraphStyle(
        'FooterNote',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor('#94A3B8'),
        alignment=1
    )

    story = []

    # Clinic Header
    story.append(Paragraph("SpecsUp Optical Care", title_style))
    story.append(Paragraph("Comprehensive Eye Examination & Prescription Record", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284C7'), spaceAfter=14))

    # Patient Meta Summary
    report_date = datetime.now().strftime("%d %B %Y, %I:%M %p")
    meta_data = [
        [
            Paragraph("<b>Patient Name:</b>", meta_label), Paragraph(customer_name, meta_val),
            Paragraph("<b>Report Generated:</b>", meta_label), Paragraph(report_date, meta_val)
        ],
        [
            Paragraph("<b>Patient Email:</b>", meta_label), Paragraph(customer_email, meta_val),
            Paragraph("<b>Total Examinations:</b>", meta_label), Paragraph(str(len(prescriptions)), meta_val)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[90, 180, 110, 160])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # Prescriptions Table (Sorted Newest to Oldest)
    # Header rows:
    # Row 0: [Checkup Date, Right Eye (OD), Left Eye (OS), Notes]
    # Row 1: [Date, SPH | CYL | Axis | PD, SPH | CYL | Axis | PD, Notes]
    table_data = [
        [
            Paragraph("Checkup Date", cell_head),
            Paragraph("RIGHT EYE (OD)<br/><font size=7>SPH / CYL / Axis / PD</font>", cell_head),
            Paragraph("LEFT EYE (OS)<br/><font size=7>SPH / CYL / Axis / PD</font>", cell_head),
            Paragraph("Clinical Notes / Observations", cell_head)
        ]
    ]

    # Sort newest to oldest
    sorted_rx = sorted(prescriptions, key=lambda x: str(x["checkup_date"]), reverse=True)

    for rx in sorted_rx:
        date_str = str(rx.get("checkup_date", ""))
        r_str = f"{float(rx['right_sph']):+.2f} / {float(rx['right_cyl']):+.2f} / {rx['right_axis']} deg / {rx['right_pd']} mm"
        l_str = f"{float(rx['left_sph']):+.2f} / {float(rx['left_cyl']):+.2f} / {rx['left_axis']} deg / {rx['left_pd']} mm"
        notes = rx.get("notes") or "Routine examination."
        
        table_data.append([
            Paragraph(date_str, cell_body),
            Paragraph(r_str, cell_body),
            Paragraph(l_str, cell_body),
            Paragraph(notes, cell_notes)
        ])

    rx_table = Table(table_data, colWidths=[80, 160, 160, 140], repeatRows=1)
    rx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')), # Dark navy header
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#FFFFFF'), colors.HexColor('#F8FAFC')])
    ]))

    story.append(rx_table)
    story.append(Spacer(1, 20))

    # Disclaimer / Footer
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#E2E8F0'), spaceAfter=8))
    story.append(Paragraph(
        "This document is an official electronic prescription history record generated by SpecsUp Optical Care. "
        "Prescription parameters are recorded by authorized optometrists and optical staff.",
        footer_style
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer

