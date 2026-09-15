from pathlib import Path
import base64
import io
import json
from datetime import datetime
from typing import Dict, Any, List

import tensorflow as tf
from fastapi import FastAPI, File, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
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
APPOINTMENTS_FILE = ROOT / "appointments.json"
ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png"}

app = FastAPI(title="PneumoAI API", description="Pneumonia Detection & Clinical Consultation Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
# Appointment Persistence & State
# -------------------------------------------------------------
def load_appointments() -> List[Dict[str, Any]]:
    if not APPOINTMENTS_FILE.exists():
        return []
    try:
        with open(APPOINTMENTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_appointments(appointments: List[Dict[str, Any]]):
    try:
        with open(APPOINTMENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(appointments, f, indent=2)
    except Exception as e:
        print(f"Error saving appointments: {e}")


# -------------------------------------------------------------
# WebSocket Video Signaling Manager
# -------------------------------------------------------------
class VideoConnectionManager:
    def __init__(self):
        # rooms: {appointment_id: {role: WebSocket}}
        self.rooms: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, appointment_id: str, role: str):
        await websocket.accept()
        if appointment_id not in self.rooms:
            self.rooms[appointment_id] = {}
        self.rooms[appointment_id][role] = websocket
        # Notify room peers that someone connected
        await self.broadcast_to_peer(appointment_id, role, {
            "type": "peer_joined",
            "role": role,
            "appointment_id": appointment_id
        })

    def disconnect(self, appointment_id: str, role: str):
        if appointment_id in self.rooms:
            if role in self.rooms[appointment_id]:
                del self.rooms[appointment_id][role]
            if not self.rooms[appointment_id]:
                del self.rooms[appointment_id]

    async def broadcast_to_peer(self, appointment_id: str, sender_role: str, message: dict):
        if appointment_id in self.rooms:
            for peer_role, ws in list(self.rooms[appointment_id].items()):
                if peer_role != sender_role:
                    try:
                        await ws.send_json(message)
                    except Exception:
                        pass


video_manager = VideoConnectionManager()


# -------------------------------------------------------------
# Models & Schemas
# -------------------------------------------------------------
class ReportRequest(BaseModel):
    patient: dict
    analysis: dict
    originalImage: str | None = None


class AppointmentCreate(BaseModel):
    patient: dict
    doctor: dict
    consultationType: str  # "online" or "offline"
    date: str
    time: str
    reason: str = ""


class AppointmentApprove(BaseModel):
    date: str
    time: str
    clinicName: str | None = None
    clinicAddress: str | None = None
    instructions: str | None = None


# -------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------
@app.get("/")
def health_check():
    return {
        "status": "ok",
        "app": "PneumoAI",
        "model": "DenseNet121",
        "threshold": THRESHOLD,
        "model_path": str(MODEL_PATH)
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="An X-ray image file is required")
    if file.content_type not in ALLOWED_TYPES:
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
# Appointments Endpoints
# -------------------------------------------------------------
@app.get("/appointments")
def list_appointments():
    return load_appointments()


@app.post("/appointments")
def create_appointment(data: AppointmentCreate):
    appointments = load_appointments()
    appointment_id = f"APT-{int(datetime.utcnow().timestamp() * 1000)}"
    new_apt = {
        "id": appointment_id,
        "patient": data.patient,
        "doctor": data.doctor,
        "consultationType": data.consultationType.lower(),
        "date": data.date,
        "time": data.time,
        "status": "pending",
        "reason": data.reason,
        "createdAt": datetime.utcnow().isoformat(),
        "clinicName": data.doctor.get("clinic", "Metro Medical Center"),
        "clinicAddress": data.doctor.get("address", "12 Health Sciences Avenue, Academic District"),
        "instructions": "Please arrive 10-15 minutes prior to scheduled appointment." if data.consultationType.lower() == "offline" else ""
    }
    appointments.insert(0, new_apt)
    save_appointments(appointments)
    return new_apt


@app.get("/appointments/{appointment_id}")
def get_appointment(appointment_id: str):
    appointments = load_appointments()
    for apt in appointments:
        if apt["id"] == appointment_id:
            return apt
    raise HTTPException(status_code=404, detail="Appointment not found")


@app.post("/appointments/{appointment_id}/approve")
def approve_appointment(appointment_id: str, data: AppointmentApprove):
    appointments = load_appointments()
    for apt in appointments:
        if apt["id"] == appointment_id:
            apt["status"] = "approved"
            apt["date"] = data.date
            apt["time"] = data.time
            if data.clinicName:
                apt["clinicName"] = data.clinicName
            if data.clinicAddress:
                apt["clinicAddress"] = data.clinicAddress
            if data.instructions:
                apt["instructions"] = data.instructions
            save_appointments(appointments)
            return apt
    raise HTTPException(status_code=404, detail="Appointment not found")


@app.post("/appointments/{appointment_id}/reject")
def reject_appointment(appointment_id: str):
    appointments = load_appointments()
    for apt in appointments:
        if apt["id"] == appointment_id:
            apt["status"] = "rejected"
            save_appointments(appointments)
            return apt
    raise HTTPException(status_code=404, detail="Appointment not found")


# -------------------------------------------------------------
# WebSocket Video Consultation Signaling
# -------------------------------------------------------------
@app.websocket("/ws/video/{appointment_id}/{role}")
async def video_signaling(websocket: WebSocket, appointment_id: str, role: str):
    # Verify appointment exists and is approved online consultation
    appointments = load_appointments()
    apt = next((a for a in appointments if a["id"] == appointment_id), None)
    
    # Allow connection if appointment exists and is approved online
    if apt and (apt["status"] != "approved" or apt["consultationType"] != "online"):
        await websocket.close(code=4003, reason="Appointment not authorized for online consultation")
        return

    await video_manager.connect(websocket, appointment_id, role)
    try:
        while True:
            data = await websocket.receive_json()
            # Forward signaling payload to peer
            await video_manager.broadcast_to_peer(appointment_id, role, data)
    except WebSocketDisconnect:
        video_manager.disconnect(appointment_id, role)
        await video_manager.broadcast_to_peer(appointment_id, role, {
            "type": "peer_left",
            "role": role,
            "appointment_id": appointment_id
        })
    except Exception as e:
        video_manager.disconnect(appointment_id, role)


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
            Paragraph("Educational Demonstration System • DenseNet121 Architecture", body_regular),
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
        story.append(Paragraph("Grad-CAM highlights image regions that influenced the model prediction. It is not an exact lesion or disease localization method.", body_regular))
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
        story.append(Spacer(1, 10))

        story.append(Paragraph("<b>Medical Disclaimer</b>", section_heading))
        story.append(Paragraph(
            "This application is an educational AI demonstration and is not a clinically validated diagnostic system. "
            "AI predictions and visual attention heatmaps should not be used as a substitute for evaluation by a qualified healthcare professional.",
            disclaimer_style
        ))

        document.build(story)
        return Response(
            content=buffer.getvalue(),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=pneumoai-report.pdf"}
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {error}") from error
