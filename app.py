from pathlib import Path
import base64
import io
import json
import re
import uuid
from datetime import datetime
from typing import Dict, Any, List

import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import Image as ReportImage
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from reportlab.lib import colors

from gradcam import predict_with_gradcam, THRESHOLD


ROOT = Path(__file__).resolve().parent
MODEL_PATH = ROOT / "model" / "pneumonia_densenet121.keras"
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "application/octet-stream"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
REPORTS_DIR = ROOT / "static" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="PneumoAI API", description="AI-Assisted Pneumonia Detection & Screening Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# ─── Serve built React frontend (production) ─────────────────────────────────
FRONTEND_DIST = ROOT / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

_model = None
_model_error = None


def get_model():
    global _model, _model_error
    if _model is None and _model_error is None:
        try:
            _model = tf.keras.models.load_model(MODEL_PATH, compile=False)
        except Exception as error:
            _model_error = str(error)
    if _model is None:
        raise HTTPException(status_code=503, detail=f"Model loading failed: {_model_error}")
    return _model


# -------------------------------------------------------------
# Models & Schemas
# -------------------------------------------------------------
class ReportRequest(BaseModel):
    patient: dict
    analysis: dict
    originalImage: str | None = None


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/")
def root():
    """Serve the React SPA in production, or return health JSON in dev."""
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {
        "status": "ok",
        "app": "PneumoAI",
        "model": "DenseNet121",
        "threshold": THRESHOLD,
        "model_path": str(MODEL_PATH)
    }


@app.get("/health")
def health():
    """Health check endpoint returning system status and model parameters."""
    return {
        "status": "ok",
        "app": "PneumoAI",
        "model": "DenseNet121",
        "threshold": THRESHOLD,
        "model_path": str(MODEL_PATH)
    }


health_check = health


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="An X-ray image file is required")
    ext = Path(file.filename or "").suffix.lower()
    if (file.content_type not in ALLOWED_TYPES) and (ext not in ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=415, detail="Only JPG, JPEG, and PNG images are supported")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="The uploaded image is empty")
    if len(image_bytes) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The image exceeds the 15 MB limit")

    try:
        result = predict_with_gradcam(get_model(), image_bytes)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=422, detail=f"Image analysis failed: {error}") from error

    probability = result["probability"]
    prediction = "PNEUMONIA" if probability >= THRESHOLD else "NORMAL"
    confidence = probability if prediction == "PNEUMONIA" else (1.0 - probability)

    return {
        "prediction": prediction,
        "pneumonia_probability": round(probability, 4),
        "normal_probability": round(1.0 - probability, 4),
        "confidence": round(confidence * 100, 1),
        "threshold": THRESHOLD,
        "model": "DenseNet121",
        "heatmap": result["heatmap"],
        "overlay": result["overlay"],
        "spread_map": result.get("spread_map"),
        "thermal_map": result.get("thermal_map"),
        "disease_spread": result.get("disease_spread", {}),
        "gradcam_layer": result["layer"],
        "isMock": False,
    }





# -------------------------------------------------------------
# Report Generation
# -------------------------------------------------------------
def decode_data_url(value):
    if not value or "," not in value:
        return None
    return base64.b64decode(value.split(",", 1)[1])


@app.post("/report")
def generate_report(request: ReportRequest):
    try:
        patient = request.patient
        analysis = request.analysis
        
        buffer = io.BytesIO()
        document = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()
        
        header_title_style = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Title'],
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f172a'),
            alignment=0
        )
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#0284c7'),
            fontName='Helvetica-Bold'
        )
        section_heading = ParagraphStyle(
            'SectionHead',
            parent=styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0f172a'),
            fontName='Helvetica-Bold',
            spaceBefore=8,
            spaceAfter=4
        )
        body_regular = ParagraphStyle(
            'BodyRegular',
            parent=styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#334155')
        )
        disclaimer_style = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontSize=8,
            leading=11,
            textColor=colors.HexColor('#64748b'),
            fontName='Helvetica-Oblique'
        )

        story = [
            Paragraph("<b>PNEUMOAI</b>", header_title_style),
            Paragraph("AI-ASSISTED CHEST X-RAY ANALYSIS REPORT", subtitle_style),
            Paragraph("DenseNet121 Deep Learning Architecture • Chest Radiograph Screening", body_regular),
            Spacer(1, 10),
            Paragraph("<b>Patient Information</b>", section_heading),
        ]

        patient_data = [
            [Paragraph(f"<b>Full Name:</b> {patient.get('fullName', 'Not provided')}", body_regular),
             Paragraph(f"<b>Age:</b> {patient.get('age', 'N/A')}", body_regular)],
            [Paragraph(f"<b>Sex:</b> {patient.get('sex', 'N/A')}", body_regular),
             Paragraph(f"<b>Contact:</b> {patient.get('contactNumber', 'N/A')}", body_regular)],
            [Paragraph(f"<b>Examination:</b> Chest X-Ray (CXR)", body_regular),
             Paragraph(f"<b>Date:</b> {analysis.get('analyzedAt', datetime.utcnow().strftime('%d %B %Y, %H:%M'))}", body_regular)]
        ]
        patient_table = Table(patient_data, colWidths=[3.5 * inch, 3.5 * inch])
        patient_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(patient_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("<b>AI Analysis Results</b>", section_heading))
        is_pneumonia = analysis.get("prediction") == "PNEUMONIA"
        pred_color = "#dc2626" if is_pneumonia else "#16a34a"
        pred_text = f"<font color='{pred_color}'><b>AI Prediction: {analysis.get('prediction', 'UNAVAILABLE')}</b></font>"

        analysis_data = [
            [Paragraph(pred_text, body_regular),
             Paragraph(f"<b>Individual Confidence:</b> {analysis.get('confidence', 'N/A')}%", body_regular)],
            [Paragraph(f"<b>Model:</b> DenseNet121 (Preprocessed 224×224)", body_regular),
             Paragraph(f"<b>Classification Threshold:</b> {THRESHOLD}", body_regular)]
        ]
        analysis_table = Table(analysis_data, colWidths=[3.5 * inch, 3.5 * inch])
        analysis_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#94a3b8')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(analysis_table)
        story.append(Spacer(1, 10))

        story.append(Paragraph("<b>Radiographic Image Analysis & AI Attention</b>", section_heading))
        story.append(Paragraph("Grad-CAM neural activation maps highlight anatomical regions influencing the deep learning prediction.", body_regular))
        story.append(Spacer(1, 6))

        image_cells = []
        raw_xray = decode_data_url(request.originalImage)
        raw_heat = decode_data_url(analysis.get("heatmap"))
        raw_over = decode_data_url(analysis.get("overlay"))

        row1 = []
        if raw_xray:
            row1.append([Paragraph("<b>Original Chest X-Ray</b>", body_regular),
                         ReportImage(io.BytesIO(raw_xray), width=2.2 * inch, height=2.2 * inch, kind="proportional")])
        if raw_heat:
            row1.append([Paragraph("<b>AI Attention (Grad-CAM)</b>", body_regular),
                         ReportImage(io.BytesIO(raw_heat), width=2.2 * inch, height=2.2 * inch, kind="proportional")])
        if raw_over:
            row1.append([Paragraph("<b>X-Ray + Grad-CAM Overlay</b>", body_regular),
                         ReportImage(io.BytesIO(raw_over), width=2.2 * inch, height=2.2 * inch, kind="proportional")])

        if row1:
            headers = [c[0] for c in row1]
            imgs = [c[1] for c in row1]
            img_table = Table([headers, imgs], colWidths=[2.3 * inch] * len(row1))
            img_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(img_table)
            story.append(Spacer(1, 10))

        story.append(Paragraph("<b>Model Test Performance Reference</b>", section_heading))
        perf_data = [
            [Paragraph("<b>Model Architecture:</b> DenseNet121", body_regular),
             Paragraph("<b>Test Set Images:</b> 624 chest radiographs", body_regular)],
            [Paragraph("<b>Test Accuracy:</b> 91.51%", body_regular),
             Paragraph("<b>Sensitivity (Recall):</b> 93.33%", body_regular)],
            [Paragraph("<b>Specificity:</b> 88.46%", body_regular),
             Paragraph("<b>Pneumonia Precision:</b> 93.09%", body_regular)],
            [Paragraph("<b>Pneumonia F1-Score:</b> 93.21%", body_regular),
             Paragraph("<b>Confusion Matrix:</b> [[207, 27], [26, 364]]", body_regular)]
        ]
        perf_table = Table(perf_data, colWidths=[3.5 * inch, 3.5 * inch])
        perf_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#f1f5f9')),
            ('TOPPADDING', (0, 0), (-1, -1), 3),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ]))
        story.append(perf_table)
        story.append(Paragraph("<i>Note: The above metrics represent independent model evaluation performance on the test benchmark, not individual patient confidence.</i>", disclaimer_style))
        document.build(story)
        pdf_bytes = buffer.getvalue()

        # Save a persistent document copy for WhatsApp sharing & direct link access
        raw_name = patient.get("fullName", "patient")
        safe_name = re.sub(r'[^a-zA-Z0-9]+', '-', str(raw_name)).strip('-').lower() or "patient"
        doc_id = uuid.uuid4().hex[:8]
        report_filename = f"pneumoai-report-{safe_name}-{doc_id}.pdf"
        report_path = REPORTS_DIR / report_filename
        report_path.write_bytes(pdf_bytes)

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={report_filename}",
                "X-Report-Filename": report_filename,
                "X-Report-Url": f"/reports/{report_filename}",
                "Access-Control-Expose-Headers": "Content-Disposition, X-Report-Filename, X-Report-Url"
            }
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {error}") from error


@app.get("/reports/{filename}")
def get_report_file(filename: str):
    """Serve persistent generated PDF reports for direct WhatsApp & document sharing."""
    file_path = (REPORTS_DIR / filename).resolve()
    if not str(file_path).startswith(str(REPORTS_DIR.resolve())) or not file_path.exists():
        raise HTTPException(status_code=404, detail="Report document not found")
    return FileResponse(
        str(file_path),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename={filename}"}
    )


# -------------------------------------------------------------
# SPA Catch-All — must be LAST so API routes take priority
# Returns index.html for any unmatched path (React Router)
# -------------------------------------------------------------
from fastapi import Request

@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(request: Request, full_path: str):
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(str(index))
    raise HTTPException(status_code=404, detail="Not found")
