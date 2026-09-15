# PneumoScan AI

Educational React/Vite frontend for the DenseNet121 chest X-ray screening project. Predictions and Grad-CAM images come only from the FastAPI backend; the frontend does not fabricate results when the backend is unavailable.

## Run

From the repository root, install backend dependencies in the existing TensorFlow environment:

```powershell
.\.venv-tf\Scripts\python.exe -m pip install -r requirements.txt
.\.venv-tf\Scripts\python.exe -m uvicorn app:app --reload --port 8000
```

In a second terminal:

```powershell
Set-Location frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.

## Workflow test

Enter name, age, sex, and contact number; upload JPG/JPEG/PNG; verify the real DenseNet121 prediction, confidence, Grad-CAM, and overlay; download the generated PDF; test the encoded WhatsApp report link; request an online appointment and verify it is pending; open **Open Demo Doctor Dashboard**, approve it, and verify **Join Video Consultation** becomes available. Repeat with offline consultation and verify clinic details appear after approval and video remains unavailable.

All doctor profiles, availability, appointment approvals, WhatsApp links, and video calls are explicitly demo/prototype behavior. The PDF and analysis output carry the educational, non-diagnostic disclaimer.
