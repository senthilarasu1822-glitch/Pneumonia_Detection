import asyncio
import io
import json
from app import (
    app, health_check, predict, list_appointments, create_appointment,
    approve_appointment, reject_appointment, generate_report,
    AppointmentCreate, AppointmentApprove, ReportRequest, THRESHOLD
)
from starlette.datastructures import UploadFile

print("=== 1. Testing Health Check ===")
hc = health_check()
print("Health check response:", hc)
assert hc["threshold"] == 0.65
assert hc["model"] == "DenseNet121"
print("[OK] Health Check Passed!")

print("\n=== 2. Testing Normal CXR Prediction at Threshold 0.65 ===")
with open("frontend/public/samples/sample_normal.jpeg", "rb") as f:
    normal_bytes = f.read()

upload_normal = UploadFile(filename="normal.jpeg", file=io.BytesIO(normal_bytes), headers={"content-type": "image/jpeg"})
res_norm = asyncio.run(predict(upload_normal))
print("Normal sample prediction:", res_norm["prediction"], "| Prob:", res_norm["pneumonia_probability"], "| Conf:", res_norm["confidence"], "%")
assert res_norm["prediction"] == "NORMAL", f"Expected NORMAL, got {res_norm['prediction']}"
assert res_norm["threshold"] == 0.65
assert res_norm["heatmap"].startswith("data:image/png;base64,")
assert res_norm["overlay"].startswith("data:image/png;base64,")
print("[OK] Normal CXR Test Passed!")

print("\n=== 3. Testing Pneumonia CXR Prediction at Threshold 0.65 ===")
with open("frontend/public/samples/sample_pneumonia.jpeg", "rb") as f:
    pneu_bytes = f.read()

upload_pneu = UploadFile(filename="pneumonia.jpeg", file=io.BytesIO(pneu_bytes), headers={"content-type": "image/jpeg"})
res_pneu = asyncio.run(predict(upload_pneu))
print("Pneumonia sample prediction:", res_pneu["prediction"], "| Prob:", res_pneu["pneumonia_probability"], "| Conf:", res_pneu["confidence"], "%")
assert res_pneu["prediction"] == "PNEUMONIA", f"Expected PNEUMONIA, got {res_pneu['prediction']}"
assert res_pneu["threshold"] == 0.65
assert res_pneu["heatmap"].startswith("data:image/png;base64,")
assert res_pneu["overlay"].startswith("data:image/png;base64,")
print("[OK] Pneumonia CXR Test Passed!")

print("\n=== 4. Testing Appointment Lifecycle (Offline & Online) ===")
# Create Offline Appointment
apt_off_req = AppointmentCreate(
    patient={"fullName": "John Doe", "age": 45, "sex": "Male", "contactNumber": "9876543210"},
    doctor={"name": "Dr. Sarah Mitchell, MD", "clinic": "Metro Pulmonary Care Center", "address": "12 Health Sciences Ave", "phone": "9786113795"},
    consultationType="offline",
    date="2026-09-20",
    time="10:00",
    reason="Routine Follow-up"
)
apt_off = create_appointment(apt_off_req)
print("Created offline appointment:", apt_off["id"], "| Status:", apt_off["status"])
assert apt_off["status"] == "pending"
assert apt_off["consultationType"] == "offline"

# Approve Offline Appointment
appr_off_req = AppointmentApprove(
    date="2026-09-20",
    time="10:30",
    clinicName="Metro Pulmonary Care Center - Suite 300",
    clinicAddress="12 Health Sciences Ave, East Wing",
    instructions="Please arrive 15 minutes before appointment."
)
approved_off = approve_appointment(apt_off["id"], appr_off_req)
print("Approved offline appointment:", approved_off["id"], "| Status:", approved_off["status"], "| Clinic:", approved_off["clinicName"])
assert approved_off["status"] == "approved"
assert approved_off["time"] == "10:30"

# Create Online Appointment
apt_on_req = AppointmentCreate(
    patient={"fullName": "Jane Smith", "age": 28, "sex": "Female", "contactNumber": "9123456789"},
    doctor={"name": "Dr. Sarah Mitchell, MD", "phone": "9786113795"},
    consultationType="online",
    date="2026-09-22",
    time="15:00",
    reason="Discuss scan results"
)
apt_on = create_appointment(apt_on_req)
print("Created online appointment:", apt_on["id"], "| Status:", apt_on["status"])
assert apt_on["status"] == "pending"

# Approve Online Appointment
appr_on_req = AppointmentApprove(date="2026-09-22", time="15:15")
approved_on = approve_appointment(apt_on["id"], appr_on_req)
print("Approved online appointment:", approved_on["id"], "| Status:", approved_on["status"], "| Time:", approved_on["time"])
assert approved_on["status"] == "approved"

# Verify all appointments in list
all_apts = list_appointments()
print("Total appointments registered:", len(all_apts))
assert any(a["id"] == apt_off["id"] for a in all_apts)
assert any(a["id"] == apt_on["id"] for a in all_apts)
print("[OK] Appointment Lifecycle Passed!")

print("\n=== 5. Testing PDF Report Generation ===")
report_req = ReportRequest(
    patient={"fullName": "John Doe", "age": 45, "sex": "Male", "contactNumber": "9876543210"},
    analysis={
        "prediction": res_pneu["prediction"],
        "confidence": res_pneu["confidence"],
        "heatmap": res_pneu["heatmap"],
        "overlay": res_pneu["overlay"]
    },
    originalImage=res_pneu["heatmap"]
)
pdf_response = generate_report(report_req)
assert pdf_response.status_code == 200
assert pdf_response.media_type == "application/pdf"
assert len(pdf_response.body) > 1000
print(f"Generated PDF report size: {len(pdf_response.body)} bytes")
print("[OK] PDF Report Generation Passed!")

print("\n==============================================")
print("ALL BACKEND & MODEL VERIFICATION TESTS PASSED!")
print("==============================================")
