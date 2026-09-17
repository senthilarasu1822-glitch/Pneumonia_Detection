import asyncio
import io
import json
from app import (
    app, health_check, predict, generate_report,
    ReportRequest, THRESHOLD
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
assert res_norm["heatmap"].startswith("data:image/")
assert res_norm["overlay"].startswith("data:image/")
print("[OK] Normal CXR Test Passed!")

print("\n=== 3. Testing Pneumonia CXR Prediction at Threshold 0.65 ===")
with open("frontend/public/samples/sample_pneumonia.jpeg", "rb") as f:
    pneu_bytes = f.read()

upload_pneu = UploadFile(filename="pneumonia.jpeg", file=io.BytesIO(pneu_bytes), headers={"content-type": "image/jpeg"})
res_pneu = asyncio.run(predict(upload_pneu))
print("Pneumonia sample prediction:", res_pneu["prediction"], "| Prob:", res_pneu["pneumonia_probability"], "| Conf:", res_pneu["confidence"], "%")
assert res_pneu["prediction"] == "PNEUMONIA", f"Expected PNEUMONIA, got {res_pneu['prediction']}"
assert res_pneu["threshold"] == 0.65
assert res_pneu["heatmap"].startswith("data:image/")
assert res_pneu["overlay"].startswith("data:image/")
print("[OK] Pneumonia CXR Test Passed!")

print("\n=== 4. Testing PDF Report Generation ===")
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

